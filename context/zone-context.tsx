'use client';

import React, { createContext, useEffect, useState, useCallback } from 'react';
import { apiCall } from '@/lib/api';
import type { Zone } from '@/models/zone';

export type ZoneRelay = { id: string; status: string };

export type ZoneContextType = {
  zones: Zone[];
  zonesLoading: boolean;
  setZones: React.Dispatch<React.SetStateAction<Zone[]>>;
  refetchZones: () => Promise<void>;
  /** Latest relay device per zoneId */
  relayByZone: Record<string, ZoneRelay>;
  /** Latest soil moisture (%) per zoneId — from DB on mount, updated by live MQTT */
  soilByZone: Record<string, number | null>;
  updateRelayStatus: (zoneId: string, status: string) => void;
  updateSoilMoisture: (zoneId: string, value: number | null) => void;
};

export const ZoneContext = createContext<ZoneContextType | null>(null);

export function ZoneProvider({ children }: { children: React.ReactNode }) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [relayByZone, setRelayByZone] = useState<Record<string, ZoneRelay>>({});
  const [soilByZone, setSoilByZone] = useState<Record<string, number | null>>({});

  // Fetch relay devices + latest soil reading for every zone.
  // Called once after initial zone load and again on explicit refetchZones().
  const fetchZoneStats = useCallback(async (zoneList: Zone[]) => {
    if (zoneList.length === 0) return;
    const [relayDevices, soilResults] = await Promise.all([
      // Sync relay status from Adafruit IO on every load so the UI always
      // reflects the physical pump state rather than a stale DB value.
      apiCall<{ id: string; zoneId: string | null; status: string }[]>('/api/devices/relay/sync')
        .catch(() =>
          // Fall back to plain DB read if sync fails (e.g. missing Adafruit creds)
          apiCall<{ id: string; zoneId: string | null; status: string }[]>('/api/devices?deviceType=RELAY_MODULE')
            .catch(() => [] as { id: string; zoneId: string | null; status: string }[])
        ),
      Promise.all(
        zoneList.map(z =>
          apiCall<{ soilMoisture: number | null }[]>(
            `/api/sensor-readings?zoneId=${encodeURIComponent(z.id)}&take=1`
          )
            .then(r => ({ zoneId: z.id, soilMoisture: r[0]?.soilMoisture ?? null }))
            .catch(() => ({ zoneId: z.id, soilMoisture: null }))
        )
      ),
    ]);

    const relayMap: Record<string, ZoneRelay> = {};
    relayDevices.forEach(d => { if (d.zoneId) relayMap[d.zoneId] = { id: d.id, status: d.status }; });
    setRelayByZone(relayMap);

    const soilMap: Record<string, number | null> = {};
    soilResults.forEach(r => { soilMap[r.zoneId] = r.soilMoisture; });
    setSoilByZone(soilMap);
  }, []);

  const refetchZones = useCallback(async () => {
    try {
      const data = await apiCall<Zone[]>('/api/zones');
      setZones(data);
      await fetchZoneStats(data);
    } catch {
      // silently keep current state on refetch errors
    }
  }, [fetchZoneStats]);

  useEffect(() => {
    apiCall<Zone[]>('/api/zones')
      .then(data => { setZones(data); fetchZoneStats(data); })
      .catch(() => {})
      .finally(() => setZonesLoading(false));
  }, [fetchZoneStats]);

  const updateRelayStatus = useCallback((zoneId: string, status: string) => {
    setRelayByZone(prev => {
      const relay = prev[zoneId];
      if (!relay) return prev;
      return { ...prev, [zoneId]: { ...relay, status } };
    });
  }, []);

  const updateSoilMoisture = useCallback((zoneId: string, value: number | null) => {
    setSoilByZone(prev => ({ ...prev, [zoneId]: value }));
  }, []);

  return (
    <ZoneContext.Provider value={{
      zones, zonesLoading, setZones, refetchZones,
      relayByZone, soilByZone, updateRelayStatus, updateSoilMoisture,
    }}>
      {children}
    </ZoneContext.Provider>
  );
}
