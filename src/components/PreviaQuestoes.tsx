import { ChevronDown } from 'lucide-react';
import { LETRAS } from './QuestaoCard';
import { ROTULO_DIFICULDADE } from '../lib/dificuldade';
import type { ExercicioItem } from '../types';

/**
 * O que a prévia pode ler de uma questão. `correta` e `resposta` ficam FORA de
 * propósito: espiar as questões antes de responder não pode entregar o
 * gabarito, e o tipo é o que garante isso — não a revisão de quem edita.
 */
export type ItemPrevia = Pick<ExercicioItem, 'pergunta' | 'dificuldade' | 'alternativas'>;

/**
 * Lista das questões de um exercício, recolhidas. Abrir uma mostra as
 * alternativas, nunca qual delas é a certa. Para responder de verdade é a
 * `SerieExercicios`.
 */
export function PreviaQuestoes({ itens }: { itens: ItemPrevia[] }) {
  return (
    <>
      <h3 className="secao-titulo">Questões</h3>
      <ol className="previa-lista">
        {itens.map((item, i) => (
          <li key={i}>
            <details className="questao-previa">
              <summary>
                <span className="previa-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="previa-pergunta">{item.pergunta}</span>
                <span className="previa-meta">
                  <span className={`pill pill-${item.dificuldade}`}>
                    {ROTULO_DIFICULDADE[item.dificuldade]}
                  </span>
                  <ChevronDown size={15} strokeWidth={2.5} aria-hidden="true" />
                </span>
              </summary>
              <ul className="previa-alternativas">
                {(item.alternativas ?? []).map((texto, j) => (
                  <li key={j} className="alternativa">
                    <span className="alternativa-letra">{LETRAS[j]}</span>
                    <span className="alternativa-texto">{texto}</span>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ol>
    </>
  );
}
