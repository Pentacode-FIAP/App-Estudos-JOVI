import type { ExercicioItem } from '../types';
import { ROTULO_DIFICULDADE } from '../lib/dificuldade';

/** Rótulo de cada alternativa. Compartilhado com a prévia, para as letras baterem. */
export const LETRAS = ['A', 'B', 'C', 'D'];

type QuestaoCardProps = {
  item: ExercicioItem;
  numero: number;
  total: number;
  escolha?: number;
  /** Modo prova passa `false` sempre: sem feedback até finalizar. */
  revelado: boolean;
  onEscolher: (indice: number) => void;
};

export function QuestaoCard({ item, numero, total, escolha, revelado, onEscolher }: QuestaoCardProps) {
  const alternativas = item.alternativas ?? [];

  return (
    <article className="questao-card">
      <header className="questao-topo">
        <span className="meta meta-num">
          {numero} de {total}
        </span>
        <span className={`pill pill-${item.dificuldade}`}>{ROTULO_DIFICULDADE[item.dificuldade]}</span>
      </header>

      <p className="questao-enunciado">{item.pergunta}</p>

      <div className="questao-alternativas" role="radiogroup" aria-label={`Alternativas da questão ${numero}`}>
        {alternativas.map((texto, i) => {
          const estado = !revelado
            ? undefined
            : i === item.correta
              ? 'certa'
              : i === escolha
                ? 'errada'
                : undefined;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={escolha === i}
              className="alternativa"
              data-estado={estado}
              data-escolhida={escolha === i}
              disabled={revelado}
              onClick={() => onEscolher(i)}
            >
              <span className="alternativa-letra">{LETRAS[i]}</span>
              <span className="alternativa-texto">{texto}</span>
            </button>
          );
        })}
      </div>

      {revelado && item.correta !== undefined && (
        <p className="questao-justificativa" data-acertou={escolha === item.correta}>
          {escolha === item.correta ? 'Certa. ' : `A correta era a ${LETRAS[item.correta]}. `}
          {item.resposta}
        </p>
      )}
    </article>
  );
}
