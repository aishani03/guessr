import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { OnlineRoomData } from '../types/game';

// Storage keys
const SUPABASE_URL_KEY = 'guessr_supabase_url';
const SUPABASE_ANON_KEY = 'guessr_supabase_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export const getSupabaseConfig = (): SupabaseConfig => {
  const envUrl = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = localStorage.getItem(SUPABASE_URL_KEY) || envUrl;
  const storedKey = localStorage.getItem(SUPABASE_ANON_KEY) || envKey;

  return {
    url: storedUrl,
    anonKey: storedKey
  };
};

export const saveSupabaseConfig = (config: SupabaseConfig) => {
  if (config.url) localStorage.setItem(SUPABASE_URL_KEY, config.url.trim());
  else localStorage.removeItem(SUPABASE_URL_KEY);

  if (config.anonKey) localStorage.setItem(SUPABASE_ANON_KEY, config.anonKey.trim());
  else localStorage.removeItem(SUPABASE_ANON_KEY);

  cachedClient = null; // Reset cached client
};

let cachedClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (cachedClient) return cachedClient;

  const { url, anonKey } = getSupabaseConfig();
  if (url && anonKey) {
    try {
      cachedClient = createClient(url, anonKey, {
        auth: {
          persistSession: false,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
      return cachedClient;
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return null;
};

// Local Wi-Fi Network Relay API calls (for multi-device testing on same network)
export const fetchRoomFromRelay = async (roomCode: string): Promise<OnlineRoomData | null> => {
  try {
    const res = await fetch(`/api/rooms/${roomCode}`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch {
    // ignore
  }
  return null;
};

export const postRoomToRelay = async (data: OnlineRoomData): Promise<void> => {
  try {
    await fetch(`/api/rooms/${data.roomCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch {
    // ignore
  }
};

// Local BroadcastChannel for cross-tab multiplayer testing
class LocalBroadcastMultiplayer {
  private channel: BroadcastChannel | null = null;
  private roomCode: string = '';
  private onMessageCallback: ((data: OnlineRoomData) => void) | null = null;

  init(roomCode: string, onUpdate: (data: OnlineRoomData) => void) {
    this.roomCode = roomCode;
    this.onMessageCallback = onUpdate;
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(`guessr_room_${roomCode}`);
      this.channel.onmessage = (event) => {
        if (event.data && this.onMessageCallback) {
          this.onMessageCallback(event.data as OnlineRoomData);
        }
      };
    }
  }

  broadcast(data: OnlineRoomData) {
    if (this.channel) {
      this.channel.postMessage(data);
    }
    // Also save in localStorage for persistence across refreshes
    try {
      localStorage.setItem(`guessr_room_state_${this.roomCode}`, JSON.stringify(data));
    } catch {
      // ignore
    }
    // And push to Wi-Fi relay
    postRoomToRelay(data);
  }

  getSavedState(roomCode: string): OnlineRoomData | null {
    try {
      const saved = localStorage.getItem(`guessr_room_state_${roomCode}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.onMessageCallback = null;
  }
}

export const localPeerManager = new LocalBroadcastMultiplayer();

// Recommended SQL setup query for Supabase if the user wants dedicated PostgreSQL table
export const SUPABASE_SQL_SCHEMA = `-- Guessr Multiplayer Table
CREATE TABLE IF NOT EXISTS guessr_rooms (
  room_code TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE guessr_rooms;

-- Row Level Security (allow public read and update for rooms)
ALTER TABLE guessr_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public rooms access" ON guessr_rooms FOR ALL USING (true) WITH CHECK (true);
`;
