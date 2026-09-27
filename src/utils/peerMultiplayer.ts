import { OnlineRoomData } from '../types/game';

// PeerJS global loaded from /peerjs.min.js in index.html
declare global {
  interface Window {
    Peer: any;
  }
}

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

interface PeerMessage {
  type: 'JOIN_REQUEST' | 'JOIN_ACCEPTED' | 'ROOM_SYNC' | 'PING' | 'PONG' | 'LEAVE';
  payload?: any;
  timestamp: number;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' }
];

export const getPeerIdForRoom = (roomCode: string) => {
  return `guessr-net-${roomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
};

export class PeerMultiplayerManager {
  private peer: any = null;
  private activeConnection: any = null;
  private roomCode: string = '';
  private isHost: boolean = false;
  private status: ConnectionStatus = 'idle';

  private onStatusChangeCallback: ((status: ConnectionStatus, message?: string) => void) | null = null;
  private onRoomSyncCallback: ((room: OnlineRoomData) => void) | null = null;
  private onGuestJoinCallback: ((guestName: string, guestId: string) => void) | null = null;
  private heartbeatInterval: number | null = null;

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public isConnected(): boolean {
    return this.status === 'connected' && this.activeConnection?.open === true;
  }

  private setStatus(newStatus: ConnectionStatus, message?: string) {
    this.status = newStatus;
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(newStatus, message);
    }
  }

  private waitForPeerJs(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && window.Peer) {
        return resolve(window.Peer);
      }
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (typeof window !== 'undefined' && window.Peer) {
          clearInterval(interval);
          resolve(window.Peer);
        } else if (attempts > 30) {
          clearInterval(interval);
          reject(new Error('PeerJS failed to load. Please check your internet connection.'));
        }
      }, 100);
    });
  }

  // 1. HOST: Host creates a room peer and waits for incoming guest connection
  public async initHost(
    roomCode: string,
    initialRoom: OnlineRoomData,
    callbacks: {
      onStatusChange?: (status: ConnectionStatus, message?: string) => void;
      onRoomSync?: (room: OnlineRoomData) => void;
      onGuestJoin?: (guestName: string, guestId: string) => void;
    }
  ): Promise<boolean> {
    this.destroy();
    this.roomCode = roomCode;
    this.isHost = true;
    this.onStatusChangeCallback = callbacks.onStatusChange || null;
    this.onRoomSyncCallback = callbacks.onRoomSync || null;
    this.onGuestJoinCallback = callbacks.onGuestJoin || null;

    this.setStatus('connecting', 'Registering room on global WebRTC network...');

    try {
      const PeerClass = await this.waitForPeerJs();
      const hostPeerId = getPeerIdForRoom(roomCode);

      this.peer = new PeerClass(hostPeerId, {
        config: { iceServers: ICE_SERVERS },
        debug: 1
      });

      this.peer.on('open', (id: string) => {
        console.log('[WebRTC Host] Room registered online with Peer ID:', id);
        this.setStatus('connecting', 'Room ready online. Waiting for opponent to join...');
      });

      this.peer.on('connection', (conn: any) => {
        console.log('[WebRTC Host] Incoming guest connection received');
        this.setupConnection(conn, initialRoom);
      });

      this.peer.on('error', (err: any) => {
        console.warn('[WebRTC Host Error]', err);
        // If room ID is taken (e.g. host refreshed), retry or inform
        if (err.type === 'unavailable-id') {
          this.setStatus('connecting', 'Room code active. Re-establishing connection...');
        } else {
          this.setStatus('error', `Network error: ${err.type || 'Connection failed'}`);
        }
      });

      this.peer.on('disconnected', () => {
        console.log('[WebRTC Host] Signaling broker disconnected, attempting reconnect...');
        if (this.peer && !this.peer.destroyed) {
          try {
            this.peer.reconnect();
          } catch {
            // ignore
          }
        }
      });

      return true;
    } catch (e: any) {
      console.error('[WebRTC Host Init Exception]', e);
      this.setStatus('error', e.message || 'Failed to start WebRTC room.');
      return false;
    }
  }

  // 2. GUEST: Guest connects to Host's room peer
  public async initGuest(
    roomCode: string,
    guestName: string,
    guestId: string,
    callbacks: {
      onStatusChange?: (status: ConnectionStatus, message?: string) => void;
      onRoomSync?: (room: OnlineRoomData) => void;
    }
  ): Promise<boolean> {
    this.destroy();
    this.roomCode = roomCode;
    this.isHost = false;
    this.onStatusChangeCallback = callbacks.onStatusChange || null;
    this.onRoomSyncCallback = callbacks.onRoomSync || null;

    this.setStatus('connecting', 'Connecting to host across internet/cellular...');

    try {
      const PeerClass = await this.waitForPeerJs();
      // Random guest peer ID
      const guestPeerId = `guessr-guest-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

      this.peer = new PeerClass(guestPeerId, {
        config: { iceServers: ICE_SERVERS },
        debug: 1
      });

      this.peer.on('open', () => {
        const hostPeerId = getPeerIdForRoom(roomCode);
        console.log('[WebRTC Guest] Registered. Dialing host:', hostPeerId);

        const conn = this.peer.connect(hostPeerId, {
          reliable: true
        });

        this.setupConnection(conn, null, { guestName, guestId });
      });

      this.peer.on('error', (err: any) => {
        console.warn('[WebRTC Guest Error]', err);
        if (err.type === 'peer-unavailable') {
          this.setStatus('error', 'Room not found. Please double-check the 6-character room code.');
        } else {
          this.setStatus('error', `Connection error: ${err.type || 'Could not connect'}`);
        }
      });

      return true;
    } catch (e: any) {
      console.error('[WebRTC Guest Init Exception]', e);
      this.setStatus('error', e.message || 'Failed to connect to room.');
      return false;
    }
  }

  // 3. Shared Connection Setup for DataChannel
  private setupConnection(conn: any, initialHostRoom: OnlineRoomData | null, guestInfo?: { guestName: string; guestId: string }) {
    this.activeConnection = conn;

    conn.on('open', () => {
      console.log('[WebRTC Connection Open] Direct DataChannel established!');
      this.setStatus('connected', 'Connected! Real-time WebRTC active.');
      this.startHeartbeat();

      if (!this.isHost && guestInfo) {
        // Send join request to host
        this.sendMessage({
          type: 'JOIN_REQUEST',
          payload: guestInfo,
          timestamp: Date.now()
        });
      } else if (this.isHost && initialHostRoom) {
        // Host immediately transmits current room state
        this.sendMessage({
          type: 'ROOM_SYNC',
          payload: initialHostRoom,
          timestamp: Date.now()
        });
      }
    });

    conn.on('data', (raw: any) => {
      const msg = raw as PeerMessage;
      if (!msg || !msg.type) return;

      switch (msg.type) {
        case 'JOIN_REQUEST':
          if (this.isHost && msg.payload) {
            console.log('[WebRTC] Guest requested join:', msg.payload);
            if (this.onGuestJoinCallback) {
              this.onGuestJoinCallback(msg.payload.guestName, msg.payload.guestId);
            }
          }
          break;

        case 'ROOM_SYNC':
          if (msg.payload && this.onRoomSyncCallback) {
            this.onRoomSyncCallback(msg.payload as OnlineRoomData);
          }
          break;

        case 'PING':
          this.sendMessage({ type: 'PONG', timestamp: Date.now() });
          break;

        case 'PONG':
          // Heartbeat ack
          break;

        case 'LEAVE':
          this.setStatus('disconnected', 'Opponent left the match.');
          break;
      }
    });

    conn.on('close', () => {
      console.log('[WebRTC Connection Closed]');
      this.setStatus('disconnected', 'Connection closed by peer.');
      this.stopHeartbeat();
    });

    conn.on('error', (err: any) => {
      console.warn('[WebRTC DataChannel Error]', err);
      this.setStatus('error', 'Data channel interrupted.');
    });
  }

  // 4. Send Room Sync update to the peer
  public broadcastRoomUpdate(room: OnlineRoomData) {
    if (this.isConnected()) {
      this.sendMessage({
        type: 'ROOM_SYNC',
        payload: room,
        timestamp: Date.now()
      });
    }
  }

  private sendMessage(msg: PeerMessage) {
    if (this.activeConnection && this.activeConnection.open) {
      try {
        this.activeConnection.send(msg);
      } catch (err) {
        console.warn('[WebRTC Send Failed]', err);
      }
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = window.setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage({ type: 'PING', timestamp: Date.now() });
      }
    }, 5000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // 5. Cleanup
  public destroy() {
    this.stopHeartbeat();

    if (this.activeConnection) {
      try {
        this.sendMessage({ type: 'LEAVE', timestamp: Date.now() });
        this.activeConnection.close();
      } catch {
        // ignore
      }
      this.activeConnection = null;
    }

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // ignore
      }
      this.peer = null;
    }

    this.status = 'idle';
    this.isHost = false;
    this.roomCode = '';
  }
}

export const peerMultiplayer = new PeerMultiplayerManager();
