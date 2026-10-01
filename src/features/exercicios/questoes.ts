import type { Exercicio, ExercicioItem } from '../../types';
import type { QuestaoDaSerie } from './SerieExercicios';

/**
 * As questões respondíveis de um exercício, prontas para a `SerieExercicios`.
 *
 * Itens legados (sem `alternativas`, gerados antes da v2) ficam de fora: não há
 * o que clicar neles. O `itemIndex` é o da lista ORIGINAL, senão a `Tentativa`
 * gravada aponta para a questão errada quando o exercício mistura as duas
 * gerações — por isso o filtro acontece depois do índice, não antes.
 */
export function questoesDoExercicio(
  exercicio: Exercicio | undefined,
  materiaId?: number,
): QuestaoDaSerie[] {
  if (!exercicio?.id) return [];
  const origemId = exercicio.id;
  return exercicio.itens.flatMap((item, itemIndex) =>
    item.alternativas === undefined
      ? []
      : [{ item, origem: 'exercicio' as const, origemId, itemIndex, materiaId }],
  );
}

/** O resto: itens antigos, que só dá para ler em `ExercicioLista`. */
export function itensLegados(exercicio: Exercicio | undefined): ExercicioItem[] {
  return exercicio?.itens.filter((i) => i.alternativas === undefined) ?? [];
}
