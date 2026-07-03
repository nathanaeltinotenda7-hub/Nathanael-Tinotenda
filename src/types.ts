export interface Message {
  id: string;
  senderId: 'me' | 'other' | 'meta-ai';
  senderName: string;
  content: string;
  timestamp: string;
  isOfflinePending?: boolean;
  isVoiceNote?: boolean;
  voiceDuration?: string;
}

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  isGroup: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isMetaAI?: boolean;
  status?: 'online' | 'offline' | 'typing';
  messages: Message[];
  isArchived?: boolean;
}

export interface Comment {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
}

export interface Post {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  mediaUrl?: string;
  likes: number;
  hasLiked: boolean;
  comments: Comment[];
  timestamp: string;
  isOfflinePending?: boolean;
}

export interface Story {
  id: string;
  userName: string;
  avatar: string;
  mediaUrl: string;
  isViewed: boolean;
}

export interface CallLog {
  id: string;
  name: string;
  avatar: string;
  type: 'voice' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  timestamp: string;
  duration?: string;
}

export interface AppSettings {
  dataUsage: 'low' | 'medium' | 'high';
  mediaAutoDownload: boolean;
  pictureQuality: 'low' | 'standard' | 'high';
  videoResolution: '720p' | '1080p' | '4k';
  videoFrameRate: number;
  videoCodec: 'H264' | 'H265' | 'VP9';
  audioCodec: 'Opus' | 'AAC';
  noiseCancellation: boolean;
  selectedRingtone: string;
  lowDataWarningThreshold: number; // in MB
  videoCallQuality: 'optimize-data' | 'optimize-quality';
  voiceCallQuality: 'optimize-data' | 'optimize-quality';
}

export interface AnalyticsMetric {
  label: string;
  value: string | number;
  change: string;
  isPositive: boolean;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  date: string;
  active: boolean;
}

export interface StatusViewer {
  userEmail: string;
  userName: string;
  userAvatar: string;
  viewedAt: string;
}

export interface StatusUpdate {
  id: string;
  userEmail: string;
  userName: string;
  userAvatar: string;
  type: 'text' | 'image';
  content: string; // text body or caption
  mediaUrl?: string; // image url
  backgroundColor?: string; // e.g. solid or linear gradient preset
  fontStyle?: string; // tailwind font class or custom styling
  textColor?: string; // custom hex or tailwind class
  createdAt: string; // ISO string
  views: StatusViewer[];
  isOfflinePending?: boolean;
}
