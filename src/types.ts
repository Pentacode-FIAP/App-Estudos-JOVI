export interface Materia {
  id?: number;
  nome: string;
  cor: string;
}

export interface Evento {
  id?: number;
  titulo: string;
  data: string; // ISO date, YYYY-MM-DD
  materiaId?: number;
  tipo: 'prova' | 'atividade' | 'revisao';
  resumoIds?: number[];
  revisadosIds?: number[];
  treinoConcluido?: boolean;
  simuladoId?: number;
}

export interface Foto {
  id?: number;
  blob: Blob;
  materiaId?: number;
  dataUpload: string; // ISO datetime
  ocrText?: string;
}

export interface Resumo {
  id?: number;
  titulo: string;
  materiaId?: number;
  conteudo: string;
  fotoIds: number[];
  criadoEm: string; // ISO datetime
}

export type Dificuldade = 'facil' | 'medio' | 'dificil';

export interface ExercicioItem {
  pergunta: string;
  dificuldade: Dificuldade;
  /** Justificativa da alternativa correta. Em itens legados, a resposta aberta. */
  resposta: string;
  /** Exatamente 4 opções. Ausente = item legado, gerado antes da v2. */
  alternativas?: string[];
  /** Índice 0..3 da correta. Presente sempre que `alternativas` estiver. */
  correta?: number;
}

export interface Exercicio {
  id?: number;
  resumoId: number;
  itens: ExercicioItem[];
  criadoEm: string; // ISO datetime
}

export interface Anotacao {
  id?: number;
  titulo: string;
  conteudo: string;
  materiaId?: number;
  resumoId?: number;
  data: string; // ISO datetime
}

export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  texto: string;
  criadoEm: string; // ISO datetime
}

export interface Tentativa {
  id?: number;
  origem: 'exercicio' | 'simulado';
  origemId: number;
  /** Índice do item dentro de `Exercicio.itens` ou `Simulado.itens`. */
  itemIndex: number;
  /** Desnormalizado de propósito: é um snapshot histórico, não um join. */
  materiaId?: number;
  dificuldade: Dificuldade;
  escolha: number;
  acertou: boolean;
  /** 'YYYY-MM-DD' no fuso local. Chave de todo recorte diário. */
  dia: string;
  respondidoEm: string; // ISO datetime
}

export interface Simulado {
  id?: number;
  materiaId: number;
  resumoIds: number[];
  itens: ExercicioItem[];
  qtd: number;
  nivel: Dificuldade | 'misto';
  /** Limite em minutos. Ausente = sem cronômetro. */
  minutos?: number;
  iniciadoEm: string;
  /** Ausente = simulado abandonado no meio. */
  finalizadoEm?: string;
}

export interface Config {
  id: 'app';
  /** Questões respondidas por dia que fecham a meta. */
  metaDiaria: number;
}
