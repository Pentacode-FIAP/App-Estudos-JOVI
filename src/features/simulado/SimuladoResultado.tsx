import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { RotateCcw } from 'lucide-react';
import { Donut } from '../../components/charts/Donut';
import { QuestaoCard } from '../../components/QuestaoCard';
import { Sheet } from '../../components/Sheet';
import { db } from '../../lib/db';
import { porDificuldade } from '../../lib/progresso';
import { NIVEIS_DIFICULDADE as NIVEIS, ROTULO_DIFICULDADE as ROTULO } from '../../lib/dificuldade';
import { AjudaQuestao } from '../exercicios/AjudaQuestao';
import { SerieExercicios } from '../exercicios/SerieExercicios';
import { montarFilaRevisao } from '../exercicios/filaRevisao';

export function SimuladoResultado({
  simuladoId,
  onFechar,
}: {
  simuladoId: number;
  onFechar: () => void;
}) {
  const simulado = useLiveQuery(() => db.simulados.get(simuladoId), [simuladoId]);
  const tentativas = useLiveQuery(
    () => db.tentativas.where('[origem+origemId]').equals(['simulado', simuladoId]).toArray(),
    [simuladoId],
  ) ?? [];
  const fila = useLiveQuery(
    () => montarFilaRevisao({ origem: 'simulado', origemId: simuladoId }),
    [simuladoId],
  ) ?? [];

  const [revisando, setRevisando] = useState(false);

  if (!simulado) return null;

  // A fila de revisão reaproveita questões erradas de simulados: respondê-las de
  // novo grava uma NOVA tentativa sob o mesmo [origem+origemId], depois que a
  // prova já fechou. `finalizadoEm` é escrito na mesma transação das tentativas
  // originais, com o mesmo instante — então cortar em `respondidoEm <=
  // finalizadoEm` isola exatamente o lote da prova, sem contar revisões
  // posteriores na nota nem na escolha exibida por questão.
  const finalizadoEm = simulado.finalizadoEm;
  const daProva = finalizadoEm === undefined
    ? tentativas
    : tentativas.filter((t) => t.respondidoEm <= finalizadoEm);

  // A nota usa o TOTAL de questões, não só as respondidas: em branco é erro.
  const acertos = daProva.filter((t) => t.acertou).length;
  const nota = simulado.itens.length === 0 ? 0 : (acertos / simulado.itens.length) * 10;
  const niveis = porDificuldade(daProva);
  const escolhaDe = (i: number) => daProva.find((t) => t.itemIndex === i)?.escolha;

  return (
    <>
      <Sheet
        titulo="Resultado"
        onFechar={onFechar}
        footer={
          <button className="btn-primary btn-block" onClick={onFechar}>
            Fechar
          </button>
        }
      >
        <div className="resultado-serie">
          {/* O anel usa a MESMA nota do texto abaixo (não a taxa de acerto entre
              respondidas): em branco conta como erro na nota, e o anel tem que
              concordar com o número impresso ao lado dele. */}
          <Donut
            pct={nota * 10}
            rotulo={`Nota ${nota.toFixed(1)}, ${acertos} de ${simulado.itens.length} questões`}
          />
          <p className="simulado-nota">
            <strong>{nota.toFixed(1)}</strong>
            <span>
              {acertos} de {simulado.itens.length}
            </span>
          </p>

          <ul className="resultado-niveis">
            {NIVEIS.filter((n) => niveis[n].total > 0).map((n) => (
              <li key={n}>
                <span className={`pill pill-${n}`}>{ROTULO[n]}</span>
                <span className="meta meta-num">
                  {niveis[n].acertos}/{niveis[n].total}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Revisar exige a prova fechada: sem `finalizadoEm` não há corte que separe
            o lote original das respostas de revisão, e a nota subiria sozinha. */}
        {simulado.finalizadoEm !== undefined && fila.length > 0 && (
          <button className="btn-ghost btn-block" onClick={() => setRevisando(true)}>
            <RotateCcw size={16} strokeWidth={2} />
            Revisar {fila.length} {fila.length === 1 ? 'erro' : 'erros'} deste simulado
          </button>
        )}

        <h3 className="secao-titulo">Revisão</h3>
        {simulado.itens.map((item, i) => (
          <div key={i} style={{ marginBottom: 24 }}><QuestaoCard
            item={item}
            numero={i + 1}
            total={simulado.itens.length}
            escolha={escolhaDe(i)}
            revelado
            onEscolher={() => {}}
          /><AjudaQuestao item={item} escolha={escolhaDe(i)} revelado origem="simulado" origemId={simuladoId} /></div>
        ))}
      </Sheet>

      {revisando && fila.length > 0 && (
        <SerieExercicios
          titulo="Revisar erros"
          questoes={fila}
          onFechar={() => setRevisando(false)}
        />
      )}
    </>
  );
}
