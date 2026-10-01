import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ResumoSelecao } from '../../components/ResumoSelecao';
import { db } from '../../lib/db';
import { Sheet } from '../../components/Sheet';
import { Segmented } from '../../components/Segmented';
import { MateriaSelect } from '../../components/MateriaSelect';
import type { Evento } from '../../types';

const TIPOS: { id: Evento['tipo']; label: string }[] = [
  { id: 'prova', label: 'Prova' },
  { id: 'atividade', label: 'Atividade' },
  { id: 'revisao', label: 'Revisão' },
];

export function EventoForm({
  dataInicial,
  evento,
  onFechar,
}: {
  dataInicial: string;
  evento?: Evento;
  onFechar: () => void;
}) {
  const [titulo, setTitulo] = useState(evento?.titulo ?? '');
  const [data, setData] = useState(evento?.data ?? dataInicial);
  const [materiaId, setMateriaId] = useState<number | undefined>(evento?.materiaId);
  const [tipo, setTipo] = useState<Evento['tipo']>(evento?.tipo ?? 'prova');

  const [resumoIds, setResumoIds] = useState<number[]>(evento?.resumoIds ?? []);
  const resumos = useLiveQuery(() => db.resumos.toArray(), []) ?? [];
  const disponiveis = resumos.filter(r => materiaId === undefined || r.materiaId === materiaId);

  const valido = titulo.trim().length > 0 && Boolean(data);

  async function salvar() {
    if (!valido) return;
    const ids = tipo === 'prova' ? resumoIds.filter(id => disponiveis.some(r => r.id === id)) : [];
    const mudou = evento?.materiaId !== materiaId || evento?.tipo !== tipo || [...ids].sort().join(',') !== [...(evento?.resumoIds ?? [])].sort().join(',');
    const dados = { titulo: titulo.trim(), data, materiaId, tipo, resumoIds: ids, ...(mudou ? { revisadosIds: [], treinoConcluido: false, simuladoId: undefined } : {}) };
    if (evento?.id !== undefined) {
      await db.eventos.update(evento.id, dados);
    } else {
      await db.eventos.add(dados);
    }
    onFechar();
  }

  return (
    <Sheet
      titulo={evento ? 'Editar lembrete' : 'Novo lembrete'}
      onFechar={onFechar}
      footer={
        <button className="btn-primary btn-block" onClick={salvar} disabled={!valido}>
          {evento ? 'Salvar alterações' : 'Salvar lembrete'}
        </button>
      }
    >
      <label className="campo">
        <span className="campo-label">Título</span>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex.: Prova de Cálculo I"
        />
      </label>

      <label className="campo">
        <span className="campo-label">Data</span>
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </label>

      <MateriaSelect value={materiaId} onChange={id => { setMateriaId(id); setResumoIds([]); }} />

      <div className="campo">
        <span className="campo-label">Tipo</span>
        <Segmented itens={TIPOS} valor={tipo} onChange={setTipo} rotulo="Tipo do lembrete" modo="radio" />
      </div>
      {tipo === 'prova' && <ResumoSelecao resumos={disponiveis} selecionados={resumoIds} onChange={setResumoIds} />}
    </Sheet>
  );
}
