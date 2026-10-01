type DonutProps = {
  pct: number;
  /** Texto completo para leitor de tela, ex.: "78% de acerto em 142 questões". */
  rotulo: string;
  cor?: string;
  tamanho?: number;
};

const RAIO = 54;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

export function Donut({ pct, rotulo, cor = 'var(--accent)', tamanho = 132 }: DonutProps) {
  const seguro = Math.max(0, Math.min(100, pct));
  const preenchido = (seguro / 100) * CIRCUNFERENCIA;

  return (
    <svg
      className="donut"
      viewBox="0 0 128 128"
      width={tamanho}
      height={tamanho}
      role="img"
      aria-label={rotulo}
    >
      <circle cx="64" cy="64" r={RAIO} fill="none" stroke="var(--surface-3)" strokeWidth="11" />
      <circle
        className="donut-arco"
        cx="64"
        cy="64"
        r={RAIO}
        fill="none"
        stroke={cor}
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray={`${preenchido} ${CIRCUNFERENCIA}`}
        transform="rotate(-90 64 64)"
      />
      <text className="donut-valor" x="64" y="64" textAnchor="middle" dominantBaseline="central">
        {Math.round(seguro)}%
      </text>
    </svg>
  );
}
