import { useEffect, useState } from 'react';

/**
 * URL de objeto para um Blob, revogada ao desmontar ou trocar de blob.
 *
 * Chamar `URL.createObjectURL` direto no corpo do render cria uma URL nova a
 * cada renderização e nunca libera as anteriores: além do vazamento, o `src`
 * muda em toda re-renderização e a imagem pisca no meio das animações.
 */
export function useObjectUrl(blob: Blob | undefined | null): string | undefined {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!blob) {
      setUrl(undefined);
      return;
    }
    const criada = URL.createObjectURL(blob);
    setUrl(criada);
    return () => URL.revokeObjectURL(criada);
  }, [blob]);

  return url;
}
