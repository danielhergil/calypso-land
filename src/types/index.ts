export interface StreamProfile {
  alias: string;
  audioSettings: Record<string, any>;
  bitrateKbps: number;
  source: string;
  connections: Connection[];
  recordSettings: {
    bitrateMbps: number;
    resolution: string;
  };
  selectedConnectionAlias: string;
  videoSettings: {
    bitrateMbps: number;
    codec: string;
    fps: number;
    resolution: string;
    source: string;
  };
}

export interface Connection {
  alias: string;
  full_url: string;
  rtmp_url: string;
  streamkey: string;
}

export interface Team {
  alias: string;
  createdAt: string;
  logo: string;
  name: string;
  players: Player[];
}

export interface Player {
  number: number;
  playerName: string;
}

export interface UserMetrics {
  totalStreamTime: number;
  lastStreamTime: number;
  totalRecordingTime: number;
  lastRecordingTime: number;
  numberOfTeams: number;
  lastStreamConfig?: StreamProfile;
}