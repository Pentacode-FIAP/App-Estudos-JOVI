import { describe, expect, it } from 'vitest';
import {
  diaLocal,
  diffDias,
  porDia,
  somarDias,
  streak,
  serieSemanal,
  taxaAcerto,
  porMateria,
  porDificuldade,
  errosParaRevisar,
  insights,
} from './progresso';
import type { Tentativa, Materia } from '../types';

function tentativa(parcial: Partial<Tentativa> = {}): Tentativa {
  return {
    origem: 'exercicio',
    origemId: 1,
    itemIndex: 0,
    materiaId: 1,
    dificuldade: 'facil',
    escolha: 0,
    acertou: true,
    dia: '2026-09-02',
    respondidoEm: '2026-09-02T10:00:00.000Z',
    ...parcial,
  };
}

describe('diaLocal', () => {
  it('formata a data no fuso local', () => {
    expect(diaLocal(new Date(2026, 8, 2, 14, 30))).toBe('2026-09-02');
  });

  it('mantém o dia local mesmo tarde da noite, quando o UTC já virou', () => {
    // 22h no Brasil (UTC-3) é 01h do dia seguinte em UTC. O estudo é de hoje.
    expect(diaLocal(new Date(2026, 8, 2, 22, 0))).toBe('2026-09-02');
  });

  it('preenche mês e dia com zero à esquerda', () => {
    expect(diaLocal(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('somarDias', () => {
  it('anda para trás dentro do mês', () => {
    expect(somarDias('2026-09-02', -1)).toBe('2026-09-01');
  });

  it('atravessa a virada de mês', () => {
    expect(somarDias('2026-09-01', -1)).toBe('2026-08-31');
  });

  it('atravessa a virada de ano', () => {
    expect(somarDias('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('anda para frente', () => {
    expect(somarDias('2026-02-28', 1)).toBe('2026-03-01');
  });
});

describe('diffDias', () => {
  it('conta os dias entre duas datas', () => {
    expect(diffDias('2026-08-26', '2026-09-02')).toBe(7);
  });

  it('devolve zero para o mesmo dia', () => {
    expect(diffDias('2026-09-02', '2026-09-02')).toBe(0);
  });
});

describe('porDia', () => {
  it('agrupa as tentativas pela chave de dia', () => {
    const mapa = porDia([
      tentativa({ dia: '2026-09-01' }),
      tentativa({ dia: '2026-09-02' }),
      tentativa({ dia: '2026-09-02' }),
    ]);
    expect(mapa.get('2026-09-01')).toHaveLength(1);
    expect(mapa.get('2026-09-02')).toHaveLength(2);
  });

  it('devolve mapa vazio para lista vazia', () => {
    expect(porDia([]).size).toBe(0);
  });
});

/** n tentativas num dia, o mínimo para exercitar a regra da meta. */
function noDia(dia: string, n: number): Tentativa[] {
  return Array.from({ length: n }, () => tentativa({ dia }));
}

describe('streak', () => {
  const HOJE = '2026-09-02';

  it('conta os dias consecutivos que bateram a meta, incluindo hoje', () => {
    const ts = [
      ...noDia('2026-09-02', 10),
      ...noDia('2026-09-01', 12),
      ...noDia('2026-08-31', 10),
    ];
    expect(streak(ts, 10, HOJE)).toBe(3);
  });

  it('não zera quando hoje ainda não bateu a meta', () => {
    // Regra de produto: a ofensiva não pode "sumir" toda madrugada.
    const ts = [
      ...noDia('2026-09-02', 3),
      ...noDia('2026-09-01', 10),
      ...noDia('2026-08-31', 10),
    ];
    expect(streak(ts, 10, HOJE)).toBe(2);
  });

  it('para no primeiro dia que não bateu a meta', () => {
    const ts = [
      ...noDia('2026-09-02', 10),
      ...noDia('2026-09-01', 4),
      ...noDia('2026-08-31', 10),
    ];
    expect(streak(ts, 10, HOJE)).toBe(1);
  });

  it('para no buraco de dias sem nenhuma tentativa', () => {
    const ts = [...noDia('2026-09-02', 10), ...noDia('2026-08-30', 10)];
    expect(streak(ts, 10, HOJE)).toBe(1);
  });

  it('conta dia que passou da meta', () => {
    expect(streak(noDia('2026-09-02', 40), 10, HOJE)).toBe(1);
  });

  it('devolve zero sem tentativa nenhuma', () => {
    expect(streak([], 10, HOJE)).toBe(0);
  });

  it('devolve zero quando nem hoje nem ontem bateram', () => {
    const ts = [...noDia('2026-09-02', 1), ...noDia('2026-09-01', 1)];
    expect(streak(ts, 10, HOJE)).toBe(0);
  });

  it('devolve zero para meta inválida em vez de laçar para sempre', () => {
    expect(streak(noDia('2026-09-02', 5), 0, HOJE)).toBe(0);
  });
});

describe('serieSemanal', () => {
  const HOJE = '2026-09-02';

  it('devolve um ponto por dia, do mais antigo para hoje', () => {
    const serie = serieSemanal([], 7, HOJE);
    expect(serie).toHaveLength(7);
    expect(serie[0].dia).toBe('2026-08-27');
    expect(serie[6].dia).toBe('2026-09-02');
  });

  it('preenche com zero os dias sem tentativa', () => {
    const serie = serieSemanal(noDia('2026-09-02', 3), 7, HOJE);
    expect(serie[6].total).toBe(3);
    expect(serie[5].total).toBe(0);
  });

  it('ignora tentativa mais velha que a janela', () => {
    const serie = serieSemanal(noDia('2026-01-01', 50), 7, HOJE);
    expect(serie.every((p) => p.total === 0)).toBe(true);
  });
});

describe('taxaAcerto', () => {
  it('calcula a porcentagem arredondada', () => {
    const ts = [
      tentativa({ acertou: true }),
      tentativa({ acertou: true }),
      tentativa({ acertou: false }),
    ];
    expect(taxaAcerto(ts)).toEqual({ acertos: 2, total: 3, pct: 67 });
  });

  it('devolve zero por cento sem dividir por zero', () => {
    expect(taxaAcerto([])).toEqual({ acertos: 0, total: 0, pct: 0 });
  });
});

describe('porMateria', () => {
  it('agrupa por matéria e ordena pela mais estudada', () => {
    const ts = [
      tentativa({ materiaId: 1, acertou: true }),
      tentativa({ materiaId: 2, acertou: false }),
      tentativa({ materiaId: 2, acertou: true }),
      tentativa({ materiaId: 2, acertou: true }),
    ];
    const grupos = porMateria(ts);
    expect(grupos[0]).toEqual({ materiaId: 2, acertos: 2, total: 3, pct: 67 });
    expect(grupos[1]).toEqual({ materiaId: 1, acertos: 1, total: 1, pct: 100 });
  });

  it('junta as tentativas sem matéria num grupo próprio', () => {
    const grupos = porMateria([tentativa({ materiaId: undefined })]);
    expect(grupos[0].materiaId).toBeUndefined();
    expect(grupos[0].total).toBe(1);
  });
});

describe('porDificuldade', () => {
  it('devolve os três níveis, mesmo os sem tentativa', () => {
    const ts = [
      tentativa({ dificuldade: 'facil', acertou: true }),
      tentativa({ dificuldade: 'dificil', acertou: false }),
    ];
    const niveis = porDificuldade(ts);
    expect(niveis.facil.pct).toBe(100);
    expect(niveis.dificil.pct).toBe(0);
    expect(niveis.medio).toEqual({ acertos: 0, total: 0, pct: 0 });
  });
});

const MATERIAS: Materia[] = [
  { id: 1, nome: 'Cálculo II', cor: '#2563eb' },
  { id: 2, nome: 'Física', cor: '#be123c' },
];

describe('errosParaRevisar', () => {
  const HOJE = '2026-09-02';

  it('devolve a questão que ficou errada', () => {
    const ts = [tentativa({ itemIndex: 0, acertou: false })];
    expect(errosParaRevisar(ts, 30, HOJE)).toHaveLength(1);
  });

  it('tira da fila a questão acertada depois do erro', () => {
    const ts = [
      tentativa({ itemIndex: 0, acertou: false, respondidoEm: '2026-09-01T10:00:00.000Z', dia: '2026-09-01' }),
      tentativa({ itemIndex: 0, acertou: true, respondidoEm: '2026-09-02T10:00:00.000Z', dia: '2026-09-02' }),
    ];
    expect(errosParaRevisar(ts, 30, HOJE)).toHaveLength(0);
  });

  it('mantém na fila a questão que voltou a ser errada', () => {
    const ts = [
      tentativa({ itemIndex: 0, acertou: true, respondidoEm: '2026-09-01T10:00:00.000Z', dia: '2026-09-01' }),
      tentativa({ itemIndex: 0, acertou: false, respondidoEm: '2026-09-02T10:00:00.000Z', dia: '2026-09-02' }),
    ];
    expect(errosParaRevisar(ts, 30, HOJE)).toHaveLength(1);
  });

  it('separa questões de origens diferentes com o mesmo índice', () => {
    const ts = [
      tentativa({ origem: 'exercicio', origemId: 1, itemIndex: 0, acertou: false }),
      tentativa({ origem: 'simulado', origemId: 1, itemIndex: 0, acertou: false }),
    ];
    expect(errosParaRevisar(ts, 30, HOJE)).toHaveLength(2);
  });

  it('com escopo, devolve só os erros daquele grupo', () => {
    const ts = [
      tentativa({ origem: 'simulado', origemId: 7, itemIndex: 0, acertou: false }),
      tentativa({ origem: 'simulado', origemId: 8, itemIndex: 0, acertou: false }),
      tentativa({ origem: 'exercicio', origemId: 7, itemIndex: 0, acertou: false }),
    ];
    const fila = errosParaRevisar(ts, 30, HOJE, { origem: 'simulado', origemId: 7 });
    expect(fila).toHaveLength(1);
    expect(fila[0]).toMatchObject({ origem: 'simulado', origemId: 7 });
  });

  it('com escopo, a revisão certeira tira a questão da fila do grupo', () => {
    const ts = [
      tentativa({ origem: 'simulado', origemId: 7, itemIndex: 0, acertou: false, respondidoEm: '2026-09-01T10:00:00.000Z', dia: '2026-09-01' }),
      tentativa({ origem: 'simulado', origemId: 7, itemIndex: 0, acertou: true, respondidoEm: '2026-09-02T10:00:00.000Z', dia: '2026-09-02' }),
    ];
    expect(errosParaRevisar(ts, 30, HOJE, { origem: 'simulado', origemId: 7 })).toHaveLength(0);
  });

  it('com escopo, continua respeitando a janela de dias', () => {
    const ts = [
      tentativa({ origem: 'simulado', origemId: 7, itemIndex: 0, acertou: false, respondidoEm: '2026-07-01T10:00:00.000Z', dia: '2026-07-01' }),
    ];
    expect(errosParaRevisar(ts, 30, HOJE, { origem: 'simulado', origemId: 7 })).toHaveLength(0);
  });

  it('ignora erro mais velho que a janela', () => {
    const ts = [tentativa({ acertou: false, dia: '2026-01-01' })];
    expect(errosParaRevisar(ts, 30, HOJE)).toHaveLength(0);
  });
});

describe('insights', () => {
  const HOJE = '2026-09-02';

  it('não afirma nada com amostra pequena', () => {
    const ts = [
      tentativa({ materiaId: 1, dificuldade: 'facil', acertou: true }),
      tentativa({ materiaId: 1, dificuldade: 'dificil', acertou: false }),
    ];
    expect(insights(ts, MATERIAS, HOJE)).toEqual([]);
  });

  it('aponta o gap entre fácil e difícil quando há amostra', () => {
    const ts = [
      ...Array.from({ length: 10 }, () => tentativa({ materiaId: 1, dificuldade: 'facil', acertou: true })),
      ...Array.from({ length: 10 }, () => tentativa({ materiaId: 1, dificuldade: 'dificil', acertou: false })),
    ];
    const textos = insights(ts, MATERIAS, HOJE).map((i) => i.texto);
    expect(textos.some((t) => t.includes('Cálculo II') && t.includes('100%') && t.includes('0%'))).toBe(true);
  });

  it('avisa da matéria parada', () => {
    const ts = Array.from({ length: 10 }, () =>
      tentativa({ materiaId: 2, dia: '2026-08-20', acertou: true }),
    );
    const textos = insights(ts, MATERIAS, HOJE).map((i) => i.texto);
    expect(textos.some((t) => t.includes('Física') && t.includes('13 dias'))).toBe(true);
  });

  it('devolve no máximo três insights', () => {
    const ts = [
      ...Array.from({ length: 10 }, () => tentativa({ materiaId: 1, dificuldade: 'facil', acertou: true })),
      ...Array.from({ length: 10 }, () => tentativa({ materiaId: 1, dificuldade: 'dificil', acertou: false })),
      ...Array.from({ length: 10 }, () => tentativa({ materiaId: 2, dia: '2026-08-01', acertou: false })),
    ];
    expect(insights(ts, MATERIAS, HOJE).length).toBeLessThanOrEqual(3);
  });
});
