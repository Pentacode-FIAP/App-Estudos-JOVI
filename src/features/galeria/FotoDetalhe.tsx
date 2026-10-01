import { useState } from 'react';
import { Check, Copy, ScanText } from 'lucide-react';
import { db } from '../../lib/db';
import { runOcr } from '../../lib/gemini';
import { Sheet } from '../../components/Sheet';
import { Toast } from '../../components/Toast';
import { Skeleton } from '../../components/Skeleton';
import { useObjectUrl } from '../../lib/useObjectUrl';
import { NovoResumoSheet } from '../estudar/NovoResumoSheet';
import type { Foto } from '../../types';

export function FotoDetalhe({ foto, onFechar }: { foto: Foto; onFechar: () => void }) {
  const [criandoResumo, setCriandoResumo] = useState(false);
  const [texto, setTexto] = useState(foto.ocrText ?? '');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const url = useObjectUrl(foto.blob);

  async function rodarOcr() {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await runOcr(foto.blob);
      setTexto(resultado);
      await db.fotos.update(foto.id!, { ocrText: resultado });
    } catch {
      setErro('Erro ao gerar, tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  async function copiarTexto() {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <><Sheet titulo="Foto" onFechar={onFechar}>
      {url ? (
        <img className="foto-grande" src={url} alt="" />
      ) : (
        <div style={{ marginBottom: 16 }}>
          <Skeleton altura={200} raio={14} />
        </div>
      )}

      {!texto && !carregando && (
        <button className="btn-primary btn-block" onClick={rodarOcr}>
          <ScanText size={17} strokeWidth={2} />
          Ler texto da imagem
        </button>
      )}

      {carregando && (
        <div className="skeleton-card" role="status" aria-busy="true" aria-live="polite">
          <Skeleton largura="100%" altura={10} />
          <Skeleton largura="92%" altura={10} />
          <Skeleton largura="64%" altura={10} />
        </div>
      )}

      {texto && (
        <div className="ocr-resultado">
          <p>{texto}</p>
          <button onClick={copiarTexto}>
            {copiado ? <Check size={17} strokeWidth={2.4} /> : <Copy size={17} strokeWidth={2} />}
            {copiado ? 'Copiado' : 'Copiar texto'}
          </button>
        </div>
      )}

      <button className="btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => setCriandoResumo(true)}>Transformar em resumo</button>
      {erro && <Toast message={erro} onClose={() => setErro(null)} />}
    </Sheet>{criandoResumo && <NovoResumoSheet fotoInicialId={foto.id} onFechar={() => setCriandoResumo(false)} />}</>
  );
}
