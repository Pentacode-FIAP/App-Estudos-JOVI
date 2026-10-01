type SkeletonProps = { largura?: string; altura?: number; raio?: number };

export function Skeleton({ largura = '100%', altura = 12, raio }: SkeletonProps) {
  return (
    <span
      className="skeleton"
      aria-hidden="true"
      style={{
        display: 'block',
        width: largura,
        height: altura,
        borderRadius: raio,
      }}
    />
  );
}

/**
 * Placeholder de um card durante geração por IA. `aria-busy` + texto oculto
 * fazem o leitor de tela anunciar o carregamento, já que as barras são
 * puramente decorativas.
 */
export function SkeletonCard({ linhas = 3, rotulo }: { linhas?: number; rotulo: string }) {
  return (
    <div className="skeleton-card" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{rotulo}</span>
      <Skeleton largura="45%" altura={14} />
      {Array.from({ length: linhas }, (_, i) => (
        <Skeleton key={i} largura={i === linhas - 1 ? '70%' : '100%'} altura={10} />
      ))}
    </div>
  );
}
