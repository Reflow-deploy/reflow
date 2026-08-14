# Regras de Desenvolvimento do Projeto APP-REFLOW

## Design System Obrigatório
Antes de criar, gerar ou puxar qualquer componente (seja do 21st.dev ou outro lugar):
1. **Consulte o Design System**: Leia sempre os arquivos em [design-system/](file:///c:/Users/Mario/Downloads/APP-REFLOW/design-system), especialmente o [theme-Reflow.css](file:///c:/Users/Mario/Downloads/APP-REFLOW/design-system/theme-Reflow.css).
2. **Siga à Risca**: Aplique estritamente as variáveis de design, como cores (`--background`, `--foreground`, `--primary`, `--accent`, etc.), tipografia (`--font-sans`, `--font-mono`), sombras e arredondamentos (`--radius`).
3. **Adaptação Total**: Modifique e refatore qualquer componente importado para que ele utilize os tokens do design system do projeto em vez de valores ou cores personalizadas hardcoded.
