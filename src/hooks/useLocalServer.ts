/* Hook de gestion du serveur local embarqué (Capacitor APK uniquement)
   En mode web normal ce hook est un no-op complet */
import { useEffect, useState, useCallback, useRef } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import type { DisplayMessage } from '@/types/bible';

const HTTP_PORT = 8090;
const WS_PORT = 8091;
const IP_CACHE_KEY = 'biblecast:local-ip';

interface LocalServerPlugin {
  startServer(options: { httpPort: number; wsPort: number }): Promise<{ success: boolean }>;
  stopServer(): Promise<void>;
  getLocalIP(): Promise<{ ip: string }>;
  sendWsMessage(options: { message: string }): Promise<void>;
  addListener(
    event: 'wsMessage',
    listener: (data: { message: string }) => void
  ): Promise<{ remove: () => void }>;
}

const LocalServerPlugin = registerPlugin<LocalServerPlugin>('LocalServer');

function getCachedIP(): string | null {
  try { return localStorage.getItem(IP_CACHE_KEY); } catch { return null; }
}

function cacheIP(ip: string) {
  try { localStorage.setItem(IP_CACHE_KEY, ip); } catch { }
}

export interface LocalServerState {
  isNative: boolean;
  isServerRunning: boolean;
  localIP: string | null;
  httpUrl: string | null;
  wsUrl: string | null;
  sendToWs: (msg: DisplayMessage) => void;
}

export function useLocalServer(): LocalServerState {
  const isNative = Capacitor.isNativePlatform();
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [localIP, setLocalIP] = useState<string | null>(() => getCachedIP());
  const listenerRef = useRef<{ remove: () => void } | null>(null);

  const sendToWs = useCallback((msg: DisplayMessage) => {
    if (!isNative) return;
    try {
      LocalServerPlugin.sendWsMessage({ message: JSON.stringify(msg) }).catch(() => {});
    } catch { }
  }, [isNative]);

  useEffect(() => {
    if (!isNative) return;

    let cancelled = false;

    (async () => {
      try {
        await LocalServerPlugin.startServer({ httpPort: HTTP_PORT, wsPort: WS_PORT });
        const result = await LocalServerPlugin.getLocalIP();
        if (!cancelled) {
          const ip = result.ip || null;
          if (ip) {
            cacheIP(ip);
            setLocalIP(ip);
          }
          setIsServerRunning(true);
        }
      } catch (err) {
        console.warn('[LocalServer] démarrage échoué:', err);
        if (!cancelled) {
          const cached = getCachedIP();
          if (cached) {
            setLocalIP(cached);
            setIsServerRunning(true);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
      listenerRef.current?.remove();
      listenerRef.current = null;
      LocalServerPlugin.stopServer().catch(() => {});
      setIsServerRunning(false);
    };
  }, [isNative]);

  const httpUrl = localIP ? `http://${localIP}:${HTTP_PORT}` : null;
  const wsUrl = localIP ? `ws://${localIP}:${WS_PORT}` : null;

  return { isNative, isServerRunning, localIP, httpUrl, wsUrl, sendToWs };
}
