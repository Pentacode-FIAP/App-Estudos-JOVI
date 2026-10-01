import { createContext, useContext } from 'react';

/**
 * Elemento `.app-shell` usado como alvo de portal por sheets e diálogos.
 *
 * Sem o portal, um sheet aberto de dentro de outro sheet seria posicionado
 * em relação ao sheet pai (que é `position: absolute`) e recortado pelo
 * scroll dele. Portando tudo para o shell, cada camada se posiciona contra
 * a moldura do app.
 */
export const ShellContext = createContext<HTMLElement | null>(null);

export function useShellEl(): HTMLElement | null {
  return useContext(ShellContext);
}
