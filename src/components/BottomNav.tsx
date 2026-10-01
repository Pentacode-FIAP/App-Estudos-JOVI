import {
  BookOpen,
  Calendar,
  Images,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import type { CSSProperties } from 'react';

export type Tab = 'progresso' | 'estudar' | 'chat' | 'galeria' | 'calendario';

/**
 * Cinco destinos de topo — o limite recomendado para uma bottom nav.
 * Resumos e Exercícios viraram um só ("Estudar"), já que o exercício sempre
 * nasce de um resumo; Anotações saiu daqui e virou uma seção de Estudar. O
 * Chat fica no centro por ser o diferencial do app.
 */
const ITENS: { tab: Tab; label: string; Icon: LucideIcon }[] = [
  { tab: 'progresso', label: 'Progresso', Icon: TrendingUp },
  { tab: 'estudar', label: 'Estudar', Icon: BookOpen },
  { tab: 'chat', label: 'Chat IA', Icon: Sparkles },
  { tab: 'galeria', label: 'Galeria', Icon: Images },
  { tab: 'calendario', label: 'Calendário', Icon: Calendar },
];

export const ORDEM_TABS: Tab[] = ITENS.map((item) => item.tab);

export function BottomNav({ ativa, onChange }: { ativa: Tab; onChange: (t: Tab) => void }) {
  const indice = Math.max(0, ORDEM_TABS.indexOf(ativa));

  return (
    <nav className="bottom-nav" style={{ '--i': String(indice) } as CSSProperties}>
      {ITENS.map((item) => {
        const ativo = ativa === item.tab;
        return (
          <button
            key={item.tab}
            type="button"
            className={`nav-item ${ativo ? 'nav-item-ativa' : ''}`}
            aria-current={ativo ? 'page' : undefined}
            onClick={() => onChange(item.tab)}
          >
            <span className="nav-icon-wrap">
              <item.Icon size={20} strokeWidth={ativo ? 2.3 : 1.9} />
            </span>
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
