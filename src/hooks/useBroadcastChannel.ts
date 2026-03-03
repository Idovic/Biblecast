/* Hook pour la communication entre onglets via BroadcastChannel */
import { useEffect, useRef, useCallback, useState } from 'react';
import type { DisplayMessage } from '@/types/bible';

const CHANNEL_NAME = 'biblecast-display';

export function useBroadcastSender() {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    channelRef.current = new BroadcastChannel(CHANNEL_NAME);
    return () => channelRef.current?.close();
  }, []);

  const send = useCallback((message: DisplayMessage) => {
    channelRef.current?.postMessage(message);
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

export function useDisplayTheme() {
  const [theme, setTheme] = useState<DisplayMessage['theme']>({
    name: 'Noir classique',
    className: 'theme-noir-classique',
    fontSize: 'large',
    fontFamily: 'serif',
    bgOpacity: 1,
  });

  return { theme, setTheme };
}
