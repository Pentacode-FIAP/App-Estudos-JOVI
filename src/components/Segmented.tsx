import type { CSSProperties } from 'react';

type SegmentedProps<T extends string> = {
  itens: { id: T; label: string }[];
  valor: T;
  onChange: (id: T) => void;
  rotulo: string;
  /** `tabs` alterna seções da tela; `radio` escolhe um valor de formulário. */
  modo?: 'tabs' | 'radio';
};

/**
 * Controle segmentado com polegar deslizante. O CSS posiciona o polegar por
 * `--i` (índice ativo) e `--n` (total), então a animação é só uma transição
 * de `transform` — sem medir nada em JS.
 */
export function Segmented<T extends string>({
  itens,
  valor,
  onChange,
  rotulo,
  modo = 'tabs',
}: SegmentedProps<T>) {
  const indice = Math.max(0, itens.findIndex((item) => item.id === valor));
  const ehTabs = modo === 'tabs';

  return (
    <div
      className="segmented"
      role={ehTabs ? 'tablist' : 'radiogroup'}
      aria-label={rotulo}
      style={{ '--i': String(indice), '--n': String(itens.length) } as CSSProperties}
    >
      {itens.map((item) => (
        <button
          key={item.id}
          type="button"
          role={ehTabs ? 'tab' : 'radio'}
          aria-selected={ehTabs ? item.id === valor : undefined}
          aria-checked={ehTabs ? undefined : item.id === valor}
          data-ativo={item.id === valor}
          className="segmented-item"
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
