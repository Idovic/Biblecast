/* PeerJS WebRTC sync + WebSocket local — communication cross-device (TV, Android TV) */
import { useEffect, useRef, useState, useCallback } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import { Capacitor } from '@capacitor/core';
import type { DisplayMessage } from '@/types/bible';

const PROD_WEB_URL = 'https://idovic.github.io/Biblecast/';

const PEER_ID_PREFIX = 'biblecast-';
const ROOM_STORAGE_KEY = 'biblecast:peer-room';
const LAST_MSG_STORAGE_KEY = 'biblecast:last-display';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getOrCreateRoomCode(): string {
  try {
    const stored = localStorage.getItem(ROOM_STORAGE_KEY);
    if (stored && stored.length === 6) return stored;
  } catch { }
  const code = generateRoomCode();
  try { localStorage.setItem(ROOM_STORAGE_KEY, code); } catch { }
  return code;
}

export interface PeerHostState {
  roomCode: string;
  displayUrl: string;
  connectedCount: number;
  isReady: boolean;
  peerSend: (msg: DisplayMessage) => void;
}

async function detectLocalIP(): Promise<string> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(window.location.hostname), 3000);
    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pc.createDataChannel('');
      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        const match = e.candidate.candidate.match(/(\d{1,3}\.){3}\d{1,3}/);
        if (match && !match[0].startsWith('127.') && !match[0].startsWith('0.')) {
          clearTimeout(timeout);
          resolve(match[0]);
          pc.close();
        }
      };
      pc.createOffer().then(o => pc.setLocalDescription(o)).catch(() => resolve(window.location.hostname));
    } catch {
      clearTimeout(timeout);
      resolve(window.location.hostname);
    }
  });
}

export function usePeerHost(onGuestMessage?: (msg: DisplayMessage) => void): PeerHostState {
  const [roomCode] = useState<string>(getOrCreateRoomCode);
  const [connectedCount, setConnectedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const onGuestMessageRef = useRef(onGuestMessage);
  onGuestMessageRef.current = onGuestMessage;

  const peerSend = useCallback((msg: DisplayMessage) => {
    connectionsRef.current.forEach((conn) => {
      try {
        if (conn.open) conn.send(msg);
      } catch { }
    });
  }, []);

  useEffect(() => {
    const peerId = PEER_ID_PREFIX + roomCode;
    const peer = new Peer(peerId, {
      host: '0.peerjs.com',
      port: 443,
      path: '/',
      secure: true,
      debug: 0,
    });
    peerRef.current = peer;

    peer.on('open', () => setIsReady(true));
    peer.on('error', () => setIsReady(false));

    peer.on('connection', (conn: DataConnection) => {
      const connId = conn.peer;
      connectionsRef.current.set(connId, conn);
      setConnectedCount(connectionsRef.current.size);

      conn.on('open', () => {
        setConnectedCount(connectionsRef.current.size);
        try {
          const raw = localStorage.getItem(LAST_MSG_STORAGE_KEY);
          if (raw) conn.send(JSON.parse(raw));
        } catch { }
      });

      conn.on('data', (data: unknown) => {
        if (!data || typeof data !== 'object') return;
        const msg = data as DisplayMessage;
        if (msg.type === 'ping' as string) {
          try {
            const raw = localStorage.getItem(LAST_MSG_STORAGE_KEY);
            if (raw) conn.send(JSON.parse(raw));
          } catch { }
        } else if (onGuestMessageRef.current) {
          onGuestMessageRef.current(msg);
        }
      });

      conn.on('close', () => {
        connectionsRef.current.delete(connId);
        setConnectedCount(connectionsRef.current.size);
      });

      conn.on('error', () => {
        connectionsRef.current.delete(connId);
        setConnectedCount(connectionsRef.current.size);
      });
    });

    const heartbeat = setInterval(() => {
      connectionsRef.current.forEach((conn) => {
        if (conn.open) try { conn.send({ type: 'ping' }); } catch { }
      });
    }, 30_000);

    return () => {
      clearInterval(heartbeat);
      connectionsRef.current.forEach((c) => { try { c.close(); } catch { } });
      connectionsRef.current.clear();
      peer.destroy();
      peerRef.current = null;
      setIsReady(false);
      setConnectedCount(0);
    };
  }, [roomCode]);

  const displayUrl = Capacitor.isNativePlatform()
    ? `${PROD_WEB_URL}display?room=${roomCode}`
    : `${window.location.origin}${(import.meta.env.BASE_URL as string) ?? '/'}display?room=${roomCode}`;

  return { roomCode, displayUrl, connectedCount, isReady, peerSend };
}

export type PeerGuestStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface PeerGuestState {
  status: PeerGuestStatus;
  isConnected: boolean;
  sendToHost: (msg: DisplayMessage) => void;
  forceReconnect: () => void;
}

export function usePeerGuest(
  roomCode: string | null,
  onMessage: (msg: DisplayMessage) => void
): PeerGuestState {
  const [status, setStatus] = useState<PeerGuestStatus>('idle');
  const [retryKey, setRetryKey] = useState(0);
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const retryCountRef = useRef(0);

  const sendToHost = useCallback((msg: DisplayMessage) => {
    try {
      if (connRef.current?.open) connRef.current.send(msg);
    } catch { }
  }, []);

  useEffect(() => {
    if (!roomCode) return;

    setStatus('connecting');
    const guestId = PEER_ID_PREFIX + 'guest-' + Math.random().toString(36).slice(2, 8);
    const peer = new Peer(guestId, {
      host: '0.peerjs.com',
      port: 443,
      path: '/',
      secure: true,
      debug: 0,
    });
    peerRef.current = peer;

    const scheduleRetry = () => {
      const delay = Math.min(3000 * Math.pow(1.5, retryCountRef.current), 30000);
      retryCountRef.current++;
      setTimeout(() => setRetryKey(k => k + 1), delay);
    };

    peer.on('open', () => {
      const hostId = PEER_ID_PREFIX + roomCode;
      const conn = peer.connect(hostId, { reliable: true });
      connRef.current = conn;

      conn.on('open', () => {
        setStatus('connected');
        retryCountRef.current = 0;
        conn.send({ type: 'ping' });
      });

      conn.on('data', (data: unknown) => {
        if (data && typeof data === 'object' && 'type' in data) {
          if ((data as { type: string }).type === 'ping') return;
          onMessageRef.current(data as DisplayMessage);
        }
      });

      conn.on('close', () => { setStatus('error'); scheduleRetry(); });
      conn.on('error', () => { setStatus('error'); scheduleRetry(); });
    });

    peer.on('error', () => { setStatus('error'); scheduleRetry(); });

    return () => {
      try { connRef.current?.close(); } catch { }
      try { peer.destroy(); } catch { }
      peerRef.current = null;
      connRef.current = null;
      retryCountRef.current = 0;
      setStatus('idle');
    };
  }, [roomCode, retryKey]);

  const forceReconnect = useCallback(() => {
    retryCountRef.current = 0;
    setRetryKey(k => k + 1);
  }, []);

  return { status, isConnected: status === 'connected', sendToHost, forceReconnect };
}

/* ─────────────────────────────────────────────────────────────────────────
   WebSocket guest — utilisé par la page Display quand ?ws=ws://ip:port
   (mode hors-ligne, tablette sert comme hotspot + serveur local)
───────────────────────────────────────────────────────────────────────── */
export type LocalWsStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface LocalWsGuestState {
  status: LocalWsStatus;
  isConnected: boolean;
}

export function useLocalWsGuest(
  wsUrl: string | null,
  onMessage: (msg: DisplayMessage) => void
): LocalWsGuestState {
  const [status, setStatus] = useState<LocalWsStatus>('idle');
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!wsUrl) return;

    const connect = () => {
      setStatus('connecting');
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setStatus('connected');
          retryCountRef.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data as string) as DisplayMessage;
            if (msg && typeof msg === 'object' && 'type' in msg) {
              onMessageRef.current(msg);
            }
          } catch { }
        };

        ws.onclose = () => { setStatus('error'); scheduleRetry(); };
        ws.onerror = () => { setStatus('error'); };
      } catch {
        setStatus('error');
        scheduleRetry();
      }
    };

    const scheduleRetry = () => {
      const delay = Math.min(2000 * Math.pow(1.5, retryCountRef.current), 30000);
      retryCountRef.current++;
      retryTimerRef.current = setTimeout(connect, delay);
    };

    connect();

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      try { wsRef.current?.close(); } catch { }
      wsRef.current = null;
      retryCountRef.current = 0;
      setStatus('idle');
    };
  }, [wsUrl]);

  return { status, isConnected: status === 'connected' };
}
