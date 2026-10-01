import { useState } from 'react';
import { type Tab } from './components/BottomNav';
import { CameraApp } from './features/camera/CameraApp';
import { EstudosApp } from './features/estudos/EstudosApp';

type Area = 'camera' | 'estudos';

export default function App() {
  const [area, setArea] = useState<Area>('camera');
  const [abaEstudosInicial, setAbaEstudosInicial] = useState<Tab>('progresso');

  function abrirEstudos(aba: Tab) {
    setAbaEstudosInicial(aba);
    setArea('estudos');
  }

  return (
    <div className="phone-frame">
      <div className="phone-notch" />
      {area === 'camera' ? (
        <CameraApp onAbrirEstudos={abrirEstudos} />
      ) : (
        <EstudosApp abaInicial={abaEstudosInicial} />
      )}
    </div>
  );
}
