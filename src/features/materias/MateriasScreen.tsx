import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Pencil, Plus } from 'lucide-react';
import { Sheet } from '../../components/Sheet';
import type { Materia } from '../../types';
import { db } from '../../lib/db';
import { useConfirmacao } from '../../components/ConfirmDialog';

const CORES = ['#2563eb', '#0e7490', '#b45309', '#7c3aed', '#e11d48', '#047857'];

function corPara(nome: string): string {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) hash = (hash * 31 + nome.charCodeAt(i)) >>> 0;
  return CORES[hash % CORES.length];
}

export function MateriasScreen() {
  const materias = useLiveQuery(() => db.materias.toArray(), []) ?? [];
  const [nome, setNome] = useState('');
  const [editando, setEditando] = useState<Materia | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const { confirmar, dialogoConfirmacao } = useConfirmacao();

  async function adicionar() {
    const limpo = nome.trim();
    if (!limpo) return;
    await db.materias.add({ nome: limpo, cor: corPara(limpo) });
    setNome('');
  }

  async function salvarEdicao() {
    if (!editando?.nome.trim() || salvando) return;
    setSalvando(true); setErro('');
    try {
      await db.materias.update(editando.id!, { nome: editando.nome.trim(), cor: editando.cor });
      setEditando(null);
    } catch { setErro('Não foi possível salvar. Tente novamente.'); }
    finally { setSalvando(false); }
  }

  async function remover(id: number, nomeMateria: string) {
    const ok = await confirmar({
      titulo: 'Remover matéria',
      descricao: `“${nomeMateria}” sai da lista. Resumos e lembretes já criados continuam existindo, mas ficam sem matéria.`,
      rotuloConfirmar: 'Remover',
      destrutivo: true,
    });
    if (ok) await db.materias.delete(id);
  }

  return (
    <>
      <div className="form-row" style={{ marginBottom: 16 }}>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome da matéria"
          aria-label="Nome da matéria"
          onKeyDown={(e) => e.key === 'Enter' && adicionar()}
        />
        <button className="btn-primary btn-icon" onClick={adicionar} disabled={!nome.trim()} aria-label="Adicionar matéria">
          <Plus size={18} strokeWidth={2.2} />
        </button>
      </div>

      <ul className="lista lista-materias stagger">
        {materias.map((m) => (
          <li key={m.id}>
            <span className="materia-cor" style={{ background: m.cor }} aria-hidden="true" />
            <span className="materia-nome">{m.nome}</span>
            <button className="btn-icon-sm" aria-label={`Editar ${m.nome}`} onClick={() => { setEditando({ ...m }); setErro(''); }}>
              <Pencil size={17} />
            </button>
            <button className="btn-danger" onClick={() => remover(m.id!, m.nome)}>
              Remover
            </button>
          </li>
        ))}
      </ul>
      {materias.length === 0 && <p className="vazio">Nenhuma matéria cadastrada ainda</p>}

      {editando && <Sheet titulo="Editar matéria" onFechar={() => setEditando(null)} footer={
        <button className="btn-primary btn-block" disabled={salvando || !editando.nome.trim()} onClick={salvarEdicao}>{salvando ? 'Salvando…' : 'Salvar alterações'}</button>
      }>
        <label className="campo"><span className="campo-label">Nome da matéria</span>
          <input value={editando.nome} disabled={salvando} onChange={e => setEditando({ ...editando, nome: e.target.value })} />
        </label>
        <fieldset className="form-sem-borda" disabled={salvando}>
          <legend className="campo-label">Cor da matéria</legend>
          <div className="materia-paleta">
            {CORES.map((cor, i) => <button key={cor} type="button" aria-label={['Azul', 'Ciano', 'Laranja', 'Roxo', 'Rosa', 'Verde'][i]}
              aria-pressed={editando.cor === cor} className="materia-cor-opcao" onClick={() => setEditando({ ...editando, cor })}>
              <span style={{ background: cor }} />
            </button>)}
          </div>
        </fieldset>
        {erro && <p className="aviso-erro" role="alert">{erro}</p>}
      </Sheet>}
      {dialogoConfirmacao}
    </>
  );
}
