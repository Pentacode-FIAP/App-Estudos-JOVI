import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Flame, Settings2, TrendingUp } from 'lucide-react';
import { db, META_PADRAO } from '../../lib/db';
import { seedDemoData } from '../../lib/seedDemo';
import { ScreenHeader } from '../../components/ScreenHeader';
import { EmptyState } from '../../components/EmptyState';
import { Donut } from '../../components/charts/Donut';
import { BarrasSemana } from '../../components/charts/BarrasSemana';
import { BarraProgresso } from '../../components/charts/BarraProgresso';
import {
  diaLocal,
  insights,
  porDificuldade,
  porMateria,
  serieSemanal,
  streak,
  taxaAcerto,
} from '../../lib/progresso';
import { MetaSheet } from './MetaSheet';
import { SimuladoResultado } from '../simulado/SimuladoResultado';
import { NIVEIS_DIFICULDADE as NIVEIS, ROTULO_DIFICULDADE as ROTULO_NIVEL } from '../../lib/dificuldade';
import type { Simulado } from '../../types';

export function ProgressoScreen() {
  const tentativas = useLiveQuery(() => db.tentativas.toArray(), []) ?? [];
  const materias = useLiveQuery(() => db.materias.toArray(), []) ?? [];
  const config = useLiveQuery(() => db.config.get('app'), []);
  const simulados = useLiveQuery(
    async () => (await db.simulados.orderBy('iniciadoEm').reverse().toArray())
      .filter((s) => s.finalizadoEm !== undefined)
      .slice(0, 5),
    [],
  ) ?? [];

  const [editandoMeta, setEditandoMeta] = useState(false);
  const [resultadoId, setResultadoId] = useState<number | null>(null);
  const [semeando, setSemeando] = useState(false);

  async function preencherComDadosDeExemplo() {
    if (semeando) return;
    setSemeando(true);
    try {
      await seedDemoData();
    } finally {
      setSemeando(false);
    }
  }

  const meta = config?.metaDiaria ?? META_PADRAO;
  const hoje = diaLocal(new Date());
  const feitasHoje = tentativas.filter((t) => t.dia === hoje).length;
  const ofensiva = streak(tentativas, meta);
  const geral = taxaAcerto(tentativas);
  const niveis = porDificuldade(tentativas);
  const lista = insights(tentativas, materias);
  const nomeMateria = (id?: number) => materias.find((m) => m.id === id)?.nome ?? 'Sem matéria';
  const corMateria = (id?: number) => materias.find((m) => m.id === id)?.cor ?? 'var(--accent)';

  // Mesmo corte de `SimuladoResultado`: sem ele, revisar erros de um simulado
  // já finalizado infla a nota impressa aqui, na lista de "Últimos simulados".
  const notaDe = (s: Simulado) => {
    const doSimulado = tentativas.filter(
      (t) =>
        t.origem === 'simulado' &&
        t.origemId === s.id &&
        (s.finalizadoEm === undefined || t.respondidoEm <= s.finalizadoEm),
    );
    const acertos = doSimulado.filter((t) => t.acertou).length;
    return s.itens.length === 0 ? 0 : (acertos / s.itens.length) * 10;
  };

  return (
    <>
      <ScreenHeader
        title="Progresso"
        subtitle="Sua ofensiva, suas metas e seu desempenho"
        actions={
          <button
            className="btn-icon-sm"
            onClick={() => setEditandoMeta(true)}
            aria-label="Ajustar meta diária"
            title="Meta diária"
          >
            <Settings2 size={18} strokeWidth={2} />
          </button>
        }
      />

      <div className="screen-body">
        {tentativas.length === 0 ? (
          <EmptyState
            Icone={TrendingUp}
            titulo="Seu progresso aparece aqui"
            descricao="Responda seu primeiro exercício e esta tela ganha ofensiva, gráficos e insights sobre onde você está indo bem."
            acao={{
              rotulo: semeando ? 'Preenchendo…' : 'Preencher com dados de exemplo',
              onClick: preencherComDadosDeExemplo,
            }}
          />
        ) : (
          <div className="lista stagger">
            <section className="card card-ofensiva">
              <div className="ofensiva-numero">
                <Flame size={22} strokeWidth={2.2} />
                <strong>{ofensiva}</strong>
                <span>{ofensiva === 1 ? 'dia seguido' : 'dias seguidos'}</span>
              </div>
              <Donut
                pct={(feitasHoje / meta) * 100}
                tamanho={92}
                rotulo={`${feitasHoje} de ${meta} questões da meta de hoje`}
              />
              <span className="meta meta-num">
                {feitasHoje}/{meta} hoje
              </span>
            </section>

            <section className="card">
              <h3 className="secao-titulo">Últimos 7 dias</h3>
              <BarrasSemana dados={serieSemanal(tentativas, 7)} meta={meta} />
            </section>

            <section className="card card-acerto">
              <h3 className="secao-titulo">Acerto geral</h3>
              <Donut pct={geral.pct} rotulo={`${geral.pct}% de acerto em ${geral.total} questões`} />
              <span className="meta meta-num">{geral.total} questões respondidas</span>
              <div className="acerto-niveis">
                {NIVEIS.filter((n) => niveis[n].total > 0).map((n) => (
                  <BarraProgresso
                    key={n}
                    rotulo={ROTULO_NIVEL[n]}
                    pct={niveis[n].pct}
                    detalhe={`${niveis[n].acertos}/${niveis[n].total}`}
                    cor={`var(--${n})`}
                  />
                ))}
              </div>
            </section>

            <section className="card">
              <h3 className="secao-titulo">Por matéria</h3>
              {porMateria(tentativas).map((grupo) => (
                <BarraProgresso
                  key={grupo.materiaId ?? 'sem'}
                  rotulo={nomeMateria(grupo.materiaId)}
                  pct={grupo.pct}
                  detalhe={`${grupo.total} ${grupo.total === 1 ? 'questão' : 'questões'}`}
                  cor={corMateria(grupo.materiaId)}
                />
              ))}
            </section>

            {lista.length > 0 && (
              <section className="card">
                <h3 className="secao-titulo">Insights</h3>
                <ul className="insights">
                  {lista.map((i) => (
                    <li key={i.id}>{i.texto}</li>
                  ))}
                </ul>
              </section>
            )}

            {simulados.length > 0 && (
              <section className="card">
                <h3 className="secao-titulo">Últimos simulados</h3>
                <ul className="lista-simulados">
                  {simulados.map((s) => (
                    <li key={s.id}>
                      <button className="linha-simulado" onClick={() => setResultadoId(s.id!)}>
                        <span>{nomeMateria(s.materiaId)}</span>
                        <span className="meta meta-num">
                          {notaDe(s).toFixed(1)} ·{' '}
                          {new Date(s.iniciadoEm).toLocaleDateString('pt-BR')}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>

      {editandoMeta && <MetaSheet metaAtual={meta} onFechar={() => setEditandoMeta(false)} />}

      {resultadoId !== null && (
        <SimuladoResultado simuladoId={resultadoId} onFechar={() => setResultadoId(null)} />
      )}
    </>
  );
}
