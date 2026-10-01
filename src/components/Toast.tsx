import { useEffect } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function Toast({
  message,
  tipo = 'erro',
  onClose,
}: {
  message: string;
  tipo?: 'erro' | 'sucesso';
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    // `status` + aria-live anunciam sem roubar o foco de onde o usuário está.
    <div className={`toast toast-${tipo}`} role="status" aria-live="polite">
      {tipo === 'sucesso' ? (
        <CheckCircle2 size={17} strokeWidth={2} />
      ) : (
        <AlertCircle size={17} strokeWidth={2} />
      )}
      <span>{message}</span>
    </div>
  );
}
