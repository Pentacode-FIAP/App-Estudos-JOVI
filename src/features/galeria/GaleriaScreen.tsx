import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Camera, ImagePlus, Upload } from 'lucide-react';
import { db } from '../../lib/db';
import { dataLocal } from '../../lib/date';
import { FotoDetalhe } from './FotoDetalhe';
import { ScreenHeader } from '../../components/ScreenHeader';
import { EmptyState } from '../../components/EmptyState';
import { FotoThumb } from '../../components/FotoThumb';
import type { Foto } from '../../types';

function agruparPorData(fotos: Foto[]): { rotulo: string; itens: Foto[] }[] {
  const hoje = dataLocal(new Date());
  const ontem = dataLocal(new Date(Date.now() - 86400000));
  const grupos = new Map<string, Foto[]>();
  for (const f of fotos) {
    const dia = dataLocal(new Date(f.dataUpload));
    const lista = grupos.get(dia) ?? [];
    lista.push(f);
    grupos.set(dia, lista);
  }
  const ordenado = [...grupos.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  return ordenado.map(([dia, itens]) => ({
    rotulo: dia === hoje ? 'Hoje' : dia === ontem ? 'Ontem' : dia.split('-').reverse().join('/'),
    itens,
  }));
}

export function GaleriaScreen() {
  const fotos = useLiveQuery(() => db.fotos.orderBy('dataUpload').reverse().toArray(), []) ?? [];
  const [selecionada, setSelecionada] = useState<Foto | null>(null);
  const inputUploadRef = useRef<HTMLInputElement>(null);
  const inputCameraRef = useRef<HTMLInputElement>(null);

  async function aoSelecionarArquivos(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = e.target.files;
    if (!arquivos) return;
    for (const arquivo of Array.from(arquivos)) {
      await db.fotos.add({ blob: arquivo, dataUpload: new Date().toISOString() });
    }
    e.target.value = '';
  }

  const grupos = agruparPorData(fotos);

  return (
    <>
      <ScreenHeader
        title="Galeria"
        subtitle="Todas as fotos que você já enviou"
        actions={
          <div className="acoes-icone">
            <button
              className="btn-icon"
              onClick={() => inputCameraRef.current?.click()}
              aria-label="Abrir câmera"
              title="Tirar foto"
            >
              <Camera size={19} strokeWidth={2} />
            </button>
            <button
              className="btn-primary btn-icon"
              onClick={() => inputUploadRef.current?.click()}
              aria-label="Enviar foto"
              title="Enviar da galeria"
            >
              <Upload size={19} strokeWidth={2} />
            </button>
          </div>
        }
      />

      <input
        ref={inputCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={aoSelecionarArquivos}
      />
      <input
        ref={inputUploadRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={aoSelecionarArquivos}
      />

      <div className="screen-body">
        {fotos.length === 0 ? (
          <EmptyState
            Icone={ImagePlus}
            titulo="Nenhuma foto ainda"
            descricao="Fotografe o quadro ou o caderno. Depois é só transformar em resumo na aba Estudar."
            acao={{ rotulo: 'Enviar foto', onClick: () => inputUploadRef.current?.click() }}
          />
        ) : (
          grupos.map((grupo) => (
            <div key={grupo.rotulo}>
              <h3 className="secao-titulo">{grupo.rotulo}</h3>
              <div className="galeria-grid stagger">
                {grupo.itens.map((foto) => (
                  <button
                    key={foto.id}
                    className="galeria-item"
                    onClick={() => setSelecionada(foto)}
                    aria-label={`Abrir foto de ${grupo.rotulo}`}
                  >
                    <FotoThumb blob={foto.blob} />
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {selecionada && <FotoDetalhe foto={selecionada} onFechar={() => setSelecionada(null)} />}
    </>
  );
}
