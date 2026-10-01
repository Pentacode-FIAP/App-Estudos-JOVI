import { useState, type UIEvent } from 'react';
import { BottomNav, ORDEM_TABS, type Tab } from '../../components/BottomNav';
import { ShellContext } from '../../components/Shell';
import { StatusBar } from '../../components/StatusBar';
import { EstudarScreen } from '../estudar/EstudarScreen';
import { GaleriaScreen } from '../galeria/GaleriaScreen';
import { ChatScreen } from '../chat/ChatScreen';
import { ProgressoScreen } from '../progresso/ProgressoScreen';
import { CalendarioScreen } from '../calendario/CalendarioScreen';

const TELAS: Record<Tab, () => JSX.Element> = {
  progresso: ProgressoScreen,
  estudar: EstudarScreen,
  chat: ChatScreen,
  galeria: GaleriaScreen,
  calendario: CalendarioScreen,
};

export function EstudosApp({ abaInicial = 'progresso' }: { abaInicial?: Tab }) {
  const [aba, setAba] = useState<Tab>(abaInicial);
  const [direcao, setDirecao] = useState<'fwd' | 'back'>('fwd');
  const [rolado, setRolado] = useState(false);
  // Estado (e não ref) porque o alvo de portal precisa disparar uma
  // re-renderização assim que o elemento existe.
  const [shell, setShell] = useState<HTMLElement | null>(null);

  const Tela = TELAS[aba];

  function trocarAba(proxima: Tab) {
    // A direção da animação segue a posição na nav: avançar entra pela
    // direita, voltar entra pela esquerda.
    setDirecao(ORDEM_TABS.indexOf(proxima) >= ORDEM_TABS.indexOf(aba) ? 'fwd' : 'back');
    setRolado(false);
    setAba(proxima);
  }

  function aoRolar(evento: UIEvent<HTMLDivElement>) {
    const passou = evento.currentTarget.scrollTop > 4;
    setRolado((atual) => (atual === passou ? atual : passou));
  }

  return (
    <ShellContext.Provider value={shell}>
      <div className="app-shell" ref={setShell} data-scrolled={rolado}>
        <StatusBar />
        <div className="screen" data-tab={aba} onScroll={aoRolar}>
          {/* A key remonta a subárvore a cada troca de aba, o que reinicia as
              animações de entrada e de stagger das listas. */}
          <div key={aba} className="screen-anim" data-dir={direcao}>
            <Tela />
          </div>
        </div>
        <BottomNav ativa={aba} onChange={trocarAba} />
      </div>
    </ShellContext.Provider>
  );
}
