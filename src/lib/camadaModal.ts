import { useEffect } from 'react';

/**
 * Pilha das camadas modais abertas (sheets e diálogos).
 *
 * O listener de Escape fica no `document`, então todas as camadas abertas o
 * escutam ao mesmo tempo. Como os listeners disparam na ordem de registro, a
 * camada externa responderia primeiro e fecharia junto a aninhada. A pilha
 * garante que só a do topo reaja.
 */
const pilha: symbol[] = [];

export function useCamadaModal(aoFechar: () => void) {
  useEffect(() => {
    const token = Symbol('camada');
    pilha.push(token);

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key !== 'Escape') return;
      if (pilha[pilha.length - 1] !== token) return;
      evento.preventDefault();
      aoFechar();
    }

    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      const i = pilha.indexOf(token);
      if (i !== -1) pilha.splice(i, 1);
    };
  }, [aoFechar]);
}
