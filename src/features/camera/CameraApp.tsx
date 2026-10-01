import { useState } from 'react';
import { type Tab } from '../../components/BottomNav';
import { OnboardingScreen } from './OnboardingScreen';
import { CameraScreen } from './CameraScreen';
import { ConfigScreen } from './ConfigScreen';

const CHAVE_ONBOARDING = 'jovi_onboarding_visto';
type Tela = 'onboarding' | 'camera' | 'config';

export function CameraApp({ onAbrirEstudos }: { onAbrirEstudos: (aba: Tab) => void }) {
  const [tela, setTela] = useState<Tela>(() =>
    localStorage.getItem(CHAVE_ONBOARDING) ? 'camera' : 'onboarding',
  );

  function concluirOnboarding() {
    localStorage.setItem(CHAVE_ONBOARDING, '1');
    setTela('camera');
  }

  if (tela === 'onboarding') {
    return <OnboardingScreen onConcluir={concluirOnboarding} />;
  }
  if (tela === 'config') {
    return <ConfigScreen onVoltar={() => setTela('camera')} />;
  }
  return <CameraScreen onAbrirConfig={() => setTela('config')} onAbrirEstudos={onAbrirEstudos} />;
}
