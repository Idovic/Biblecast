/* PeerJS WebRTC sync — communication cross-device (TV, Android TV) */
import { useEffect, useRef, useState, useCallback } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import type { DisplayMessage } from '@/types/bible';

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

export function usePeerHost(): PeerHostState {
  const [roomCode] = useState<string>(getOrCreateRoomCode);
  const [connectedCount, setConnectedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [localIP, setLocalIP] = useState<string>(window.location.hostname);
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());

  useEffect(() => {
    detectLocalIP().then(ip => setLocalIP(ip));
  }, []);

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
        if (data && typeof data === 'object' && (data as any).type === 'ping') {
          try {
            const raw = localStorage.getItem(LAST_MSG_STORAGE_KEY);
            if (raw) conn.send(JSON.parse(raw));
          } catch { }
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

    return () => {
      connectionsRef.current.forEach((c) => { try { c.close(); } catch { } });
      connectionsRef.current.clear();
      peer.destroy();
      peerRef.current = null;
      setIsReady(false);
      setConnectedCount(0);
    };
  }, [roomCode]);

  const port = window.location.port ? `:${window.location.port}` : '';
  const displayUrl = `http://${localIP}${port}/display?room=${roomCode}`;

  return { roomCode, displayUrl, connectedCount, isReady, peerSend };
}

export type PeerGuestStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface PeerGuestState {
  status: PeerGuestStatus;
  isConnected: boolean;
}

export function usePeerGuest(
  roomCode: string | null,
  onMessage: (msg: DisplayMessage) => void
): PeerGuestState {
  const [status, setStatus] = useState<PeerGuestStatus>('idle');
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

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

    peer.on('open', () => {
      const hostId = PEER_ID_PREFIX + roomCode;
      const conn = peer.connect(hostId, { reliable: true });
      connRef.current = conn;

      conn.on('open', () => {
        setStatus('connected');
        conn.send({ type: 'ping' });
      });

      conn.on('data', (data: unknown) => {
        if (data && typeof data === 'object' && 'type' in data) {
          onMessageRef.current(data as DisplayMessage);
        }
      });

      conn.on('close', () => setStatus('error'));
      conn.on('error', () => setStatus('error'));
    });

    peer.on('error', () => setStatus('error'));

    return () => {
      try { connRef.current?.close(); } catch { }
      try { peer.destroy(); } catch { }
      peerRef.current = null;
      connRef.current = null;
      setStatus('idle');
    };
  }, [roomCode]);

  return { status, isConnected: status === 'connected' };
}
