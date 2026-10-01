import { useRef, useState } from 'react';
import { Copy } from 'lucide-react';
import styles from './OcrPanel.module.css';

export type EstadoOcr =
  | { estado: 'lendo' }
  | { estado: 'pronto'; texto: string }
  | { estado: 'erro'; mensagem: string };

export function OcrPanel({ estado, onFechar }: { estado: EstadoOcr; onFechar: () => void }) {
  const [rotuloCopiar, setRotuloCopiar] = useState('Copiar');
  const textoRef = useRef<HTMLParagraphElement>(null);

  function selecionarTexto() {
    const no = textoRef.current;
    if (!no) return;
    const range = document.createRange();
    range.selectNodeContents(no);
    const selecao = window.getSelection();
    selecao?.removeAllRanges();
    selecao?.addRange(range);
  }

  async function copiar() {
    if (estado.estado !== 'pronto') return;
    try {
      await navigator.clipboard.writeText(estado.texto);
      setRotuloCopiar('Copiado');
      setTimeout(() => setRotuloCopiar('Copiar'), 2000);
    } catch {
      selecionarTexto();
      setRotuloCopiar('Selecione e copie');
    }
  }

  return (
    <div className={styles.painel}>
      <span className={styles.titulo}>Texto detectado</span>

      {estado.estado === 'lendo' && (
        <div className={styles.centro}>
          <span className={styles.spinner} />
          <span className={styles.aviso}>Lendo texto...</span>
        </div>
      )}

      {estado.estado === 'erro' && (
        <div className={styles.centro}>
          <span className={styles.aviso}>{estado.mensagem}</span>
        </div>
      )}

      {estado.estado === 'pronto' && (
        <p ref={textoRef} className={styles.texto}>
          {estado.texto}
        </p>
      )}

      <div className={styles.acoes}>
        {estado.estado === 'pronto' && (
          <button className={styles['btn-painel']} onClick={copiar}>
            <Copy size={14} strokeWidth={2} /> {rotuloCopiar}
          </button>
        )}
        <button className={styles['btn-painel']} onClick={onFechar}>
          Fechar
        </button>
      </div>
    </div>
  );
}
