type BarraProgressoProps = {
  rotulo: string;
  pct: number;
  /** Linha secundária, ex.: "42 questões". */
  detalhe: string;
  cor?: string;
};

export function BarraProgresso({ rotulo, pct, detalhe, cor = 'var(--accent)' }: BarraProgressoProps) {
  const seguro = Math.max(0, Math.min(100, pct));

  return (
    <div className="barra-prog" role="img" aria-label={`${rotulo}: ${Math.round(seguro)}% de acerto em ${detalhe}`}>
      <div className="barra-prog-topo">
        <span className="barra-prog-nome">{rotulo}</span>
        <span className="meta meta-num">
          {Math.round(seguro)}% · {detalhe}
        </span>
      </div>
      <div className="barra-prog-trilho">
        <div className="barra-prog-fill" style={{ width: `${seguro}%`, background: cor }} />
      </div>
    </div>
  );
}
