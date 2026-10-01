import {
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
import { useShellEl } from './Shell';
import { useCamadaModal } from '../lib/camadaModal';

type Pedido = {
  titulo: string;
  descricao: string;
  rotuloConfirmar: string;
  destrutivo: boolean;
  resolver: (ok: boolean) => void;
};

type OpcoesConfirmacao = {
  titulo: string;
  descricao: string;
  rotuloConfirmar?: string;
  destrutivo?: boolean;
};

/**
 * Substitui `window.confirm`, que não é estilizável, bloqueia a thread e
 * quebra a moldura do app. Devolve o elemento a renderizar e uma função que
 * resolve `true`/`false`.
 */
export function useConfirmacao() {
  const [pedido, setPedido] = useState<Pedido | null>(null);

  const confirmar = useCallback(
    (opcoes: OpcoesConfirmacao) =>
      new Promise<boolean>((resolver) => {
        setPedido({
          titulo: opcoes.titulo,
          descricao: opcoes.descricao,
          rotuloConfirmar: opcoes.rotuloConfirmar ?? 'Confirmar',
          destrutivo: opcoes.destrutivo ?? false,
          resolver,
        });
      }),
    [],
  );

  const responder = useCallback(
    (ok: boolean) => {
      pedido?.resolver(ok);
      setPedido(null);
    },
    [pedido],
  );

  const dialogoConfirmacao = pedido ? (
    <ConfirmDialog pedido={pedido} onResponder={responder} />
  ) : null;

  return { confirmar, dialogoConfirmacao };
}

function ConfirmDialog({
  pedido,
  onResponder,
}: {
  pedido: Pedido;
  onResponder: (ok: boolean) => void;
}) {
  const shell = useShellEl();
  const [saindo, setSaindo] = useState<boolean | null>(null);
  const caixaRef = useRef<HTMLDivElement>(null);
  const tituloId = useId();
  const descricaoId = useId();

  const cancelar = useCallback(() => setSaindo(false), []);
  useCamadaModal(cancelar);

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    caixaRef.current?.focus();
    return () => anterior?.focus?.();
  }, []);

  function aoTerminarAnimacao(evento: AnimationEvent<HTMLDivElement>) {
    if (evento.target !== evento.currentTarget) return;
    if (saindo !== null) onResponder(saindo);
  }

  const conteudo: ReactNode = (
    <>
      <button
        type="button"
        className="sheet-backdrop"
        style={{ zIndex: 40 }}
        data-closing={saindo !== null}
        onClick={cancelar}
        aria-label="Cancelar"
      />
      <div className="dialog-wrap" style={{ zIndex: 41 }}>
        <div
          ref={caixaRef}
          className="dialog"
          data-closing={saindo !== null}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={tituloId}
          aria-describedby={descricaoId}
          tabIndex={-1}
          onAnimationEnd={aoTerminarAnimacao}
        >
          <h2 id={tituloId}>{pedido.titulo}</h2>
          <p id={descricaoId}>{pedido.descricao}</p>
          <div className="dialog-acoes">
            <button type="button" onClick={cancelar}>
              Cancelar
            </button>
            <button
              type="button"
              className={pedido.destrutivo ? 'btn-destrutivo' : 'btn-primary'}
              onClick={() => setSaindo(true)}
            >
              {pedido.rotuloConfirmar}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return shell ? createPortal(conteudo, shell) : conteudo;
}
