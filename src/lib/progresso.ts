import type { Tentativa, Dificuldade, Materia } from '../types';

/**
 * Chave de dia no fuso LOCAL. Nunca use `toISOString().slice(0,10)`: em UTC-3,
 * estudar às 22h cairia no dia seguinte e a ofensiva contaria errado.
 */
export function diaLocal(d: Date): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** O construtor do Date normaliza sozinho a virada de mês e de ano. */
export function somarDias(dia: string, delta: number): string {
  const [ano, mes, d] = dia.split('-').map(Number);
  return diaLocal(new Date(ano, mes - 1, d + delta));
}

export function diffDias(de: string, ate: string): number {
  const [a1, m1, d1] = de.split('-').map(Number);
  const [a2, m2, d2] = ate.split('-').map(Number);
  const ms = new Date(a2, m2 - 1, d2).getTime() - new Date(a1, m1 - 1, d1).getTime();
  // Arredonda porque o horário de verão pode deixar um dia com 23 ou 25 horas.
  return Math.round(ms / 86_400_000);
}

export function porDia(ts: Tentativa[]): Map<string, Tentativa[]> {
  const mapa = new Map<string, Tentativa[]>();
  for (const t of ts) {
    const lista = mapa.get(t.dia);
    if (lista) lista.push(t);
    else mapa.set(t.dia, [t]);
  }
  return mapa;
}

/**
 * Dias consecutivos que fecharam a meta, contando para trás.
 *
 * A meta é de questões RESPONDIDAS, não acertadas: se errar quebrasse a
 * ofensiva, o app puniria exatamente quem tenta questão difícil.
 */
export function streak(ts: Tentativa[], meta: number, hoje = diaLocal(new Date())): number {
  // Sem essa guarda, meta 0 faria todo dia "bater" e o laço nunca terminaria.
  if (meta <= 0) return 0;

  const mapa = porDia(ts);
  const bateu = (dia: string) => (mapa.get(dia)?.length ?? 0) >= meta;

  // Se hoje ainda está em aberto, a contagem começa em ontem — senão a ofensiva
  // zeraria visualmente toda madrugada e voltaria no meio do dia.
  let cursor = bateu(hoje) ? hoje : somarDias(hoje, -1);
  let total = 0;
  while (bateu(cursor)) {
    total += 1;
    cursor = somarDias(cursor, -1);
  }
  return total;
}

export interface Acerto {
  acertos: number;
  total: number;
  pct: number;
}

const NIVEIS: Dificuldade[] = ['facil', 'medio', 'dificil'];

/** Um ponto por dia, do mais antigo para hoje — inclusive os dias sem estudo. */
export function serieSemanal(
  ts: Tentativa[],
  dias: number,
  hoje = diaLocal(new Date()),
): { dia: string; total: number }[] {
  const mapa = porDia(ts);
  const serie: { dia: string; total: number }[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const dia = somarDias(hoje, -i);
    serie.push({ dia, total: mapa.get(dia)?.length ?? 0 });
  }
  return serie;
}

export function taxaAcerto(ts: Tentativa[]): Acerto {
  const total = ts.length;
  const acertos = ts.filter((t) => t.acertou).length;
  return { acertos, total, pct: total === 0 ? 0 : Math.round((acertos / total) * 100) };
}

export function porMateria(ts: Tentativa[]): (Acerto & { materiaId?: number })[] {
  // 'sem' como chave porque `undefined` num Map funciona, mas some na leitura.
  const grupos = new Map<number | 'sem', Tentativa[]>();
  for (const t of ts) {
    const chave = t.materiaId ?? 'sem';
    const lista = grupos.get(chave);
    if (lista) lista.push(t);
    else grupos.set(chave, [t]);
  }
  return [...grupos.entries()]
    .map(([chave, lista]) => ({
      materiaId: chave === 'sem' ? undefined : chave,
      ...taxaAcerto(lista),
    }))
    .sort((a, b) => b.total - a.total);
}

export function porDificuldade(ts: Tentativa[]): Record<Dificuldade, Acerto> {
  const saida = {} as Record<Dificuldade, Acerto>;
  for (const nivel of NIVEIS) {
    saida[nivel] = taxaAcerto(ts.filter((t) => t.dificuldade === nivel));
  }
  return saida;
}

/** Amostra mínima para o app afirmar qualquer coisa sobre desempenho. */
const AMOSTRA_MINIMA = 10;

function chaveQuestao(t: Tentativa): string {
  return `${t.origem}:${t.origemId}:${t.itemIndex}`;
}

/** Recorte de um grupo só: um simulado, ou o exercício de um resumo. */
export interface EscopoRevisao {
  origem: Tentativa['origem'];
  origemId: number;
}

/**
 * Ponteiros das questões que estão erradas AGORA: a última tentativa de cada
 * questão dentro da janela. Quem chama resolve o enunciado no Dexie.
 *
 * Com `escopo`, olha só um grupo. Filtrar antes de achar a última tentativa dá
 * no mesmo que filtrar depois — `chaveQuestao` já separa por origem — e evita
 * varrer o histórico inteiro para montar a fila de um simulado só.
 */
export function errosParaRevisar(
  ts: Tentativa[],
  dias: number,
  hoje = diaLocal(new Date()),
  escopo?: EscopoRevisao,
): Tentativa[] {
  const limite = somarDias(hoje, -(dias - 1));
  // 'YYYY-MM-DD' ordena lexicograficamente igual a cronologicamente.
  const recentes = ts.filter(
    (t) =>
      t.dia >= limite &&
      (escopo === undefined || (t.origem === escopo.origem && t.origemId === escopo.origemId)),
  );

  const ultima = new Map<string, Tentativa>();
  for (const t of recentes) {
    const chave = chaveQuestao(t);
    const atual = ultima.get(chave);
    if (!atual || t.respondidoEm > atual.respondidoEm) ultima.set(chave, t);
  }
  return [...ultima.values()].filter((t) => !t.acertou);
}

export interface Insight {
  id: string;
  texto: string;
  /** Magnitude do desvio — usada só para ordenar. */
  peso: number;
}

export function insights(
  ts: Tentativa[],
  materias: Materia[],
  hoje = diaLocal(new Date()),
): Insight[] {
  const achados: Insight[] = [];
  const nome = (id?: number) => materias.find((m) => m.id === id)?.nome ?? 'Sem matéria';
  const daMateria = (id?: number) => ts.filter((t) => t.materiaId === id);

  // 1. Maior distância entre fácil e difícil, uma única matéria (a pior).
  let pior: Insight | null = null;
  for (const grupo of porMateria(ts)) {
    const niveis = porDificuldade(daMateria(grupo.materiaId));
    if (niveis.facil.total < AMOSTRA_MINIMA || niveis.dificil.total < AMOSTRA_MINIMA) continue;
    const gap = niveis.facil.pct - niveis.dificil.pct;
    if (gap > 0 && (!pior || gap > pior.peso)) {
      pior = {
        id: 'gap-dificuldade',
        peso: gap,
        texto: `Em ${nome(grupo.materiaId)} você acerta ${niveis.facil.pct}% no fácil e ${niveis.dificil.pct}% no difícil.`,
      };
    }
  }
  if (pior) achados.push(pior);

  // 2. Matérias paradas.
  for (const grupo of porMateria(ts)) {
    if (grupo.total < AMOSTRA_MINIMA) continue;
    const ultimo = daMateria(grupo.materiaId).reduce((max, t) => (t.dia > max ? t.dia : max), '');
    const parada = diffDias(ultimo, hoje);
    if (parada >= 7) {
      achados.push({
        id: `parada-${grupo.materiaId ?? 'sem'}`,
        peso: parada,
        texto: `${nome(grupo.materiaId)} está parada há ${parada} dias.`,
      });
    }
  }

  // 3. Esta semana contra a anterior.
  const estaSemana = ts.filter((t) => t.dia >= somarDias(hoje, -6));
  const anterior = ts.filter((t) => t.dia >= somarDias(hoje, -13) && t.dia <= somarDias(hoje, -7));
  if (estaSemana.length >= AMOSTRA_MINIMA && anterior.length >= AMOSTRA_MINIMA) {
    const delta = taxaAcerto(estaSemana).pct - taxaAcerto(anterior).pct;
    if (Math.abs(delta) >= 5) {
      achados.push({
        id: 'delta-semana',
        peso: Math.abs(delta),
        texto:
          delta > 0
            ? `Seu acerto subiu ${delta} pontos essa semana.`
            : `Seu acerto caiu ${Math.abs(delta)} pontos essa semana.`,
      });
    }
  }

  // 4. Fila de revisão acumulando.
  const pendentes = errosParaRevisar(ts, 30, hoje).length;
  if (pendentes >= 5) {
    achados.push({
      id: 'erros-pendentes',
      peso: pendentes,
      texto: `${pendentes} ${pendentes === 1 ? 'questão errada' : 'questões erradas'} esperando revisão.`,
    });
  }

  return achados.sort((a, b) => b.peso - a.peso).slice(0, 3);
}
