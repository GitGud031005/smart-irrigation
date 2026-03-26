'use client';

import React, { createContext, useEffect, useState, useCallback } from 'react';
import { apiCall } from '@/lib/api';
import type { Zone } from '@/models/zone';

export type ZoneContextType = {
  zones: Zone[];
  zonesLoading: boolean;
  setZones: React.Dispatch<React.SetStateAction<Zone[]>>;
  refetchZones: () => Promise<void>;
};

export const ZoneContext = createContext<ZoneContextType | null>(null);

export function ZoneProvider({ children }: { children: React.ReactNode }) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);

  const refetchZones = useCallback(async () => {
    try {
      const data = await apiCall<Zone[]>('/api/zones');
      setZones(data);
    } catch {
      // silently keep current state on refetch errors
    }
  }, []);

  useEffect(() => {
    apiCall<Zone[]>('/api/zones')
      .then(setZones)
      .catch(() => {})
      .finally(() => setZonesLoading(false));
  }, []);

  return (
    <ZoneContext.Provider value={{ zones, zonesLoading, setZones, refetchZones }}>
      {children}
    </ZoneContext.Provider>
  );
}
