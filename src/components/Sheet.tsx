import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type AnimationEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useShellEl } from './Shell';
import { useCamadaModal } from '../lib/camadaModal';

// Cada sheet aninhado sobe um nível para empilhar acima do anterior.
const ProfundidadeContext = createContext(0);

type SheetProps = {
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function Sheet({ titulo, onFechar, children, footer }: SheetProps) {
  const shell = useShellEl();
  const profundidade = useContext(ProfundidadeContext);
  const [fechando, setFechando] = useState(false);
  const painelRef = useRef<HTMLDivElement>(null);
  const tituloId = useId();

  // Roda a animação de saída antes de desmontar de fato.
  const iniciarFechamento = useCallback(() => setFechando(true), []);

  useCamadaModal(iniciarFechamento);

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    painelRef.current?.focus();
    return () => anterior?.focus?.();
  }, []);

  function aoTerminarAnimacao(evento: AnimationEvent<HTMLDivElement>) {
    if (evento.target !== evento.currentTarget) return;
    if (fechando) onFechar();
  }

  const zBackdrop = 30 + profundidade * 2;

  const conteudo = (
    <ProfundidadeContext.Provider value={profundidade + 1}>
      <button
        type="button"
        className="sheet-backdrop"
        style={{ zIndex: zBackdrop }}
        data-closing={fechando}
        onClick={iniciarFechamento}
        aria-label={`Fechar ${titulo}`}
      />
      <div
        ref={painelRef}
        className="sheet"
        style={{ zIndex: zBackdrop + 1 }}
        data-closing={fechando}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        onAnimationEnd={aoTerminarAnimacao}
      >
        <span className="sheet-handle" aria-hidden="true" />
        <div className="sheet-header">
          <h2 id={tituloId}>{titulo}</h2>
          <button
            type="button"
            className="btn-icon-sm"
            onClick={iniciarFechamento}
            aria-label="Fechar"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-footer">{footer}</div>}
      </div>
    </ProfundidadeContext.Provider>
  );

  return shell ? createPortal(conteudo, shell) : conteudo;
}
