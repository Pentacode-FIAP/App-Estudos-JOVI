import type { ReactNode } from 'react';

type ScreenHeaderProps = {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  subtitleBelow?: boolean;
};

export function ScreenHeader({ title, subtitle, actions, subtitleBelow = false }: ScreenHeaderProps) {
  return (
    <header className={`screen-header${subtitleBelow ? ' screen-header-subtitle-below' : ''}`}>
      <div className="screen-header-copy">
        <h1>{title}</h1>
        {!subtitleBelow && <p className="subtitulo">{subtitle}</p>}
      </div>
      {actions && <div className="screen-header-actions">{actions}</div>}
      {subtitleBelow && <p className="subtitulo">{subtitle}</p>}
    </header>
  );
}
