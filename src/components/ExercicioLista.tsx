import { ChevronDown } from 'lucide-react';
import type { ExercicioItem } from '../types';
import { ROTULO_DIFICULDADE } from '../lib/dificuldade';

/**
 * Lista "aberta" (pergunta + resposta em `<details>`), sem alternativas.
 * Serve **só** a itens legados — gerados antes da v2, sem `alternativas` — que
 * não entram na `SerieExercicios` nem produzem `Tentativa`. O caminho
 * principal de exercícios hoje é `QuestaoCard`, dentro de `SerieExercicios`.
 */
export function ExercicioLista({ itens }: { itens: ExercicioItem[] }) {
  return (
    <ol className="lista-exercicios stagger">
      {itens.map((item, i) => (
        <li key={i}>
          <div className="exercicio-linha">
            <span className="exercicio-numero">{i + 1}</span>
            <span className="exercicio-pergunta">{item.pergunta}</span>
            <span className={`pill pill-${item.dificuldade}`}>
              {ROTULO_DIFICULDADE[item.dificuldade]}
            </span>
          </div>
          <details className="exercicio-resposta">
            <summary>
              Ver resposta
              <ChevronDown size={14} strokeWidth={2.5} />
            </summary>
            <p>{item.resposta}</p>
          </details>
        </li>
      ))}
    </ol>
  );
}
