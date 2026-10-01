import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { NotebookPen, Pencil, Trash2 } from 'lucide-react';
import { db } from '../../lib/db';
import { MateriaSelect } from '../../components/MateriaSelect';
import { EmptyState } from '../../components/EmptyState';
import { Sheet } from '../../components/Sheet';
import { useConfirmacao } from '../../components/ConfirmDialog';

export function AnotacoesSecao({
  novoAberto,
  onFecharNovo,
}: {
  novoAberto: boolean;
  onFecharNovo: () => void;
}) {
  const anotacoes = useLiveQuery(() => db.anotacoes.orderBy('data').reverse().toArray(), []) ?? [];
  const resumos = useLiveQuery(() => db.resumos.toArray(), []) ?? [];
  const { confirmar, dialogoConfirmacao } = useConfirmacao();

  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [materiaId, setMateriaId] = useState<number | undefined>(undefined);
  const [resumoId, setResumoId] = useState<number | undefined>(undefined);
  const [editandoId, setEditandoId] = useState<number | undefined>(undefined);

  // O sheet abre por dois caminhos: nota nova (o pai manda) ou edição (interno).
  const editando = editandoId !== undefined;
  const sheetAberto = novoAberto || editando;

  function resumoTitulo(id?: number) {
    return resumos.find((r) => r.id === id)?.titulo;
  }

  function limparFormulario() {
    setTitulo('');
    setConteudo('');
    setMateriaId(undefined);
    setResumoId(undefined);
  }

  function abrirEdicao(id: number | undefined) {
    const anotacao = anotacoes.find((item) => item.id === id);
    if (!anotacao || anotacao.id === undefined) return;
    setTitulo(anotacao.titulo);
    setConteudo(anotacao.conteudo);
    setMateriaId(anotacao.materiaId);
    setResumoId(anotacao.resumoId);
    setEditandoId(anotacao.id);
  }

  function fecharFormulario() {
    limparFormulario();
    if (editando) setEditandoId(undefined);
    else onFecharNovo();
  }

  async function excluirAnotacao(id: number | undefined, tituloAnotacao: string) {
    if (id === undefined) return;
    const ok = await confirmar({
      titulo: 'Excluir anotação',
      descricao: `“${tituloAnotacao}” será apagada. Essa ação não pode ser desfeita.`,
      rotuloConfirmar: 'Excluir',
      destrutivo: true,
    });
    if (ok) await db.anotacoes.delete(id);
  }

  async function salvar() {
    if (!titulo.trim()) return;
    const anotacao = {
      titulo: titulo.trim(),
      conteudo: conteudo.trim(),
      materiaId,
      resumoId,
      data: new Date().toISOString(),
    };
    if (editandoId !== undefined) {
      await db.anotacoes.update(editandoId, anotacao);
    } else {
      await db.anotacoes.add(anotacao);
    }
    fecharFormulario();
  }

  return (
    <>
      {anotacoes.length === 0 ? (
        <EmptyState
          Icone={NotebookPen}
          titulo="Nenhuma anotação ainda"
          descricao="Toque no + para anotar uma dúvida, uma ideia da aula ou um lembrete."
        />
      ) : (
        <ul className="lista stagger">
          {anotacoes.map((a) => (
            <li key={a.id} className="card">
              <div className="card-topo">
                <span className="card-titulo">{a.titulo}</span>
                <div className="item-actions">
                  <button
                    className="btn-icon-sm"
                    onClick={() => abrirEdicao(a.id)}
                    aria-label={`Editar ${a.titulo}`}
                  >
                    <Pencil size={16} strokeWidth={2} />
                  </button>
                  <button
                    className="btn-icon-sm item-action-danger"
                    onClick={() => excluirAnotacao(a.id, a.titulo)}
                    aria-label={`Excluir ${a.titulo}`}
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>
              {a.conteudo && <p className="anotacao-conteudo">{a.conteudo}</p>}
              <span className={`pill ${a.resumoId ? '' : 'pill-neutra'}`}>
                {resumoTitulo(a.resumoId) ?? 'Sem resumo vinculado'}
              </span>
            </li>
          ))}
        </ul>
      )}

      {sheetAberto && (
        <Sheet
          titulo={editandoId !== undefined ? 'Editar nota' : 'Nova nota'}
          onFechar={fecharFormulario}
          footer={
            <button className="btn-primary btn-block" onClick={salvar} disabled={!titulo.trim()}>
              {editandoId !== undefined ? 'Salvar alterações' : 'Salvar nota'}
            </button>
          }
        >
          <label className="campo">
            <span className="campo-label">Título</span>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Dúvida sobre integrais"
            />
          </label>

          <label className="campo">
            <span className="campo-label">Anotação</span>
            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Escreva sua anotação"
              rows={6}
            />
          </label>

          <MateriaSelect value={materiaId} onChange={setMateriaId} />

          <label className="campo">
            <span className="campo-label">Resumo vinculado</span>
            <select
              value={resumoId ?? ''}
              onChange={(e) => setResumoId(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">Sem resumo vinculado</option>
              {resumos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.titulo}
                </option>
              ))}
            </select>
            <span className="campo-ajuda">Opcional — ajuda a IA a achar a nota depois.</span>
          </label>
        </Sheet>
      )}

      {dialogoConfirmacao}
    </>
  );
}
