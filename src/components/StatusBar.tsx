import { BatteryMedium, Signal, Wifi } from 'lucide-react';

/**
 * Barra de status falsa da moldura.
 *
 * Além do acabamento, ela reserva a faixa ocupada pelo notch: sem isso o
 * título e o botão de ação da tela ficavam por baixo do recorte. O horário
 * fixo espelha o da área de Câmera, para os dois lados do app não mostrarem
 * relógios diferentes numa troca de tela.
 */
const HORARIO = '9:41';

export function StatusBar() {
  return (
    <div className="status-bar" aria-hidden="true">
      <span className="status-hora">{HORARIO}</span>
      <span className="status-icones">
        <Signal size={13} strokeWidth={2.4} />
        <Wifi size={13} strokeWidth={2.4} />
        <BatteryMedium size={16} strokeWidth={2} />
      </span>
    </div>
  );
}
