import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BookOpen, ClipboardList, FileText, ListChecks, Play, Plus, RotateCcw } from 'lucide-react';
import { db } from '../../lib/db';
import { Sheet } from '../../components/Sheet';
import { MateriasScreen } from '../materias/MateriasScreen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Segmented } from '../../components/Segmented';
import { EmptyState } from '../../components/EmptyState';
import { ExercicioLista } from '../../components/ExercicioLista';
import { PreviaQuestoes } from '../../components/PreviaQuestoes';
import { NovoResumoSheet } from './NovoResumoSheet';
import { ResumoDetalhe } from './ResumoDetalhe';
import { AnotacoesSecao } from '../anotacoes/AnotacoesSecao';
import { SerieExercicios } from '../exercicios/SerieExercicios';
import { montarFilaRevisao } from '../exercicios/filaRevisao';
import { itensLegados, questoesDoExercicio } from '../exercicios/questoes';
import { NovoSimuladoSheet } from '../simulado/NovoSimuladoSheet';
import { SimuladoRun } from '../simulado/SimuladoRun';
import { SimuladoResultado } from '../simulado/SimuladoResultado';
import { Toast } from '../../components/Toast';
import type { Resumo, Simulado } from '../../types';

type Visao = 'resumos' | 'exercicios' | 'anotacoes';

const ABAS: { id: Visao; label: string }[] = [
  { id: 'resumos', label: 'Resumos' },
  { id: 'exercicios', label: 'Exercícios' },
  { id: 'anotacoes', label: 'Anotações' },
];

const SUBTITULO: Record<Visao, string> = {
  resumos: 'Seu material organizado para estudar',
  exercicios: 'Questões de múltipla escolha para treinar',
  anotacoes: 'Suas ideias, com ou sem resumo',
};

export function EstudarScreen() {
  const resumos = useLiveQuery(() => db.resumos.orderBy('criadoEm').reverse().toArray(), []) ?? [];
  const exercicios = useLiveQuery(() => db.exercicios.toArray(), []) ?? [];
  const materias = useLiveQuery(() => db.materias.toArray(), []) ?? [];
  // `montarFilaRevisao` lê `db.tentativas` por dentro, e o liveQuery do Dexie
  // rastreia as leituras feitas durante a execução — então a fila se atualiza
  // sozinha a cada questão respondida, sem nenhuma dependência declarada à mão.
  const fila = useLiveQuery(() => montarFilaRevisao(), []) ?? [];

  const [visao, setVisao] = useState<Visao>('resumos');
  const [gerenciandoMaterias, setGerenciandoMaterias] = useState(false);
  const [criando, setCriando] = useState(false);
  const [aberto, setAberto] = useState<Resumo | null>(null);
  const [resumoId, setResumoId] = useState<number | undefined>(undefined);
  const [novaNota, setNovaNota] = useState(false);
  const [revisando, setRevisando] = useState(false);
  const [respondendo, setRespondendo] = useState(false);
  const [revisandoGrupo, setRevisandoGrupo] = useState(false);
  const [configurandoSimulado, setConfigurandoSimulado] = useState(false);
  const [simuladoAtivo, setSimuladoAtivo] = useState<Simulado | null>(null);
  const [resultadoId, setResultadoId] = useState<number | null>(null);
  const [avisoSimulado, setAvisoSimulado] = useState<string | null>(null);

  function materiaNome(id?: number) {
    return materias.find((m) => m.id === id)?.nome ?? 'Sem matéria';
  }

  const ativo = resumoId ?? resumos[0]?.id;
  // toArray() vem em ordem de id, então o último é o mais recente.
  const ultimo = (resumoId?: number) => exercicios.filter((e) => e.resumoId === resumoId).at(-1);
  const exercicio = ultimo(ativo);
  const resumoAtivo = resumos.find((r) => r.id === ativo);
  const questoes = questoesDoExercicio(exercicio, resumoAtivo?.materiaId);
  const legados = itensLegados(exercicio);
  // Erros pendentes só deste exercício: atalho pro que o aluno errou aqui, sem
  // passar pela fila global. `exercicioId` sai da closure porque o TS não
  // carrega o narrowing de `exercicio?.id` para dentro dela.
  const exercicioId = exercicio?.id;
  const filaDoResumo = useLiveQuery(
    () =>
      exercicioId === undefined
        ? Promise.resolve([])
        : montarFilaRevisao({ origem: 'exercicio', origemId: exercicioId }),
    [exercicioId],
  ) ?? [];

  return (
    <>
      <ScreenHeader
        title="Estudar"
        subtitleBelow
        subtitle={SUBTITULO[visao]}
        actions={
          <div className="acoes-icone">
            <button className="btn-materias" onClick={() => setGerenciandoMaterias(true)}>
              <BookOpen size={17} aria-hidden="true" />
              Matérias
            </button>
            {visao !== 'exercicios' && (
            <button
              className="btn-primary btn-icon"
              onClick={() => (visao === 'resumos' ? setCriando(true) : setNovaNota(true))}
              aria-label={visao === 'resumos' ? 'Criar novo resumo' : 'Criar nova nota'}
              title={visao === 'resumos' ? 'Novo resumo' : 'Nova nota'}
            >
              <Plus size={20} strokeWidth={2.2} />
            </button>
            )}
          </div>
        }
      />

      <div className="screen-body">
        <Segmented itens={ABAS} valor={visao} onChange={setVisao} rotulo="Seção de estudo" />

        {visao === 'resumos' ? (
          resumos.length === 0 ? (
            <EmptyState
              Icone={FileText}
              titulo="Nenhum resumo ainda"
              descricao="Use fotos da galeria ou cole um texto para criar seu primeiro resumo."
              acao={{ rotulo: 'Criar primeiro resumo', onClick: () => setCriando(true) }}
            />
          ) : (
            <ul className="lista stagger">
              {resumos.map((r) => (
                <li key={r.id}>
                  <button className="card card-clicavel" onClick={() => setAberto(r)}>
                    <div className="card-topo">
                      <span className="card-titulo">{r.titulo}</span>
                      <span className="pill">{materiaNome(r.materiaId)}</span>
                    </div>
                    <span className="meta meta-num" style={{ display: 'block', marginTop: 8 }}>
                      {r.fotoIds.length} {r.fotoIds.length === 1 ? 'foto' : 'fotos'} ·{' '}
                      {new Date(r.criadoEm).toLocaleDateString('pt-BR')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : visao === 'exercicios' ? (
          resumos.length === 0 ? (
            <EmptyState
              Icone={ListChecks}
              titulo="Sem exercícios"
              descricao="Os exercícios saem de um resumo. Crie um resumo primeiro e depois gere as questões."
              acao={{ rotulo: 'Ir para Resumos', onClick: () => setVisao('resumos') }}
            />
          ) : (
            <>
              {/* As duas ações globais lado a lado: separadas, cada uma comia
                  uma faixa da tela e empurrava as questões para fora da dobra. */}
              <div className="acoes-par">
                <button className="acao-card" onClick={() => setConfigurandoSimulado(true)}>
                  <ClipboardList size={18} strokeWidth={2} />
                  <span>Novo simulado</span>
                </button>

                {fila.length > 0 && (
                  <button className="acao-card" onClick={() => setRevisando(true)}>
                    <RotateCcw size={18} strokeWidth={2} />
                    <span>
                      Revisar {fila.length} {fila.length === 1 ? 'erro' : 'erros'}
                    </span>
                  </button>
                )}
              </div>

              <div className="chips-scroll">
                {resumos.map((r) => {
                  const qtd = ultimo(r.id)?.itens.length ?? 0;
                  return (
                    <button
                      key={r.id}
                      className={`chip ${ativo === r.id ? 'chip-ativo' : ''}`}
                      aria-pressed={ativo === r.id}
                      // O chip mostra só o número; o rótulo diz o que ele conta.
                      aria-label={`${r.titulo}, ${qtd === 0 ? 'sem exercícios' : `${qtd} questões`}`}
                      onClick={() => setResumoId(r.id)}
                    >
                      {r.titulo}
                      {/* Travessão em vez de 0: um zero solto ao lado do título
                          lê como dígito perdido, o traço lê como vazio. */}
                      <span aria-hidden="true">{qtd === 0 ? '–' : qtd}</span>
                    </button>
                  );
                })}
              </div>

              {exercicio ? (
                <>
                  {questoes.length > 0 && (
                    <>
                      <PreviaQuestoes itens={questoes.map((q) => q.item)} />
                      <button className="btn-primary btn-block" onClick={() => setRespondendo(true)}>
                        <Play size={17} strokeWidth={2} />
                        Responder {questoes.length} questões
                      </button>
                      {/* Escondido quando a fila global é exatamente esta: dois
                          botões com a mesma contagem, um do lado do outro,
                          parecem coisas diferentes e não são. */}
                      {filaDoResumo.length > 0 && filaDoResumo.length !== fila.length && (
                        <button className="btn-ghost btn-block" onClick={() => setRevisandoGrupo(true)}>
                          <RotateCcw size={16} strokeWidth={2} />
                          Revisar {filaDoResumo.length}{' '}
                          {filaDoResumo.length === 1 ? 'erro' : 'erros'} deste resumo
                        </button>
                      )}
                    </>
                  )}
                  {legados.length > 0 && (
                    <>
                      <p className="aviso-legado">
                        Questões antigas, sem alternativas — elas não entram nas suas estatísticas.
                      </p>
                      <ExercicioLista itens={legados} />
                    </>
                  )}
                </>
              ) : (
                <EmptyState
                  Icone={ListChecks}
                  titulo="Nada gerado ainda"
                  descricao="Esse resumo ainda não tem questões. Abra ele para escolher quantidade e nível."
                  acao={{
                    rotulo: 'Abrir resumo',
                    onClick: () => {
                      const alvo = resumos.find((r) => r.id === ativo);
                      if (alvo) setAberto(alvo);
                    },
                  }}
                />
              )}
            </>
          )
        ) : (
          <AnotacoesSecao novoAberto={novaNota} onFecharNovo={() => setNovaNota(false)} />
        )}
      </div>

      {gerenciandoMaterias && <Sheet titulo="Matérias" onFechar={() => setGerenciandoMaterias(false)}><MateriasScreen /></Sheet>}
      {criando && <NovoResumoSheet onFechar={() => setCriando(false)} />}
      {aberto && <ResumoDetalhe resumo={aberto} onFechar={() => setAberto(null)} />}
      {revisando && (
        <SerieExercicios titulo="Revisar erros" questoes={fila} onFechar={() => setRevisando(false)} />
      )}
      {respondendo && questoes.length > 0 && (
        <SerieExercicios
          titulo={resumoAtivo?.titulo ?? 'Exercícios'}
          questoes={questoes}
          onFechar={() => setRespondendo(false)}
        />
      )}
      {revisandoGrupo && filaDoResumo.length > 0 && (
        <SerieExercicios
          titulo="Revisar erros"
          questoes={filaDoResumo}
          onFechar={() => setRevisandoGrupo(false)}
        />
      )}

      {configurandoSimulado && (
        <NovoSimuladoSheet
          onFechar={() => setConfigurandoSimulado(false)}
          onIniciar={(s, aviso) => {
            setConfigurandoSimulado(false);
            setSimuladoAtivo(s);
            // O aviso precisa sobreviver ao fechamento do NovoSimuladoSheet,
            // por isso mora aqui em cima em vez de dentro dele.
            if (aviso) setAvisoSimulado(aviso);
          }}
        />
      )}
      {avisoSimulado && <Toast message={avisoSimulado} onClose={() => setAvisoSimulado(null)} />}

      {simuladoAtivo && (
        <SimuladoRun
          simulado={simuladoAtivo}
          onFinalizar={(id) => {
            setSimuladoAtivo(null);
            setResultadoId(id);
          }}
          onFechar={() => setSimuladoAtivo(null)}
        />
      )}

      {resultadoId !== null && (
        <SimuladoResultado simuladoId={resultadoId} onFechar={() => setResultadoId(null)} />
      )}
    </>
  );
}
