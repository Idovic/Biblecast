import { useEffect, useRef, useState, useCallback } from 'react';
import type { DisplayMessage } from '@/types/bible';

declare global {
  interface Window {
    cast?: any;
    chrome?: any;
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
  }
}

const APP_ID = 'A358A0B7';
const CAST_NAMESPACE = 'urn:x-cast:app.biblecast';

export type CastState = 'checking' | 'unavailable' | 'available' | 'connecting' | 'connected';

export interface CastSenderState {
  castState: CastState;
  castSend: (msg: DisplayMessage) => void;
  requestCast: () => void;
  endCast: () => void;
}

export function useCastSender(): CastSenderState {
  const [castState, setCastState] = useState<CastState>('checking');
  const sessionRef = useRef<any>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const fallback = setTimeout(() => {
      setCastState((s) => s === 'checking' ? 'unavailable' : s);
    }, 3500);

    window.__onGCastApiAvailable = (isAvailable: boolean) => {
      clearTimeout(fallback);
      if (!isAvailable || initializedRef.current) {
        if (!isAvailable) setCastState('unavailable');
        return;
      }
      initializedRef.current = true;
      try {
        const ctx = window.cast.framework.CastContext.getInstance();
        ctx.setOptions({
          receiverApplicationId: APP_ID,
          autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });
        ctx.addEventListener(
          window.cast.framework.CastContextEventType.CAST_STATE_CHANGED,
          (e: any) => {
            const map: Record<string, CastState> = {
              NO_DEVICES_AVAILABLE: 'unavailable',
              NOT_CONNECTED: 'available',
              CONNECTING: 'connecting',
              CONNECTED: 'connected',
            };
            const next = map[e.castState] ?? 'available';
            setCastState(next);
            if (next === 'connected') {
              sessionRef.current = ctx.getCurrentSession();
            } else if (next !== 'connecting') {
              sessionRef.current = null;
            }
          }
        );
        setCastState('available');
      } catch {
        setCastState('unavailable');
      }
    };

    return () => clearTimeout(fallback);
  }, []);

  const castSend = useCallback((msg: DisplayMessage) => {
    const session = sessionRef.current;
    if (!session) return;
    try {
      session.sendMessage(CAST_NAMESPACE, msg);
    } catch { }
  }, []);

  const requestCast = useCallback(() => {
    try {
      window.cast?.framework?.CastContext.getInstance().requestSession();
    } catch { }
  }, []);

  const endCast = useCallback(() => {
    try {
      window.cast?.framework?.CastContext.getInstance().endCurrentSession(true);
    } catch { }
  }, []);

  return { castState, castSend, requestCast, endCast };
}
