import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Pencil, Play, Sparkles } from 'lucide-react';
import { db } from '../../lib/db';
import { gerarExercicios } from '../../lib/gemini';
import { Segmented } from '../../components/Segmented';
import { Sheet } from '../../components/Sheet';
import { Toast } from '../../components/Toast';
import { SkeletonCard } from '../../components/Skeleton';
import { ExercicioLista } from '../../components/ExercicioLista';
import { SerieExercicios } from '../exercicios/SerieExercicios';
import { itensLegados, questoesDoExercicio } from '../exercicios/questoes';
import type { Dificuldade, Resumo } from '../../types';

type Qtd = '5' | '10' | '15';
type Nivel = Dificuldade | 'misto';

const QTDS: { id: Qtd; label: string }[] = [
  { id: '5', label: '5' },
  { id: '10', label: '10' },
  { id: '15', label: '15' },
];

const NIVEIS: { id: Nivel; label: string }[] = [
  { id: 'facil', label: 'Fácil' },
  { id: 'medio', label: 'Médio' },
  { id: 'dificil', label: 'Difícil' },
  { id: 'misto', label: 'Misto' },
];

export function ResumoDetalhe({ resumo, onFechar }: { resumo: Resumo; onFechar: () => void }) {
  // `.last()` = maior id = geração mais recente deste resumo.
  const exercicio = useLiveQuery(
    () => db.exercicios.where('resumoId').equals(resumo.id!).last(),
    [resumo.id],
  );

  const [conteudo, setConteudo] = useState(resumo.conteudo);
  const [titulo, setTitulo] = useState(resumo.titulo);
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(resumo.conteudo);
  const [nomeRascunho, setNomeRascunho] = useState(resumo.titulo);
  const [salvando, setSalvando] = useState(false);

  async function salvarEdicao() {
    if (!rascunho.trim() || !nomeRascunho.trim() || salvando) return;
    setSalvando(true);
    try {
      await db.resumos.update(resumo.id!, { conteudo: rascunho.trim(), titulo: nomeRascunho.trim() });
      setConteudo(rascunho.trim()); setTitulo(nomeRascunho.trim()); setEditando(false);
    } catch { setErro('Não foi possível salvar. Tente novamente.'); }
    finally { setSalvando(false); }
  }

  const [qtd, setQtd] = useState<Qtd>('5');
  const [nivel, setNivel] = useState<Nivel>('misto');
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [respondendo, setRespondendo] = useState(false);

  const questoes = questoesDoExercicio(exercicio, resumo.materiaId);
  const legados = itensLegados(exercicio);

  async function gerar() {
    setGerando(true);
    setErro(null);
    try {
      const itens = await gerarExercicios(conteudo, { qtd: Number(qtd), nivel });
      if (!itens.length) throw new Error('Não há questões neste nível. Escolha Misto.');
      await db.exercicios.add({
        resumoId: resumo.id!,
        itens,
        criadoEm: new Date().toISOString(),
      });
      setRespondendo(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao gerar, tente novamente.');
    } finally {
      setGerando(false);
    }
  }

  return (
    <>
      <Sheet titulo={titulo} onFechar={onFechar}>
        {editando ? <div className="lista">
          <label className="campo"><span className="campo-label">Título do resumo</span><input value={nomeRascunho} onChange={e => setNomeRascunho(e.target.value)} /></label>
          <label className="campo"><span className="campo-label">Conteúdo</span><textarea rows={12} value={rascunho} onChange={e => setRascunho(e.target.value)} /></label>
          <div className="acoes-par"><button disabled={salvando} onClick={() => setEditando(false)}>Cancelar</button><button className="btn-primary" disabled={salvando || !rascunho.trim() || !nomeRascunho.trim()} onClick={salvarEdicao}>{salvando ? 'Salvando…' : 'Salvar alterações'}</button></div>
          <p className="campo-ajuda">Novas questões usarão o conteúdo atualizado. As questões já geradas continuam no histórico.</p>
        </div> : <>
          <button className="btn-ghost" onClick={() => { setRascunho(conteudo); setNomeRascunho(titulo); setEditando(true); }}><Pencil size={16} />Editar resumo</button>
          <p className="resumo-conteudo">{conteudo}</p>
        </>}

        <h3 className="secao-titulo">Exercícios</h3>

        {gerando ? (
          <SkeletonCard linhas={3} rotulo="Gerando exercícios com IA" />
        ) : (
          <>
            {questoes.length > 0 && (
              <button className="btn-primary btn-block" onClick={() => setRespondendo(true)}>
                <Play size={17} strokeWidth={2} />
                Responder {questoes.length} questões
              </button>
            )}

            <div className="gerador">
              <Segmented itens={QTDS} valor={qtd} onChange={setQtd} rotulo="Quantidade de questões" modo="radio" />
              <Segmented itens={NIVEIS} valor={nivel} onChange={setNivel} rotulo="Nível das questões" modo="radio" />
              <button className="btn-ghost btn-block" onClick={gerar}>
                <Sparkles size={17} strokeWidth={2} />
                {questoes.length > 0 ? 'Gerar novas questões' : 'Gerar exercícios'}
              </button>
            </div>

            {legados.length > 0 && (
              <>
                <p className="aviso-legado">
                  Questões antigas, sem alternativas — elas não entram nas suas estatísticas.
                </p>
                <ExercicioLista itens={legados} />
              </>
            )}
          </>
        )}

        {erro && <Toast message={erro} onClose={() => setErro(null)} />}
      </Sheet>

      {respondendo && questoes.length > 0 && (
        <SerieExercicios
          titulo={titulo}
          questoes={questoes}
          onFechar={() => setRespondendo(false)}
          onRefazer={() => {
            setRespondendo(false);
            void gerar();
          }}
        />
      )}
    </>
  );
}
