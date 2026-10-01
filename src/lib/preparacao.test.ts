import { describe, expect, it } from 'vitest';
import { datasPreparacao, priorizarResumos } from './preparacao';
import { promptAjudaQuestao } from './gemini';
import type { Exercicio, Resumo, Tentativa } from '../types';

const resumos: Resumo[] = [1, 2].map(id => ({ id, titulo: `Resumo ${id}`, conteudo: '', fotoIds: [], criadoEm: '' }));
const exercicios: Exercicio[] = [1, 2].map(id => ({ id, resumoId: id, itens: [], criadoEm: '' }));
const tentativa = (origemId: number, acertou: boolean, respondidoEm: string): Tentativa => ({ origem: 'exercicio', origemId, itemIndex: 0, dificuldade: 'facil', escolha: 0, acertou, dia: '2026-09-10', respondidoEm });

describe('preparação para a prova', () => {
  it('prioriza o resumo com erro atual sem alterar a lista original', () => {
    expect(priorizarResumos(resumos, exercicios, [tentativa(2, false, '2026-09-10T10:00:00')]).map(r => r.id)).toEqual([2, 1]);
    expect(resumos.map(r => r.id)).toEqual([1, 2]);
  });
  it('não prioriza um erro já corrigido nem uma fonte fora da seleção', () => {
    const ts = [tentativa(2, true, '2026-09-10T11:00:00'), tentativa(2, false, '2026-09-10T10:00:00'), tentativa(99, false, '2026-09-10T12:00:00')];
    expect(priorizarResumos(resumos, exercicios, ts).map(r => r.id)).toEqual([1, 2]);
  });
  it('distribui as etapas até a véspera, inclusive na virada do mês', () => {
    expect(datasPreparacao('2026-10-03', '2026-09-30')).toEqual(['2026-09-30', '2026-10-01', '2026-10-02']);
  });
  it('concentra em hoje quando a prova é hoje, amanhã ou já passou', () => {
    for (const prova of ['2026-09-09', '2026-09-10', '2026-09-11']) expect(datasPreparacao(prova, '2026-09-10')).toEqual(Array(3).fill('2026-09-10'));
  });
});

it('o pedido de dica não inclui gabarito nem a escolha do aluno', () => {
  const item = { pergunta: 'Qual é a velocidade?', alternativas: ['2 m/s', '5 m/s', '10 m/s', '20 m/s'], correta: 1, dificuldade: 'facil' as const, resposta: 'GABARITO_EXCLUSIVO' };
  expect(promptAjudaQuestao(item, 0, false, 'Aula de física')).not.toContain('GABARITO_EXCLUSIVO');
  expect(promptAjudaQuestao(item, 0, true, 'Aula de física')).toContain('GABARITO_EXCLUSIVO');
  expect(promptAjudaQuestao(item, 0, true, 'Aula de física')).toContain('Escolha do aluno: 2 m/s');
});
