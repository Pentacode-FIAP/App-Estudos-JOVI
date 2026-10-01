import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  Icone: LucideIcon;
  titulo: string;
  descricao: string;
  acao?: { rotulo: string; onClick: () => void };
};

export function EmptyState({ Icone, titulo, descricao, acao }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-icone" aria-hidden="true">
        <Icone size={22} strokeWidth={1.75} />
      </span>
      <strong>{titulo}</strong>
      <p>{descricao}</p>
      {acao && (
        <button type="button" className="btn-primary" onClick={acao.onClick}>
          {acao.rotulo}
        </button>
      )}
    </div>
  );
}
