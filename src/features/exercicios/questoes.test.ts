import { describe, expect, it } from 'vitest';
import { itensLegados, questoesDoExercicio } from './questoes';
import type { Exercicio, ExercicioItem } from '../../types';

const novo = (pergunta: string): ExercicioItem => ({
  pergunta,
  dificuldade: 'facil',
  resposta: 'porque sim',
  alternativas: ['a', 'b', 'c', 'd'],
  correta: 0,
});

const legado = (pergunta: string): ExercicioItem => ({
  pergunta,
  dificuldade: 'medio',
  resposta: 'resposta aberta',
});

const exercicio = (itens: ExercicioItem[]): Exercicio => ({
  id: 7,
  resumoId: 3,
  itens,
  criadoEm: '2026-09-10T10:00:00.000Z',
});

describe('questoesDoExercicio', () => {
  it('devolve lista vazia sem exercício', () => {
    expect(questoesDoExercicio(undefined)).toEqual([]);
  });

  it('ignora itens legados, sem alternativas', () => {
    const q = questoesDoExercicio(exercicio([legado('velha'), novo('nova')]));
    expect(q).toHaveLength(1);
    expect(q[0].item.pergunta).toBe('nova');
  });

  it('usa o índice na lista original, não o da lista filtrada', () => {
    const q = questoesDoExercicio(exercicio([legado('velha'), novo('nova'), novo('outra')]));
    expect(q.map((x) => x.itemIndex)).toEqual([1, 2]);
  });

  it('mantém índices corretos com perguntas repetidas', () => {
    const q = questoesDoExercicio(exercicio([novo('igual'), novo('igual')]));
    expect(q.map((x) => x.itemIndex)).toEqual([0, 1]);
  });

  it('carrega origem, origemId e matéria em cada questão', () => {
    const [q] = questoesDoExercicio(exercicio([novo('nova')]), 42);
    expect(q).toMatchObject({ origem: 'exercicio', origemId: 7, materiaId: 42 });
  });
});

describe('itensLegados', () => {
  it('devolve só os itens sem alternativas', () => {
    const itens = itensLegados(exercicio([legado('velha'), novo('nova')]));
    expect(itens.map((i) => i.pergunta)).toEqual(['velha']);
  });

  it('devolve lista vazia sem exercício', () => {
    expect(itensLegados(undefined)).toEqual([]);
  });
});
