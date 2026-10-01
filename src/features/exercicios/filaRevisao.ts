import { db } from '../../lib/db';
import { diaLocal, errosParaRevisar, type EscopoRevisao } from '../../lib/progresso';
import type { QuestaoDaSerie } from './SerieExercicios';

const JANELA_DIAS = 30;

/**
 * As questões que estão erradas agora, prontas para responder de novo.
 * Não chama a IA: tudo é remontado do que já está no IndexedDB.
 *
 * Sem `escopo` é a fila global; com ele, os erros de um simulado ou do
 * exercício de um resumo só.
 */
export async function montarFilaRevisao(
  escopo?: EscopoRevisao,
  dias = JANELA_DIAS,
): Promise<QuestaoDaSerie[]> {
  // Com escopo, o índice composto entrega só o lote do grupo; sem ele não há
  // recorte possível e a fila global lê o histórico inteiro mesmo.
  const tentativas = escopo
    ? await db.tentativas.where('[origem+origemId]').equals([escopo.origem, escopo.origemId]).toArray()
    : await db.tentativas.toArray();
  const pendentes = errosParaRevisar(tentativas, dias, diaLocal(new Date()), escopo);
  if (pendentes.length === 0) return [];

  const idsExercicio = [...new Set(pendentes.filter((t) => t.origem === 'exercicio').map((t) => t.origemId))];
  const idsSimulado = [...new Set(pendentes.filter((t) => t.origem === 'simulado').map((t) => t.origemId))];

  const [exercicios, simulados] = await Promise.all([
    db.exercicios.bulkGet(idsExercicio),
    db.simulados.bulkGet(idsSimulado),
  ]);

  const porChave = new Map<string, { itens: { alternativas?: string[] }[] }>();
  exercicios.forEach((e, i) => { if (e) porChave.set(`exercicio:${idsExercicio[i]}`, e); });
  simulados.forEach((s, i) => { if (s) porChave.set(`simulado:${idsSimulado[i]}`, s); });

  return pendentes.flatMap((t) => {
    const origem = porChave.get(`${t.origem}:${t.origemId}`);
    const item = origem?.itens[t.itemIndex];
    // A origem pode ter sido apagada, ou ser um item legado sem alternativas:
    // nos dois casos não há o que responder.
    if (!item || item.alternativas === undefined) return [];
    return [{
      item,
      origem: t.origem,
      origemId: t.origemId,
      itemIndex: t.itemIndex,
      materiaId: t.materiaId,
    } as QuestaoDaSerie];
  });
}
