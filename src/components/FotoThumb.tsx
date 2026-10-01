import { useObjectUrl } from '../lib/useObjectUrl';

export function FotoThumb({ blob, alt = '' }: { blob: Blob; alt?: string }) {
  const url = useObjectUrl(blob);
  if (!url) return null;
  return <img src={url} alt={alt} loading="lazy" decoding="async" />;
}
