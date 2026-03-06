/* Hook pour la communication entre onglets via BroadcastChannel
   + relais optionnel vers PeerJS (cross-device) */
import { useEffect, useRef, useCallback } from 'react';
import type { DisplayMessage } from '@/types/bible';

const CHANNEL_NAME = 'biblecast-display';
const STORAGE_KEY = 'biblecast:last-display';
const THEME_KEY = 'biblecast:theme';

export function useBroadcastSender(peerSend?: (msg: DisplayMessage) => void) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const peerSendRef = useRef(peerSend);
  peerSendRef.current = peerSend;

  useEffect(() => {
    channelRef.current = new BroadcastChannel(CHANNEL_NAME);
    return () => channelRef.current?.close();
  }, []);

  const send = useCallback((message: DisplayMessage) => {
    channelRef.current?.postMessage(message);
    peerSendRef.current?.(message);
    try {
      if (message.type === 'show-verse' || message.type === 'show-slide' || message.type === 'clear') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(message));
      }
      if (message.type === 'theme-change' && message.theme) {
        localStorage.setItem(THEME_KEY, JSON.stringify(message.theme));
      }
    } catch { }
  }, []);

  return send;
}

export function useBroadcastReceiver(onMessage: (msg: DisplayMessage) => void) {
  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => onMessage(event.data);
    return () => channel.close();
  }, [onMessage]);
}

export function getLastDisplay(): DisplayMessage | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DisplayMessage) : null;
  } catch {
    return null;
  }
}

export function getLastTheme(): DisplayMessage['theme'] | null {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
