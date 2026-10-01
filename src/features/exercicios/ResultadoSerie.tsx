import { RotateCcw } from 'lucide-react';
import { Donut } from '../../components/charts/Donut';
import { porDificuldade, taxaAcerto } from '../../lib/progresso';
import { NIVEIS_DIFICULDADE as NIVEIS, ROTULO_DIFICULDADE as ROTULO } from '../../lib/dificuldade';
import type { Tentativa } from '../../types';

export function ResultadoSerie({
  tentativas,
  onRefazer,
}: {
  tentativas: Tentativa[];
  onRefazer?: () => void;
}) {
  const { acertos, total, pct } = taxaAcerto(tentativas);
  const niveis = porDificuldade(tentativas);

  return (
    <div className="resultado-serie">
      <Donut pct={pct} rotulo={`${pct}% de acerto em ${total} questões`} />
      <p className="resultado-placar">
        <strong>{acertos}</strong> de {total}
      </p>

      <ul className="resultado-niveis">
        {NIVEIS.filter((n) => niveis[n].total > 0).map((n) => (
          <li key={n}>
            <span className={`pill pill-${n}`}>{ROTULO[n]}</span>
            <span className="meta meta-num">
              {niveis[n].acertos}/{niveis[n].total}
            </span>
          </li>
        ))}
      </ul>

      {onRefazer && (
        <button className="btn-ghost btn-block" onClick={onRefazer}>
          <RotateCcw size={16} strokeWidth={2} />
          Gerar novas questões
        </button>
      )}
    </div>
  );
}
