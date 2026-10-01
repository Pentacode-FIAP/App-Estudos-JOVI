import type { Exercicio, Resumo, Tentativa } from '../types';
import { diaLocal, diffDias, somarDias } from './progresso';

/** Ordena pelos erros da última tentativa; desempata mantendo a ordem escolhida. */
export function priorizarResumos(resumos: Resumo[], exercicios: Exercicio[], tentativas: Tentativa[]): Resumo[] {
  const ultimas = new Map<string, Tentativa>();
  for (const t of tentativas) {
    if (t.origem !== 'exercicio') continue;
    const chave = `${t.origemId}:${t.itemIndex}`;
    const anterior = ultimas.get(chave);
    if (!anterior || t.respondidoEm > anterior.respondidoEm || (t.respondidoEm === anterior.respondidoEm && (t.id ?? 0) > (anterior.id ?? 0))) ultimas.set(chave, t);
  }
  const porExercicio = new Map(exercicios.map(e => [e.id, e.resumoId]));
  const erros = new Map<number, number>();
  for (const t of ultimas.values()) {
    const resumoId = porExercicio.get(t.origemId);
    if (!t.acertou && resumoId !== undefined) erros.set(resumoId, (erros.get(resumoId) ?? 0) + 1);
  }
  return [...resumos].sort((a, b) => (erros.get(b.id!) ?? 0) - (erros.get(a.id!) ?? 0));
}

export function datasPreparacao(prova: string, hoje = diaLocal(new Date())): string[] {
  const dias = Math.max(0, diffDias(hoje, prova) - 1);
  return [hoje, somarDias(hoje, Math.floor(dias / 2)), somarDias(hoje, dias)];
}
