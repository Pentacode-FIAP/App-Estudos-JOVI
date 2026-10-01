import type { Dificuldade } from '../types';

/**
 * Rótulos em pt-BR de cada nível de dificuldade — fonte única usada em todo
 * lugar que exibe dificuldade, pra uma mudança de texto não precisar ser
 * repetida em cinco arquivos diferentes.
 */
export const ROTULO_DIFICULDADE: Record<Dificuldade, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
};

/** Ordem canônica de exibição dos níveis. */
export const NIVEIS_DIFICULDADE: Dificuldade[] = ['facil', 'medio', 'dificil'];
