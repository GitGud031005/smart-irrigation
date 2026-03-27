import { useContext } from 'react';
import { ZoneContext } from '@/context/zone-context';
import type { ZoneContextType } from '@/context/zone-context';

export function useZones(): ZoneContextType {
  const ctx = useContext(ZoneContext);
  if (!ctx) throw new Error('useZones must be used within a ZoneProvider');
  return ctx;
}
