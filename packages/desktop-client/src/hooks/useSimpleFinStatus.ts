import { useEffect, useState } from 'react';

import { send } from '@actual-app/core/platform/client/connection';

import { useSyncServerStatus } from './useSyncServerStatus';

type SimpleFinStatusResult = {
  configured: boolean;
  cloudflareBlocked?: boolean;
};

export function useSimpleFinStatus() {
  const [configuredSimpleFin, setConfiguredSimpleFin] = useState<
    boolean | null
  >(null);
  const [cloudflareBlocked, setCloudflareBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const status = useSyncServerStatus();

  useEffect(() => {
    async function fetch() {
      setIsLoading(true);

      const results = await send('simplefin-status');

      setConfiguredSimpleFin(results.configured || false);
      setCloudflareBlocked(!!results.cloudflareBlocked);
      setIsLoading(false);
    }

    if (status === 'online') {
      void fetch();
    }
  }, [status]);

  return {
    configuredSimpleFin,
    cloudflareBlocked,
    isLoading,
  };
}
