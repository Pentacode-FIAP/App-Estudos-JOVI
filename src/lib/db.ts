import Dexie, { type Table } from 'dexie';
import type {
  Materia, Evento, Foto, Resumo, Exercicio, Anotacao, ChatMessage,
  Tentativa, Simulado, Config,
} from '../types';

export class AppDB extends Dexie {
  materias!: Table<Materia, number>;
  eventos!: Table<Evento, number>;
  fotos!: Table<Foto, number>;
  resumos!: Table<Resumo, number>;
  exercicios!: Table<Exercicio, number>;
  anotacoes!: Table<Anotacao, number>;
  chatMessages!: Table<ChatMessage, number>;
  tentativas!: Table<Tentativa, number>;
  simulados!: Table<Simulado, number>;
  config!: Table<Config, string>;

  constructor() {
    super('app-estudos');
    this.version(1).stores({
      materias: '++id, nome',
      eventos: '++id, data, materiaId',
      fotos: '++id, dataUpload, materiaId',
      resumos: '++id, materiaId, criadoEm',
      exercicios: '++id, resumoId',
      anotacoes: '++id, materiaId, resumoId, data',
      chatMessages: '++id, criadoEm',
    });
    // v2 — sem `.upgrade()`: nenhum registro existente muda de forma, os campos
    // novos de ExercicioItem são opcionais.
    this.version(2).stores({
      materias: '++id, nome',
      eventos: '++id, data, materiaId',
      fotos: '++id, dataUpload, materiaId',
      resumos: '++id, materiaId, criadoEm',
      exercicios: '++id, resumoId',
      anotacoes: '++id, materiaId, resumoId, data',
      chatMessages: '++id, criadoEm',
      tentativas: '++id, dia, materiaId, dificuldade, [origem+origemId]',
      simulados: '++id, materiaId, iniciadoEm',
      config: 'id',
    });
  }
}

export const db = new AppDB();

/** Meta padrão. Lida com fallback em vez de semeada, para não escrever no primeiro load. */
export const META_PADRAO = 10;
