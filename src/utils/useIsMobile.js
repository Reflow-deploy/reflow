import { useState, useEffect } from 'react';

const MOBILE_QUERY = '(max-width: 767px)';

/**
 * Hook compartilhado de breakpoint mobile (<768px). Cada componente que
 * precisa adaptar seu layout chama isso independentemente — não há um
 * booleano global prop-drilled a partir de App.jsx (o projeto não usa
 * Context API em lugar nenhum), exceto o estado isSidebarOpen, que
 * precisa ser compartilhado entre Header (botão hambúrguer) e Sidebar
 * (o próprio painel) e por isso mora em App.jsx como o resto do estado.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const handleChange = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
}
