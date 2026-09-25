import { useEffect, useState } from 'react';

/**
 * Creates an object URL for a Blob and revokes it on cleanup or when the
 * blob changes. Guards against `URL.createObjectURL` being unavailable
 * (e.g. jsdom in tests) by simply returning `undefined` instead of
 * throwing.
 */
export function useObjectUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!blob || typeof URL.createObjectURL !== 'function') {
      setUrl(undefined);
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  return url;
}
