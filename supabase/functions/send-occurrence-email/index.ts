// supabase/functions/send-occurrence-email/index.ts
//
// Envia o e-mail de alerta de uma ocorrência via API oficial do Gmail,
// autenticando com uma conta de envio dedicada (via refresh token guardado
// como secret). Isso substitui o fluxo antigo, que dependia de cada
// professor autorizar o Gmail no navegador e, quando isso falhava, vazava
// os dados da ocorrência para um serviço de terceiro (formsubmit.co).
//
// Requer, configurados como secrets desta função (Dashboard do Supabase >
// Edge Functions > Manage secrets, ou `supabase secrets set`):
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
//   GOOGLE_REFRESH_TOKEN
//   GMAIL_SENDER_EMAIL   (o endereço da conta Gmail dona do refresh token)
//
// Autenticação do chamador: o "Verify JWT" do painel do Supabase sozinho
// NÃO é suficiente aqui — ele aceita a anon key também (que é pública,
// embutida no navegador de qualquer visitante). Por isso, a função checa
// explicitamente, usando supabase.auth.getUser(), que quem está chamando
// é uma sessão de usuário de verdade, e que esse usuário tem um cargo
// aprovado (não "Pendente") na tabela collaborators.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildMimeEmail(
  { from, to, subject, bodyHtml }: { from: string; to: string; subject: string; bodyHtml: string },
): string {
  const mimeLines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    btoa(unescape(encodeURIComponent(bodyHtml))),
  ];
  return mimeLines.join("\r\n");
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não suportado." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("SUPABASE_URL/SUPABASE_ANON_KEY ausentes (secrets padrão do projeto).");
    return jsonResponse({ error: "Configuração do servidor incompleta." }, 500);
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });

  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return jsonResponse({ error: "Não autenticado." }, 401);
  }

  const { data: myRecord } = await authClient
    .from("collaborators")
    .select("system_role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myRecord || myRecord.system_role === "Pendente") {
    return jsonResponse({ error: "Conta sem permissão para disparar e-mails." }, 403);
  }

  let payload: { to?: string; subject?: string; bodyHtml?: string };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Corpo da requisição inválido (esperado JSON)." }, 400);
  }

  const { to, subject, bodyHtml } = payload;
  if (!to || !subject || !bodyHtml) {
    return jsonResponse({ error: "Campos obrigatórios: to, subject, bodyHtml." }, 400);
  }

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN");
  const senderEmail = Deno.env.get("GMAIL_SENDER_EMAIL");

  if (!clientId || !clientSecret || !refreshToken || !senderEmail) {
    console.error("Faltam secrets do Google nesta Edge Function.");
    return jsonResponse({ error: "Envio de e-mail não configurado no servidor." }, 500);
  }

  try {
    // 1) Troca o refresh token por um access token novo (eles expiram em ~1h)
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Falha ao renovar token do Google:", tokenData);
      return jsonResponse({ error: "Falha ao autenticar com o Google." }, 502);
    }

    // 2) Monta e envia o e-mail via Gmail API, como a conta dona do refresh token
    const mimeRaw = buildMimeEmail({ from: senderEmail, to, subject, bodyHtml });
    const raw = base64UrlEncode(mimeRaw);

    const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });
    const sendData = await sendRes.json();

    if (!sendRes.ok) {
      console.error("Falha ao enviar via Gmail API:", sendData);
      return jsonResponse({ error: "Falha ao enviar e-mail via Gmail." }, 502);
    }

    return jsonResponse({
      id: sendData.id,
      statusText: `Entregue via Gmail API (ID: ${sendData.id})`,
    });
  } catch (err) {
    console.error("Erro inesperado em send-occurrence-email:", err);
    return jsonResponse({ error: "Erro inesperado no envio de e-mail." }, 500);
  }
});
