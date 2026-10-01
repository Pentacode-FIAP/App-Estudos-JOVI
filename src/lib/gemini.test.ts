import { describe, expect, it } from 'vitest';
import { montarLotes, parseQuestoes, promptQuestoes } from './gemini';

const QUESTAO_OK = {
  pergunta: 'Qual a derivada de ln(sin x)?',
  alternativas: ['1/sin x', 'cot x', 'cos x · ln x', '-tan x'],
  correta: 1,
  dificuldade: 'dificil',
  resposta: 'Regra da cadeia: (1/sin x)·cos x = cot x.',
};

describe('parseQuestoes', () => {
  it('lê um JSON limpo', () => {
    const itens = parseQuestoes(JSON.stringify([QUESTAO_OK]));
    expect(itens).toHaveLength(1);
    expect(itens[0].correta).toBe(1);
    expect(itens[0].alternativas).toHaveLength(4);
  });

  it('tira a cerca de markdown que o modelo às vezes devolve', () => {
    const texto = '```json\n' + JSON.stringify([QUESTAO_OK]) + '\n```';
    expect(parseQuestoes(texto)).toHaveLength(1);
  });

  it('descarta o item torto e mantém o bom', () => {
    // O comportamento antigo derrubava a geração inteira por causa de um campo.
    const texto = JSON.stringify([QUESTAO_OK, { pergunta: 'sem nada' }]);
    expect(parseQuestoes(texto)).toHaveLength(1);
  });

  it('descarta item com correta fora de 0..3', () => {
    const texto = JSON.stringify([QUESTAO_OK, { ...QUESTAO_OK, correta: 7 }]);
    expect(parseQuestoes(texto)).toHaveLength(1);
  });

  it('descarta item com número errado de alternativas', () => {
    const texto = JSON.stringify([QUESTAO_OK, { ...QUESTAO_OK, alternativas: ['a', 'b'] }]);
    expect(parseQuestoes(texto)).toHaveLength(1);
  });

  it('descarta item com alternativa vazia', () => {
    const texto = JSON.stringify([QUESTAO_OK, { ...QUESTAO_OK, alternativas: ['a', '', 'c', 'd'] }]);
    expect(parseQuestoes(texto)).toHaveLength(1);
  });

  it('descarta item com dificuldade fora do enum', () => {
    const texto = JSON.stringify([QUESTAO_OK, { ...QUESTAO_OK, dificuldade: 'impossivel' }]);
    expect(parseQuestoes(texto)).toHaveLength(1);
  });

  it('lança quando não é JSON', () => {
    expect(() => parseQuestoes('desculpe, não consegui gerar')).toThrow();
  });

  it('lança quando nenhum item sobrevive', () => {
    expect(() => parseQuestoes(JSON.stringify([{ pergunta: 'só isso' }]))).toThrow();
  });

  it('lança quando o JSON não é uma lista', () => {
    expect(() => parseQuestoes(JSON.stringify({ pergunta: 'x' }))).toThrow();
  });
});

describe('promptQuestoes', () => {
  it('fixa a dificuldade quando o nível não é misto', () => {
    const p = promptQuestoes('resumo', { qtd: 5, nivel: 'dificil' });
    expect(p).toContain('TODAS as questões');
    expect(p).toContain('dificil');
  });

  it('pede variação quando o nível é misto', () => {
    const p = promptQuestoes('resumo', { qtd: 5, nivel: 'misto' });
    expect(p).toContain('Varie a dificuldade');
  });

  it('pede a quantidade exata', () => {
    expect(promptQuestoes('resumo', { qtd: 15, nivel: 'misto' })).toContain('exatamente 15');
  });
});

describe('montarLotes', () => {
  const resumos = [
    { conteudo: 'A' }, { conteudo: 'B' }, { conteudo: 'C' }, { conteudo: 'D' },
  ];

  it('quebra 20 questões em dois lotes de 10', () => {
    const lotes = montarLotes(resumos, 20);
    expect(lotes.map((l) => l.qtd)).toEqual([10, 10]);
  });

  it('deixa o resto no último lote', () => {
    expect(montarLotes(resumos, 25).map((l) => l.qtd)).toEqual([10, 10, 5]);
  });

  it('não quebra quando cabe num lote só', () => {
    expect(montarLotes(resumos, 10).map((l) => l.qtd)).toEqual([10]);
  });

  it('distribui os resumos entre os lotes, sem repetir', () => {
    const lotes = montarLotes(resumos, 20);
    expect(lotes[0].conteudo).toContain('A');
    expect(lotes[0].conteudo).toContain('C');
    expect(lotes[1].conteudo).toContain('B');
    expect(lotes[1].conteudo).toContain('D');
  });

  it('repete o material inteiro quando há menos resumos que lotes', () => {
    const lotes = montarLotes([{ conteudo: 'A' }], 30);
    expect(lotes).toHaveLength(3);
    expect(lotes.every((l) => l.conteudo.includes('A'))).toBe(true);
  });
});
