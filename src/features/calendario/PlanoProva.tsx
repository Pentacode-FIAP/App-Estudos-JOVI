import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BookOpen, Check, ClipboardList, ListChecks } from 'lucide-react';
import { db } from '../../lib/db';
import { gerarExercicios } from '../../lib/gemini';
import { datasPreparacao, priorizarResumos } from '../../lib/preparacao';
import { diaLocal, diffDias } from '../../lib/progresso';
import { Sheet } from '../../components/Sheet';
import { ResumoSelecao } from '../../components/ResumoSelecao';
import { ResumoDetalhe } from '../estudar/ResumoDetalhe';
import { NovoResumoSheet } from '../estudar/NovoResumoSheet';
import { SerieExercicios, type QuestaoDaSerie } from '../exercicios/SerieExercicios';
import { questoesDoExercicio } from '../exercicios/questoes';
import { NovoSimuladoSheet } from '../simulado/NovoSimuladoSheet';
import { SimuladoRun } from '../simulado/SimuladoRun';
import { SimuladoResultado } from '../simulado/SimuladoResultado';
import type { Resumo, Simulado } from '../../types';

export function PlanoProva({ eventoId, onFechar }: { eventoId: number; onFechar: () => void }) {
  const evento = useLiveQuery(() => db.eventos.get(eventoId), [eventoId]);
  const resumos = useLiveQuery(() => db.resumos.toArray(), []) ?? [];
  const exercicios = useLiveQuery(() => db.exercicios.toArray(), []) ?? [];
  const tentativas = useLiveQuery(() => db.tentativas.toArray(), []) ?? [];
  const [selecionados, setSelecionados] = useState<number[] | null>(null);
  const [editando, setEditando] = useState(false);
  const [aberto, setAberto] = useState<Resumo | null>(null);
  const [criando, setCriando] = useState(false);
  const [serie, setSerie] = useState<QuestaoDaSerie[] | null>(null);
  const [novoSimulado, setNovoSimulado] = useState(false);
  const [simulado, setSimulado] = useState<Simulado | null>(null);
  const [resultadoId, setResultadoId] = useState<number | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  if (!evento) return <Sheet titulo="Preparação para a prova" onFechar={onFechar}><p>Carregando prova…</p></Sheet>;
  const disponiveis = resumos.filter(r => evento.materiaId === undefined || r.materiaId === evento.materiaId);
  const ids = selecionados ?? evento.resumoIds ?? disponiveis.map(r => r.id!);
  const escolhidos = disponiveis.filter(r => ids.includes(r.id!));
  const ordenados = priorizarResumos(escolhidos, exercicios, tentativas);
  const configurando = editando || !evento.resumoIds?.length;
  const revisados = evento.revisadosIds ?? [];
  const revisaoFeita = escolhidos.length > 0 && escolhidos.every(r => revisados.includes(r.id!));
  const concluidas = Number(revisaoFeita) + Number(!!evento.treinoConcluido) + Number(!!evento.simuladoId);
  const faltam = diffDias(diaLocal(new Date()), evento.data);
  const datas = datasPreparacao(evento.data);
  const dataLabel = (dia: string) => dia === diaLocal(new Date()) ? 'Hoje' : dia.split('-').reverse().slice(0, 2).join('/');

  async function atualizar(dados: Parameters<typeof db.eventos.update>[1]) {
    try { await db.eventos.update(eventoId, dados); }
    catch { setErro('Não foi possível salvar o plano. Tente novamente.'); }
  }
  async function alternarRevisado(resumoId: number) {
    try {
      await db.transaction('rw', db.eventos, async () => {
        const atual = await db.eventos.get(eventoId);
        const marcados = atual?.revisadosIds ?? [];
        await db.eventos.update(eventoId, { revisadosIds: marcados.includes(resumoId) ? marcados.filter(id => id !== resumoId) : [...marcados, resumoId] });
      });
    } catch { setErro('Não foi possível marcar a revisão. Tente novamente.'); }
  }
  async function salvarPlano() {
    setOcupado(true); setErro('');
    try {
      await db.eventos.update(eventoId, { resumoIds: escolhidos.map(r => r.id!), revisadosIds: [], treinoConcluido: false, simuladoId: undefined });
      setEditando(false); setSelecionados(null);
    } catch { setErro('Não foi possível salvar o plano.'); }
    finally { setOcupado(false); }
  }
  async function praticar() {
    if (ocupado || !ordenados.length) return;
    setOcupado(true); setErro('');
    try {
      // Até cinco questões de cada resumo; cobre todas as fontes selecionadas.
      const questoes: QuestaoDaSerie[] = [];
      for (const resumo of ordenados) {
        let exercicio = await db.exercicios.where('resumoId').equals(resumo.id!).last();
        if (!questoesDoExercicio(exercicio, resumo.materiaId).length) {
          const itens = await gerarExercicios(resumo.conteudo, { qtd: 5, nivel: 'misto' });
          const novo = { resumoId: resumo.id!, itens, criadoEm: new Date().toISOString() };
          const id = await db.exercicios.add(novo);
          exercicio = { ...novo, id };
        }
        questoes.push(...questoesDoExercicio(exercicio, resumo.materiaId).slice(0, 5));
      }
      if (questoes.length) setSerie(questoes);
      else setErro('Não há questões disponíveis. Gere exercícios em um resumo.');
    } catch { setErro('Não consegui montar o treino. Tente novamente.'); }
    finally { setOcupado(false); }
  }

  return <Sheet titulo="Me preparar para esta prova" onFechar={onFechar}>
    <section className="plano-hero">
      <span className="pill pill-prova">{faltam > 0 ? `Faltam ${faltam} dias` : faltam === 0 ? 'É hoje!' : 'Prova encerrada'}</span>
      <h2>{evento.titulo}</h2>
      <p>Do conteúdo da aula à confiança para a prova.</p>
      {!configurando && <><div className="barra-prog-trilho"><div className="barra-prog-fill" style={{ width: `${concluidas / 3 * 100}%`, background: 'var(--accent)' }} /></div><span className="meta">{concluidas} de 3 etapas concluídas</span></>}
    </section>
    {configurando ? <div className="lista">
      <ResumoSelecao resumos={disponiveis} selecionados={ids} onChange={setSelecionados} />
      <button className="btn-ghost" onClick={() => setCriando(true)}>Criar um resumo</button>
      <button className="btn-primary btn-block" disabled={ocupado || !escolhidos.length} onClick={salvarPlano}>Montar meu plano</button>
      {editando && <button className="btn-ghost" onClick={() => { setEditando(false); setSelecionados(null); }}>Cancelar</button>}
    </div> : <>
      <button className="btn-ghost btn-block" onClick={() => { setSelecionados(evento.resumoIds ?? []); setEditando(true); }}>Alterar conteúdo da prova</button>
      <p className="campo-ajuda">Comece pelos conteúdos com mais erros nos exercícios. Cada etapa pode ser aberta quando você quiser.</p>
      <div className="lista plano-etapas">
        <section className="card">
          <div className="plano-etapa-topo"><BookOpen size={20} /><strong>1. Revisar o material</strong>{revisaoFeita && <Check size={18} />}</div>
          <span className="meta">{dataLabel(datas[0])} · {escolhidos.length} resumo(s)</span>
          {ordenados.map(r => <div className="plano-resumo" key={r.id}>
            <button className="btn-ghost" onClick={() => setAberto(r)}>{r.titulo}</button>
            <label className="meta"><input type="checkbox" checked={revisados.includes(r.id!)} onChange={() => void alternarRevisado(r.id!)} /> Revisado</label>
          </div>)}
          {!escolhidos.length && <p className="campo-ajuda">Os resumos deste plano não estão mais disponíveis. Altere o conteúdo da prova.</p>}
        </section>
        <section className="card">
          <div className="plano-etapa-topo"><ListChecks size={20} /><strong>2. Praticar questões</strong>{evento.treinoConcluido && <Check size={18} />}</div>
          <span className="meta">{dataLabel(datas[1])} · Treino com dicas e explicações</span>
          <p className="campo-ajuda">Errou? Peça ajuda ao tutor e entenda o raciocínio.</p>
          <button className="btn-primary btn-block" disabled={ocupado || !escolhidos.length} onClick={praticar}>{ocupado ? 'Preparando treino…' : evento.treinoConcluido ? 'Praticar novamente' : 'Começar treino'}</button>
        </section>
        <section className="card">
          <div className="plano-etapa-topo"><ClipboardList size={20} /><strong>3. Testar seus conhecimentos</strong>{evento.simuladoId && <Check size={18} />}</div>
          <span className="meta">{dataLabel(datas[2])} · Simulado dos conteúdos escolhidos</span>
          <p className="campo-ajuda">Responda sem dicas e confira o resultado ao finalizar.</p>
          <button className="btn-primary btn-block" disabled={!escolhidos.length || evento.materiaId === undefined} onClick={() => setNovoSimulado(true)}>Fazer simulado</button>
          {evento.materiaId === undefined && <p className="campo-ajuda">Associe uma matéria à prova no calendário para fazer o simulado.</p>}
          {evento.simuladoId && <button className="btn-ghost btn-block" onClick={() => setResultadoId(evento.simuladoId!)}>Ver último resultado</button>}
        </section>
      </div>
      {concluidas === 3 && <div className="tutor-resposta"><strong>Preparação concluída!</strong><p>Você revisou, praticou e testou seus conhecimentos. Pode repetir qualquer etapa para reforçar.</p></div>}
    </>}
    {erro && <p role="alert" className="aviso-erro">{erro}</p>}
    {aberto && <ResumoDetalhe resumo={aberto} onFechar={() => setAberto(null)} />}
    {criando && <NovoResumoSheet onFechar={() => setCriando(false)} />}
    {serie && <SerieExercicios titulo="Treino para a prova" questoes={serie} onFechar={() => setSerie(null)} onConcluir={() => void atualizar({ treinoConcluido: true })} />}
    {novoSimulado && <NovoSimuladoSheet materiaInicial={evento.materiaId} resumoIdsIniciais={escolhidos.map(r => r.id!)} onFechar={() => setNovoSimulado(false)} onIniciar={(s, aviso) => { setNovoSimulado(false); setSimulado(s); if (aviso) setErro(aviso); }} />}
    {simulado && <SimuladoRun simulado={simulado} onFechar={() => setSimulado(null)} onFinalizar={id => { void atualizar({ simuladoId: id }); setSimulado(null); setResultadoId(id); }} />}
    {resultadoId !== null && <SimuladoResultado simuladoId={resultadoId} onFechar={() => setResultadoId(null)} />}
  </Sheet>;
}
