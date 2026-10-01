import type { CSSProperties } from 'react';

type BarrasSemanaProps = {
  dados: { dia: string; total: number }[];
  meta: number;
};

const INICIAIS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function BarrasSemana({ dados, meta }: BarrasSemanaProps) {
  // A meta entra no máximo para a linha pontilhada nunca sair do gráfico; o 1
  // evita divisão por zero num período sem nenhuma questão.
  const maximo = Math.max(meta, ...dados.map((d) => d.total), 1);
  const rotulo = `Questões por dia. ${dados.map((d) => `${d.dia}: ${d.total}`).join('. ')}.`;

  return (
    <div
      className="barras-semana"
      role="img"
      aria-label={rotulo}
      style={{ '--meta-pct': String((meta / maximo) * 100) } as CSSProperties}
    >
      <div className="barras-semana-meta" aria-hidden="true" />
      {dados.map((d) => {
        const [ano, mes, dia] = d.dia.split('-').map(Number);
        return (
          <div key={d.dia} className="barra-col">
            <div className="barra-trilho">
              <div
                className="barra-fill"
                data-bateu={d.total >= meta}
                style={{ height: `${(d.total / maximo) * 100}%` }}
              />
            </div>
            <span className="barra-rotulo">{INICIAIS[new Date(ano, mes - 1, dia).getDay()]}</span>
          </div>
        );
      })}
    </div>
  );
}
