import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {GAME_PACKAGE, HISTORY_SAMPLES, MAIN_SERVER} from './config';
import {Launcher, DeviceInfo} from './native';
import {load, save} from './lib/storage';
import {queryServer, ServerStatus} from './lib/samp';
import {rnSocketFactory} from './lib/udpSocket';

export type Graphics = 'low' | 'medium' | 'high';
export interface Settings {
  nick: string;
  graphics: Graphics;
  fpsLimit: 30 | 60 | 90;
  hudScale: number;
}
export interface SavedServer {
  id: string;
  name: string;
  host: string;
  port: number;
}

const DEFAULT_SETTINGS: Settings = {nick: '', graphics: 'medium', fpsLimit: 60, hudScale: 1};
export const mainServer: SavedServer = {id: 'main', ...MAIN_SERVER};

// Nume valid SA-MP: 3–20 caractere
export const validNick = (n: string) => /^[A-Za-z0-9_\[\]$=@().]{3,20}$/.test(n);

interface Ctx {
  ready: boolean;
  settings: Settings;
  setSettings: (p: Partial<Settings>) => void;
  servers: SavedServer[]; // include serverul principal
  addServer: (s: Omit<SavedServer, 'id'>) => void;
  removeServer: (id: string) => void;
  history: Record<string, number[]>;
  pushHistory: (id: string, online: number) => void;
  device: DeviceInfo | null;
  clientInstalled: boolean;
  refreshClient: () => void;
}

const StoreCtx = createContext<Ctx>(null as unknown as Ctx);
export const useStore = () => useContext(StoreCtx);

export const StoreProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [ready, setReady] = useState(false);
  const [settings, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [custom, setCustom] = useState<SavedServer[]>([]);
  const [history, setHistory] = useState<Record<string, number[]>>({});
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [clientInstalled, setInstalled] = useState(false);

  const refreshClient = useCallback(() => {
    Launcher.isInstalled(GAME_PACKAGE).then(setInstalled).catch(() => setInstalled(false));
  }, []);

  useEffect(() => {
    (async () => {
      setS({...DEFAULT_SETTINGS, ...(await load('settings', {}))});
      setCustom(await load('servers', []));
      setHistory(await load('history', {}));
      Launcher.getDeviceInfo().then(setDevice).catch(() => {});
      refreshClient();
      setReady(true);
    })();
  }, [refreshClient]);

  const setSettings = useCallback((p: Partial<Settings>) => {
    setS(prev => {
      const next = {...prev, ...p};
      save('settings', next);
      return next;
    });
  }, []);

  const addServer = useCallback((s: Omit<SavedServer, 'id'>) => {
    setCustom(prev => {
      const next = [...prev, {...s, id: `${s.host}:${s.port}`}].filter(
        (v, i, a) => a.findIndex(x => x.id === v.id) === i,
      );
      save('servers', next);
      return next;
    });
  }, []);

  const removeServer = useCallback((id: string) => {
    setCustom(prev => {
      const next = prev.filter(s => s.id !== id);
      save('servers', next);
      return next;
    });
  }, []);

  const pushHistory = useCallback((id: string, online: number) => {
    setHistory(prev => {
      const arr = [...(prev[id] ?? []), online].slice(-HISTORY_SAMPLES);
      const next = {...prev, [id]: arr};
      save('history', next);
      return next;
    });
  }, []);

  const servers = useMemo(() => [mainServer, ...custom], [custom]);
  const value = useMemo(
    () => ({ready, settings, setSettings, servers, addServer, removeServer, history, pushHistory, device, clientInstalled, refreshClient}),
    [ready, settings, setSettings, servers, addServer, removeServer, history, pushHistory, device, clientInstalled, refreshClient],
  );
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
};

/** Interoghează periodic un server; salvează online-ul în istoric. */
export function useServerStatus(s: SavedServer, opts: {players?: boolean; everyMs?: number} = {}) {
  const {pushHistory} = useStore();
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const st = await queryServer(rnSocketFactory, s.host, s.port, {withPlayers: opts.players});
      if (!alive.current) return;
      setStatus(st);
      setError(null);
      pushHistory(s.id, st.info.players);
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [s.host, s.port, s.id, opts.players, pushHistory]);

  useEffect(() => {
    alive.current = true;
    refresh();
    const t = setInterval(refresh, opts.everyMs ?? 30000);
    return () => {
      alive.current = false;
      clearInterval(t);
    };
  }, [refresh, opts.everyMs]);

  return {status, error, loading, refresh};
}
