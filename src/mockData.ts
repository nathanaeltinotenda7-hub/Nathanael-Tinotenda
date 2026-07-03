import { Post, Chat, Story, CallLog, AppSettings, SystemAnnouncement } from "./types";

export const DEFAULT_SETTINGS: AppSettings = {
  dataUsage: 'medium',
  mediaAutoDownload: true,
  pictureQuality: 'standard',
  videoResolution: '1080p',
  videoFrameRate: 30,
  videoCodec: 'H264',
  audioCodec: 'Opus',
  noiseCancellation: true,
  selectedRingtone: 'Default Chime',
  lowDataWarningThreshold: 50,
  videoCallQuality: 'optimize-quality',
  voiceCallQuality: 'optimize-quality'
};

export const INITIAL_STORIES: Story[] = [
  {
    id: "s1",
    userName: "Alex Rivers",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    mediaUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
    isViewed: false
  },
  {
    id: "s2",
    userName: "Zoe Chen",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    mediaUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600",
    isViewed: false
  },
  {
    id: "s3",
    userName: "Marcus Vance",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
    mediaUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600",
    isViewed: true
  },
  {
    id: "s4",
    userName: "Jessica K.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    mediaUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600",
    isViewed: false
  }
];

export const INITIAL_CHATS: Chat[] = [
  {
    id: "meta-ai",
    name: "Meta AI ✧",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150",
    isGroup: false,
    lastMessage: "Hello! I am Meta AI. How can I help you connect, explore, or build today?",
    lastMessageTime: "Just now",
    unreadCount: 1,
    isMetaAI: true,
    status: "online",
    messages: [
      {
        id: "m_meta_1",
        senderId: "meta-ai",
        senderName: "Meta AI",
        content: "Hey, I'm your integrated intelligence partner. Ask me any question, generate messages, check social analytics, or look up knowledge!",
        timestamp: "10:00 AM"
      }
    ]
  },
  {
    id: "group-fam",
    name: "The Family Network 🏠",
    avatar: "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=150",
    isGroup: true,
    lastMessage: "Dad: Don't forget our dinner at 7 PM tonight! Bring dessert.",
    lastMessageTime: "12:30 PM",
    unreadCount: 2,
    messages: [
      {
        id: "m_fam_1",
        senderId: "other",
        senderName: "Mom",
        content: "Who is grabbing groceries for the weekend?",
        timestamp: "11:15 AM"
      },
      {
        id: "m_fam_2",
        senderId: "me",
        senderName: "Me",
        content: "I can pick up the bread and drinks on my way back.",
        timestamp: "11:20 AM"
      },
      {
        id: "m_fam_3",
        senderId: "other",
        senderName: "Dad",
        content: "Don't forget our dinner at 7 PM tonight! Bring dessert.",
        timestamp: "12:30 PM"
      }
    ]
  },
  {
    id: "chat-sarah",
    name: "Sarah Jenkins",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    isGroup: false,
    lastMessage: "Did you watch the new documentary about workspace tech?",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    status: "online",
    messages: [
      {
        id: "m_sar_1",
        senderId: "me",
        senderName: "Me",
        content: "Hey Sarah! How's the design project going?",
        timestamp: "Yesterday, 3:15 PM"
      },
      {
        id: "m_sar_2",
        senderId: "other",
        senderName: "Sarah Jenkins",
        content: "Going great! Just wrapping up some wireframes. Did you watch the new documentary about workspace tech?",
        timestamp: "Yesterday, 3:18 PM"
      }
    ]
  },
  {
    id: "chat-nathanael",
    name: "Nathanael (Owner)",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    isGroup: false,
    lastMessage: "System: Developer Access active for nathanaeltinotenda7@gmail.com",
    lastMessageTime: "05:43 AM",
    unreadCount: 0,
    status: "online",
    messages: [
      {
        id: "m_nat_1",
        senderId: "other",
        senderName: "Nathanael",
        content: "Connections App initialized. Ready to check settings and analytics.",
        timestamp: "05:43 AM"
      }
    ]
  }
];

export const INITIAL_POSTS: Post[] = [
  {
    id: "p1",
    authorName: "Sarah Jenkins",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    content: "Hiking high above the clouds this morning! Breathing in fresh air and disconnected from emails for a few hours. 🌄 #nature #recharge",
    mediaUrl: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800",
    likes: 42,
    hasLiked: false,
    timestamp: "2 hours ago",
    comments: [
      {
        id: "c1_1",
        authorName: "Marcus Vance",
        authorAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
        content: "Absolutely stunning view! Where was this taken?",
        timestamp: "1 hour ago"
      },
      {
        id: "c1_2",
        authorName: "Sarah Jenkins",
        authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
        content: "Mount Rainier! Trail was super clear today.",
        timestamp: "45 mins ago"
      }
    ]
  },
  {
    id: "p2",
    authorName: "Nathanael (Owner)",
    authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    content: "Launching 'CONNECTIONS' today! 🚀 Blending the fast real-time group-chat layout of WhatsApp with the collaborative social updates of Facebook. Built full offline support and intelligent Meta AI assistance. Try testing offline toggles in the top bar! Let me know what you think of the Admin Dashboard.",
    mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
    likes: 156,
    hasLiked: true,
    timestamp: "5 hours ago",
    comments: [
      {
        id: "c2_1",
        authorName: "Zoe Chen",
        authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
        content: "This is super smooth! Love how fast the offline sync works.",
        timestamp: "4 hours ago"
      },
      {
        id: "c2_2",
        authorName: "Alex Rivers",
        authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        content: "Meta AI integration is super smart. Great job nathanaeltinotenda7@gmail.com!",
        timestamp: "3 hours ago"
      }
    ]
  }
];

export const INITIAL_CALLS: CallLog[] = [
  {
    id: "cl1",
    name: "Sarah Jenkins",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    type: "video",
    direction: "incoming",
    timestamp: "Today, 10:14 AM",
    duration: "14 mins 23 secs"
  },
  {
    id: "cl2",
    name: "Dad",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    type: "voice",
    direction: "outgoing",
    timestamp: "Yesterday, 4:45 PM",
    duration: "4 mins 10 secs"
  },
  {
    id: "cl3",
    name: "Marcus Vance",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
    type: "video",
    direction: "missed",
    timestamp: "Yesterday, 11:20 AM"
  }
];

export const INITIAL_ANNOUNCEMENTS: SystemAnnouncement[] = [
  {
    id: "a1",
    title: "System Update v1.4.0 Live",
    content: "We've optimized data compression for video streaming, ensuring H264/VP9 codecs consumes 35% less bandwidth in Data Saver mode.",
    date: "2026-07-02",
    active: true
  },
  {
    id: "a2",
    title: "Meta AI Upgraded",
    content: "The embedded Meta AI now supports deeper reasoning powered by Gemini 3.5 Flash, responding with zero delay.",
    date: "2026-07-01",
    active: true
  }
];
