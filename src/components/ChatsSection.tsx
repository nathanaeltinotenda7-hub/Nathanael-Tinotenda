import React, { useState, useEffect, useRef } from "react";
import { Chat, Message } from "../types";
import { 
  Send, 
  Cpu, 
  Sparkles, 
  Phone, 
  Video, 
  Search, 
  CheckCheck,
  Globe,
  Plus,
  AlertTriangle,
  RefreshCw,
  Clock,
  MoreVertical,
  Paperclip,
  Smile,
  Info,
  X,
  Lock,
  Calendar,
  Image as ImageIcon,
  ChevronRight,
  Palette,
  Archive,
  ArrowLeft,
  Mic,
  Trash2,
  Play,
  Pause,
  Check,
  CloudLightning
} from "lucide-react";
import VoiceInputButton from "./VoiceInputButton";

interface ChatsSectionProps {
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  isOffline: boolean;
  userEmail: string;
  triggerToast?: (message: string, type?: 'success' | 'info' | 'warning') => void;
  isSyncing?: boolean;
}

export default function ChatsSection({
  chats,
  setChats,
  isOffline,
  userEmail,
  triggerToast,
  isSyncing = false
}: ChatsSectionProps) {
  const [selectedChatId, setSelectedChatId] = useState<string>("meta-ai");
  const [typedMessage, setTypedMessage] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false);
  const [aiResponseError, setAiResponseError] = useState<string | null>(null);
  
  // Voice note recording states
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [voiceIntervalId, setVoiceIntervalId] = useState<any>(null);

  // Playback states
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<{ [msgId: string]: number }>({});
  const playbackIntervalsRef = useRef<{ [msgId: string]: any }>({});

  const startVoiceRecording = () => {
    setIsRecordingVoice(true);
    setRecordingSeconds(0);
    const interval = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);
    setVoiceIntervalId(interval);
    if (triggerToast) {
      triggerToast("🎙️ Voice note recording started! Speak clearly into your mic.", "success");
    }
  };

  const cancelVoiceRecording = () => {
    if (voiceIntervalId) {
      clearInterval(voiceIntervalId);
      setVoiceIntervalId(null);
    }
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
    if (triggerToast) {
      triggerToast("❌ Voice note recording cancelled and discarded.", "warning");
    }
  };

  const sendVoiceNote = () => {
    if (voiceIntervalId) {
      clearInterval(voiceIntervalId);
      setVoiceIntervalId(null);
    }
    
    const secsToFormat = recordingSeconds || 1; // Default to 1 if extremely quick tap
    const mins = Math.floor(secsToFormat / 60);
    const secs = secsToFormat % 60;
    const formattedDuration = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    
    setIsRecordingVoice(false);
    setRecordingSeconds(0);

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const voiceMsg: Message = {
      id: `msg_vn_${Date.now()}`,
      senderId: 'me',
      senderName: userEmail === "nathanaeltinotenda7@gmail.com" ? "Nathanael (Owner)" : "Guest User",
      content: `🎤 Voice Note (${formattedDuration})`,
      timestamp,
      isOfflinePending: isOffline,
      isVoiceNote: true,
      voiceDuration: formattedDuration
    };

    if (activeChat.isArchived) {
      handleToggleArchive(activeChat.id, false);
    }

    setChats(prevChats => prevChats.map(c => {
      if (c.id === selectedChatId) {
        return {
          ...c,
          lastMessage: `🎤 Voice Note (${formattedDuration})`,
          lastMessageTime: timestamp,
          messages: [...c.messages, voiceMsg]
        };
      }
      return c;
    }));

    if (triggerToast) {
      triggerToast("🎤 Voice note sent successfully!", "success");
    }

    if (activeChat.isMetaAI) {
      if (isOffline) {
        setTimeout(() => {
          const offlineAiNotice: Message = {
            id: `msg_vn_notice_${Date.now()}`,
            senderId: 'meta-ai',
            senderName: "Meta AI",
            content: "⚠️ [Offline Notice] I received your voice note, but since I am running offline right now, I cannot analyze its auditory spectrum. I've queued it in your memory and will transcribe it once you're online!",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOfflinePending: true
          };
          setChats(prevChats => prevChats.map(c => {
            if (c.isMetaAI) {
              return { ...c, messages: [...c.messages, offlineAiNotice] };
            }
            return c;
          }));
        }, 1200);
      } else {
        setIsAiResponding(true);
        setTimeout(async () => {
          try {
            const aiReplyMsg: Message = {
              id: `msg_vn_reply_${Date.now()}`,
              senderId: 'meta-ai',
              senderName: "Meta AI",
              content: "🔊 [AI Voice Note Transcribed]: \"Hi Meta AI, hope you are doing great! Let me know if you can hear this!\"\n\nResponse: Yes, I can hear you perfectly! I processed your voice signature using browser DSP algorithms. High-fidelity spectral audio registered. Anything else I can assist you with?",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setChats(prevChats => prevChats.map(c => {
              if (c.id === selectedChatId) {
                return {
                  ...c,
                  lastMessage: aiReplyMsg.content,
                  lastMessageTime: aiReplyMsg.timestamp,
                  messages: [...c.messages, aiReplyMsg]
                };
              }
              return c;
            }));
          } catch (err) {
            console.error(err);
          } finally {
            setIsAiResponding(false);
          }
        }, 1800);
      }
    }
  };

  const togglePlayVoiceNote = (msgId: string, durationStr: string) => {
    if (playingMessageId === msgId) {
      if (playbackIntervalsRef.current[msgId]) {
        clearInterval(playbackIntervalsRef.current[msgId]);
        delete playbackIntervalsRef.current[msgId];
      }
      setPlayingMessageId(null);
      return;
    }

    if (playingMessageId && playbackIntervalsRef.current[playingMessageId]) {
      clearInterval(playbackIntervalsRef.current[playingMessageId]);
      delete playbackIntervalsRef.current[playingMessageId];
    }

    const parts = durationStr.split(":");
    const durationSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) || 5;

    setPlayingMessageId(msgId);
    setPlaybackProgress(prev => ({ ...prev, [msgId]: 0 }));
    
    const step = 100 / durationSeconds;

    const interval = setInterval(() => {
      setPlaybackProgress(prev => {
        const nextProg = (prev[msgId] ?? 0) + step;
        if (nextProg >= 100) {
          clearInterval(interval);
          setPlayingMessageId(null);
          return { ...prev, [msgId]: 100 };
        }
        return { ...prev, [msgId]: nextProg };
      });
    }, 1000);

    playbackIntervalsRef.current[msgId] = interval;
  };

  useEffect(() => {
    return () => {
      if (voiceIntervalId) clearInterval(voiceIntervalId);
      Object.values(playbackIntervalsRef.current).forEach((interval: any) => {
        if (interval) clearInterval(interval);
      });
    };
  }, [voiceIntervalId]);

  // Custom WhatsApp-inspired layout states
  const [showContactInfo, setShowContactInfo] = useState<boolean>(false);
  const [wallpaper, setWallpaper] = useState<'doodle' | 'classic' | 'solid'>('doodle');
  const [showWallpaperSelector, setShowWallpaperSelector] = useState<boolean>(false);
  const [showArchivedOnly, setShowArchivedOnly] = useState<boolean>(false);

  // Swipe-to-archive gesture states
  const [touchStartClientX, setTouchStartClientX] = useState<number>(0);
  const [activeSwipeChatId, setActiveSwipeChatId] = useState<string | null>(null);
  const [currentSwipeOffset, setCurrentSwipeOffset] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);

  const handleToggleArchive = async (chatId: string, isArchived: boolean) => {
    // Optimistic local state update
    setChats(prevChats => prevChats.map(c => {
      if (c.id === chatId) {
        return { ...c, isArchived };
      }
      return c;
    }));

    if (triggerToast) {
      triggerToast(
        isArchived ? "Chat archived successfully!" : "Chat restored from archive!",
        "success"
      );
    }

    if (!isOffline) {
      try {
        await fetch("/api/chats/archive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId, isArchived })
        });
      } catch (err) {
        console.error("Failed to archive chat on backend:", err);
      }
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, selectedChatId, isAiResponding]);

  const activeChat = chats.find(c => c.id === selectedChatId) || chats[0];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const messageText = typedMessage.trim();
    setTypedMessage("");
    setAiResponseError(null);

    // Create immediate user message
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      senderId: 'me',
      senderName: userEmail === "nathanaeltinotenda7@gmail.com" ? "Nathanael (Owner)" : "Guest User",
      content: messageText,
      timestamp,
      isOfflinePending: isOffline
    };

    // If currently archived, automatically restore/unarchive on sending a message
    if (activeChat.isArchived) {
      handleToggleArchive(activeChat.id, false);
    }

    // Update state instantly (Instant message delivery)
    setChats(prevChats => prevChats.map(c => {
      if (c.id === selectedChatId) {
        return {
          ...c,
          lastMessage: messageText,
          lastMessageTime: timestamp,
          messages: [...c.messages, userMsg]
        };
      }
      return c;
    }));

    // If chat is with Meta AI and we are offline, buffer response
    if (activeChat.isMetaAI) {
      if (isOffline) {
        // Queue automatic offline notice from Meta AI
        setTimeout(() => {
          const offlineAiNotice: Message = {
            id: `msg_${Date.now() + 1}`,
            senderId: 'meta-ai',
            senderName: "Meta AI",
            content: "⚠️ I am currently running in Offline Hybrid Mode. I have stored your prompt in the local device queue and will fully respond as soon as you simulate going online. (Offline capabilities powered by local client-side cache & memory for Owner Nathanael).",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOfflinePending: true
          };
          setChats(prevChats => prevChats.map(c => {
            if (c.isMetaAI) {
              return {
                ...c,
                messages: [...c.messages, offlineAiNotice]
              };
            }
            return c;
          }));
        }, 800);
      } else {
        // Trigger live server-side API call
        setIsAiResponding(true);
        try {
          const currentChatMessages = chats.find(c => c.id === selectedChatId)?.messages || [];
          const conversationHistory = currentChatMessages.map(m => ({
            role: m.senderId === 'me' ? 'user' : 'model',
            content: m.content
          }));

          const response = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: conversationHistory,
              userMessage: messageText
            })
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Failed to retrieve Meta AI response.");
          }

          const aiReplyMsg: Message = {
            id: `msg_${Date.now() + 2}`,
            senderId: 'meta-ai',
            senderName: "Meta AI",
            content: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          setChats(prevChats => prevChats.map(c => {
            if (c.id === selectedChatId) {
              return {
                ...c,
                lastMessage: data.reply,
                lastMessageTime: aiReplyMsg.timestamp,
                messages: [...c.messages, aiReplyMsg]
              };
            }
            return c;
          }));
        } catch (err: any) {
          console.error("Meta AI fetch error:", err);
          setAiResponseError(err.message || "Unable to contact Meta AI servers. Please check your setup.");
          
          const errorFallbackMsg: Message = {
            id: `msg_${Date.now() + 3}`,
            senderId: 'meta-ai',
            senderName: "Meta AI",
            content: "⚠️ [Local Intelligence Fallback] I couldn't reach the backend server to complete the live Gemini prompt, but because you are the owner, I can answer from my local wisdom bank: To fix, make sure to add your GEMINI_API_KEY in the AI Studio secrets menu! Let me know if you need help with anything else.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setChats(prevChats => prevChats.map(c => {
            if (c.id === selectedChatId) {
              return { ...c, messages: [...c.messages, errorFallbackMsg] };
            }
            return c;
          }));
        } finally {
          setIsAiResponding(false);
        }
      }
    } else {
      // Set status to typing first for extra WhatsApp realism!
      setChats(prevChats => prevChats.map(c => {
        if (c.id === selectedChatId) {
          return { ...c, status: 'typing' };
        }
        return c;
      }));

      // Simulate real-time responses from other chat contacts
      setTimeout(() => {
        const responses = [
          "Got your message! I'm checking it right now.",
          "Awesome, sounds perfect. I'll get back to you shortly.",
          "Let's jump on a quick call 📞 to discuss! Or video call is fine.",
          "Perfect, talk to you soon!",
          "Thanks for letting me know. Connections is looking great!",
          "Yes, I saw Nathanael's new update too. The interface is stunning!",
          "Let's connect for dinner tonight at 7 PM. What dessert should I bring?"
        ];
        const randomReply = responses[Math.floor(Math.random() * responses.length)];
        const systemReply: Message = {
          id: `msg_${Date.now() + 1}`,
          senderId: 'other',
          senderName: activeChat.name,
          content: isOffline ? `[Buffered response when back online] ${randomReply}` : randomReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOfflinePending: isOffline
        };

        setChats(prevChats => prevChats.map(c => {
          if (c.id === selectedChatId) {
            return {
              ...c,
              status: 'online',
              lastMessage: systemReply.content,
              lastMessageTime: systemReply.timestamp,
              messages: [...c.messages, systemReply]
            };
          }
          return c;
        }));
      }, 1500);
    }
  };

  const archivedCount = chats.filter(c => c.isArchived).length;

  const filteredChats = chats.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (showArchivedOnly) {
      return !!c.isArchived;
    } else {
      return !c.isArchived;
    }
  });

  // Background CSS selector based on wallpaper choice
  const getWallpaperClass = () => {
    if (wallpaper === 'doodle') return 'whatsapp-chat-bg-doodle';
    if (wallpaper === 'classic') return 'whatsapp-chat-bg-classic';
    return 'whatsapp-chat-bg-solid';
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#111b21] text-[#e9edef] overflow-hidden h-full" id="chats-container">
      
      {/* Chats List Sidebar (Left) */}
      <div className="w-full md:w-80 border-r border-[#222d34] flex flex-col bg-[#111b21] shrink-0 h-full">
        
        {/* Search header bar */}
        <div className="p-3 bg-[#111b21] space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#e9edef] tracking-wide uppercase font-sans">
              Chats
            </h3>
            <span className="text-[10px] text-[#00a884] font-bold px-2 py-0.5 rounded-full bg-[#00a884]/10 border border-[#00a884]/20 font-mono">
              {chats.length} active
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search or start a new chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#202c33] border border-transparent text-[#e9edef] rounded-lg py-2 pl-9 pr-4 text-xs focus:outline-none focus:bg-[#2a3942] placeholder-[#8696a0] transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-[#8696a0] absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Chats lists items */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#222d34]/40 bg-[#111b21]">
          {/* Archived Chats Toggle Banner */}
          {!showArchivedOnly && archivedCount > 0 && (
            <button
              onClick={() => setShowArchivedOnly(true)}
              className="w-full p-3.5 flex items-center justify-between border-b border-[#222d34]/60 bg-[#111b21] hover:bg-[#202c33]/40 text-[#e9edef] transition-colors select-none text-left"
            >
              <div className="flex items-center gap-3">
                <Archive className="w-4 h-4 text-[#00a884]" />
                <span className="text-xs font-semibold">Archived Chats</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-[#00a884]/15 text-[#00a884] border border-[#00a884]/20 px-2 py-0.5 rounded-full">
                {archivedCount}
              </span>
            </button>
          )}

          {showArchivedOnly && (
            <button
              onClick={() => setShowArchivedOnly(false)}
              className="w-full p-3.5 flex items-center gap-2 border-b border-[#222d34]/60 bg-[#202c33]/30 hover:bg-[#202c33]/50 text-[#00a884] transition-colors select-none text-left text-xs font-bold font-mono uppercase tracking-wider"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Active Chats</span>
            </button>
          )}

          {filteredChats.map(chat => {
            const isSelected = chat.id === selectedChatId;
            const isTyping = chat.status === 'typing';
            const isThisChatSwiping = activeSwipeChatId === chat.id;
            const displayOffset = isThisChatSwiping ? currentSwipeOffset : 0;

            return (
              <div 
                key={chat.id} 
                className="relative overflow-hidden w-full bg-[#111b21] border-b border-[#222d34]/20 select-none"
              >
                {/* Swipe Action Background (Teal/Blue depending on archive state) */}
                <div 
                  className={`absolute inset-0 flex items-center justify-end px-6 transition-colors z-0 ${
                    chat.isArchived ? "bg-sky-600/90" : "bg-emerald-600/90"
                  }`}
                  style={{
                    opacity: isThisChatSwiping && currentSwipeOffset < -15 ? 1 : 0
                  }}
                >
                  <div className="flex items-center gap-2 text-[#e9edef] font-sans font-bold pr-4">
                    <Archive className="w-5 h-5 text-white animate-pulse" />
                    <span className="text-xs tracking-wide">
                      {chat.isArchived ? "Unarchive" : "Archive"}
                    </span>
                  </div>
                </div>

                <button
                  id={`chat-item-${chat.id}`}
                  onClick={() => {
                    if (!isSwiping && Math.abs(displayOffset) < 10) {
                      setSelectedChatId(chat.id);
                      // Auto-close detail panel on switching chats for focus
                      setShowContactInfo(false);
                    }
                  }}
                  onTouchStart={(e) => {
                    setTouchStartClientX(e.touches[0].clientX);
                    setActiveSwipeChatId(chat.id);
                    setIsSwiping(true);
                  }}
                  onTouchMove={(e) => {
                    if (!isSwiping || activeSwipeChatId !== chat.id) return;
                    const diffX = e.touches[0].clientX - touchStartClientX;
                    // Only allow swiping left
                    const offset = Math.max(-140, Math.min(0, diffX));
                    setCurrentSwipeOffset(offset);
                  }}
                  onTouchEnd={() => {
                    if (activeSwipeChatId === chat.id) {
                      if (currentSwipeOffset < -75) {
                        handleToggleArchive(chat.id, !chat.isArchived);
                      }
                    }
                    setIsSwiping(false);
                    setActiveSwipeChatId(null);
                    setCurrentSwipeOffset(0);
                  }}
                  onMouseDown={(e) => {
                    setTouchStartClientX(e.clientX);
                    setActiveSwipeChatId(chat.id);
                    setIsSwiping(true);
                  }}
                  onMouseMove={(e) => {
                    if (!isSwiping || activeSwipeChatId !== chat.id) return;
                    const diffX = e.clientX - touchStartClientX;
                    const offset = Math.max(-140, Math.min(0, diffX));
                    setCurrentSwipeOffset(offset);
                  }}
                  onMouseUp={() => {
                    if (activeSwipeChatId === chat.id) {
                      if (currentSwipeOffset < -75) {
                        handleToggleArchive(chat.id, !chat.isArchived);
                      }
                    }
                    setIsSwiping(false);
                    setActiveSwipeChatId(null);
                    setCurrentSwipeOffset(0);
                  }}
                  onMouseLeave={() => {
                    if (isSwiping && activeSwipeChatId === chat.id) {
                      setIsSwiping(false);
                      setActiveSwipeChatId(null);
                      setCurrentSwipeOffset(0);
                    }
                  }}
                  style={{
                    transform: `translateX(${displayOffset}px)`,
                    transition: isThisChatSwiping && isSwiping ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  className={`group w-full p-3.5 flex items-start gap-3.5 text-left focus:outline-none relative z-10 cursor-grab active:cursor-grabbing select-none ${
                    isSelected 
                      ? "bg-[#2a3942]" 
                      : "bg-[#111b21] hover:bg-[#202c33]/70"
                  }`}
                >
                  {/* Contact Avatar */}
                  <div className="relative shrink-0 select-none">
                    <img
                      src={chat.avatar}
                      alt={chat.name}
                      className="w-11 h-11 rounded-full object-cover border border-[#222d34]"
                      referrerPolicy="no-referrer"
                    />
                    {chat.status === "online" && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full border-2 border-[#111b21]" />
                    )}
                    {isTyping && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00a884] rounded-full border-2 border-[#111b21] animate-ping" />
                    )}
                  </div>

                  {/* Message Snip */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className={`text-xs font-bold truncate ${chat.isMetaAI ? 'text-sky-400 font-sans' : 'text-[#e9edef]'}`}>
                        {chat.name}
                      </span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-[#e9edef]/80' : 'text-[#8696a0]'}`}>
                        {chat.lastMessageTime}
                      </span>
                    </div>
                    {isTyping ? (
                      <p className="text-xs text-[#00a884] font-bold animate-pulse">
                        typing...
                      </p>
                    ) : (
                      <p className="text-xs text-[#8696a0] truncate pr-2">
                        {chat.lastMessage}
                      </p>
                    )}
                  </div>

                  {/* Badges & Archive/Unarchive Action */}
                  <div className="flex flex-col items-end justify-between shrink-0 self-stretch gap-1.5 py-0.5">
                    {chat.unreadCount > 0 && !isSelected ? (
                      <span className="bg-[#00a884] text-[#111b21] text-[10px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full font-mono">
                        {chat.unreadCount}
                      </span>
                    ) : (
                      <div className="w-5 h-5" />
                    )}
                    <button
                      type="button"
                      title={chat.isArchived ? "Unarchive chat" : "Archive chat"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleArchive(chat.id, !chat.isArchived);
                      }}
                      className="p-1 rounded-md text-[#8696a0] hover:text-[#00a884] hover:bg-[#202c33]/80 transition-all opacity-40 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </button>
              </div>
            );
          })}

          {filteredChats.length === 0 && (
            <div className="p-8 text-center text-[#8696a0] text-xs font-sans">
              No chats found with "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Window (Center/Right) */}
      <div className="flex-1 flex flex-col bg-[#0b141a] h-full overflow-hidden" id="chat-window">
        
        {/* Chat Window Header */}
        <div 
          onClick={() => setShowContactInfo(!showContactInfo)}
          className="h-14 border-b border-[#222d34]/60 flex items-center justify-between px-4 bg-[#202c33] shrink-0 cursor-pointer hover:bg-[#202c33]/80 select-none transition-colors"
        >
          <div className="flex items-center gap-3">
            <img
              src={activeChat.avatar}
              alt={activeChat.name}
              className="w-9 h-9 rounded-full object-cover border border-[#222d34]"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-[#e9edef]">{activeChat.name}</h4>
                {activeChat.isMetaAI && (
                  <span className="bg-[#00a884]/15 border border-[#00a884]/20 text-[#00a884] text-[8px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase">
                    AI AGENT
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#8696a0] flex items-center gap-1.5">
                {activeChat.isMetaAI ? (
                  <>
                    <Cpu className="w-3 h-3 text-[#00a884]" />
                    <span>Always online</span>
                  </>
                ) : activeChat.status === "typing" ? (
                  <span className="text-[#00a884] font-bold animate-pulse">typing...</span>
                ) : (
                  <>
                    <span className={`w-1.5 h-1.5 rounded-full ${activeChat.status === "online" ? "bg-[#00a884]" : "bg-slate-500"}`} />
                    <span>{activeChat.status === "online" ? "online" : "offline"}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Actions (Call simulators & Wallpaper changer) */}
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {/* Wallpaper Selector Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowWallpaperSelector(!showWallpaperSelector)}
                className={`p-2 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] rounded-full transition-colors ${showWallpaperSelector ? 'text-[#00a884] bg-[#2a3942]' : ''}`}
                title="Change WhatsApp Wallpaper"
              >
                <Palette className="w-4 h-4" />
              </button>

              {showWallpaperSelector && (
                <div className="absolute right-0 top-10 bg-[#202c33] border border-[#222d34] shadow-2xl rounded-xl p-2.5 z-50 w-44 space-y-1.5 animate-scaleIn">
                  <span className="text-[9px] font-mono font-bold text-[#8696a0] uppercase tracking-widest block px-1.5">
                    Chat Wallpaper
                  </span>
                  <button
                    onClick={() => {
                      setWallpaper('doodle');
                      setShowWallpaperSelector(false);
                      if (triggerToast) triggerToast("Wallpaper updated to Obsidian Doodle! 🎨", "success");
                    }}
                    className={`w-full text-left text-xs font-semibold p-1.5 rounded-lg flex items-center justify-between ${wallpaper === 'doodle' ? 'bg-[#00a884] text-[#111b21]' : 'hover:bg-[#2a3942] text-[#e9edef]'}`}
                  >
                    <span>Obsidian Doodle</span>
                    {wallpaper === 'doodle' && <span className="w-1.5 h-1.5 rounded-full bg-[#111b21]" />}
                  </button>
                  <button
                    onClick={() => {
                      setWallpaper('classic');
                      setShowWallpaperSelector(false);
                      if (triggerToast) triggerToast("Wallpaper updated to WhatsApp Teal! 🎨", "success");
                    }}
                    className={`w-full text-left text-xs font-semibold p-1.5 rounded-lg flex items-center justify-between ${wallpaper === 'classic' ? 'bg-[#00a884] text-[#111b21]' : 'hover:bg-[#2a3942] text-[#e9edef]'}`}
                  >
                    <span>WhatsApp Teal</span>
                    {wallpaper === 'classic' && <span className="w-1.5 h-1.5 rounded-full bg-[#111b21]" />}
                  </button>
                  <button
                    onClick={() => {
                      setWallpaper('solid');
                      setShowWallpaperSelector(false);
                      if (triggerToast) triggerToast("Wallpaper updated to Midnight Matte! 🎨", "success");
                    }}
                    className={`w-full text-left text-xs font-semibold p-1.5 rounded-lg flex items-center justify-between ${wallpaper === 'solid' ? 'bg-[#00a884] text-[#111b21]' : 'hover:bg-[#2a3942] text-[#e9edef]'}`}
                  >
                    <span>Midnight Matte</span>
                    {wallpaper === 'solid' && <span className="w-1.5 h-1.5 rounded-full bg-[#111b21]" />}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (triggerToast) {
                  triggerToast(`Simulating outbound audio call to ${activeChat.name}... 📞 Please confirm microphone permissions`, 'info');
                }
              }}
              className="p-2 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] rounded-full transition-colors"
              title="Voice Call"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (triggerToast) {
                  triggerToast(`Initiating secure peer-to-peer video connection with ${activeChat.name}... 📹`, 'success');
                }
              }}
              className="p-2 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] rounded-full transition-colors"
              title="Video Call"
            >
              <Video className="w-4 h-4 text-[#00a884]" />
            </button>
            <button
              onClick={() => handleToggleArchive(activeChat.id, !activeChat.isArchived)}
              className={`p-2 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] rounded-full transition-colors ${activeChat.isArchived ? 'text-[#00a884] bg-[#00a884]/10' : ''}`}
              title={activeChat.isArchived ? "Unarchive Chat" : "Archive Chat"}
            >
              <Archive className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowContactInfo(!showContactInfo)}
              className={`p-2 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] rounded-full transition-colors ${showContactInfo ? 'text-[#00a884] bg-[#2a3942]' : ''}`}
              title="Contact Info"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messaging Pane Viewport with collapsible drawer */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          
          {/* Scrollable messages container */}
          <div className={`flex-1 p-4 overflow-y-auto space-y-3.5 flex flex-col ${getWallpaperClass()} transition-all duration-300`}>
            
            {/* Security Notice Bubble */}
            <div className="mx-auto my-2 text-center max-w-sm bg-[#182229] border border-[#222d34] rounded-lg p-2.5 shadow-md select-none">
              <span className="text-[10px] text-[#ffd279] flex items-center justify-center gap-1.5 font-sans leading-normal">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.
              </span>
            </div>

            {/* Welcome Meta AI card if Meta AI */}
            {activeChat.isMetaAI && (
              <div className="bg-[#111b21] border border-[#00a884]/25 p-4.5 rounded-2xl max-w-md mx-auto text-center space-y-3 shadow-xl animate-bubble my-2">
                <div className="w-10 h-10 bg-[#00a884]/10 rounded-full flex items-center justify-center mx-auto text-[#00a884] border border-[#00a884]/20 shadow-md">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <h5 className="text-xs font-bold text-[#e9edef] tracking-wider uppercase font-sans">Meta AI Assistance</h5>
                <p className="text-[11px] text-[#8696a0] leading-relaxed">
                  Hi, I'm Meta AI. I am powered by Google Gemini 3.5 Flash inside Connections. Tap one of the immediate templates to try out:
                </p>
                <div className="flex flex-col gap-1.5 text-left text-[11px] font-medium pt-1">
                  <button 
                    onClick={() => setTypedMessage("What is the main benefit of CONNECTIONS over traditional chat apps?")}
                    className="bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] px-3 py-2 rounded-lg text-left transition-colors border border-[#222d34]"
                  >
                    💡 "Benefits of CONNECTIONS"
                  </button>
                  <button 
                    onClick={() => setTypedMessage("Write a highly engaging Facebook-style post about launching an app called CONNECTIONS.")}
                    className="bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] px-3 py-2 rounded-lg text-left transition-colors border border-[#222d34]"
                  >
                    ✏️ "Write a social post update"
                  </button>
                </div>
              </div>
            )}

            {/* Render bubbles with custom tail layouts */}
            {activeChat.messages.map(msg => {
              const isMe = msg.senderId === 'me';
              const isVoiceNote = msg.isVoiceNote || msg.content?.startsWith("🎤 Voice Note");
              const duration = msg.voiceDuration || (msg.content?.match(/\(([^)]+)\)/)?.[1] || "0:05");

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] md:max-w-[70%] animate-bubble ${
                    isMe 
                      ? 'self-end items-end' 
                      : 'self-start items-start'
                  }`}
                >
                  {isVoiceNote ? (
                    <div 
                      className={`px-3 py-2 text-xs leading-relaxed shadow relative whitespace-pre-wrap ${
                        isMe 
                          ? "bg-[#005c4b] text-[#e9edef] rounded-xl rounded-tr-none" 
                          : msg.senderId === 'meta-ai'
                            ? "bg-[#182229] border-l-4 border-sky-500 text-[#e9edef] rounded-xl rounded-tl-none"
                            : "bg-[#202c33] text-[#e9edef] rounded-xl rounded-tl-none"
                      } w-72 md:w-80`}
                    >
                      {/* Sender Name if Group Chat and not me */}
                      {!isMe && activeChat.isGroup && (
                        <span className="block text-[10px] font-bold text-amber-400 mb-1.5">
                          {msg.senderName}
                        </span>
                      )}

                      {/* Voice Note Audio Interface */}
                      <div className="flex items-center gap-3 py-1 text-slate-100 select-none">
                        {/* Play/Pause Button */}
                        <button
                          type="button"
                          onClick={() => togglePlayVoiceNote(msg.id, duration)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            isMe 
                              ? "bg-[#00a884] text-[#111b21] hover:bg-[#008f72]" 
                              : "bg-[#00a884]/20 text-[#00a884] hover:bg-[#00a884]/30"
                          } shrink-0`}
                        >
                          {playingMessageId === msg.id ? (
                            <div className="flex gap-1 items-center justify-center">
                              <span className="w-1 h-3 bg-current rounded animate-pulse" />
                              <span className="w-1 h-3 bg-current rounded animate-pulse delay-75" />
                            </div>
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>

                        {/* Waveform representation & Slider */}
                        <div className="flex-1 space-y-1.5">
                          {/* Audio Waveform Graphic */}
                          <div className="flex items-end gap-[3px] h-6 px-1">
                            {[35, 60, 40, 85, 50, 75, 45, 90, 65, 30, 70, 55, 80, 40, 60, 45, 30, 75, 50].map((height, idx) => {
                              const isPast = (playbackProgress[msg.id] || 0) > (idx / 19) * 100;
                              return (
                                <div
                                  key={idx}
                                  className={`w-[3px] rounded-full transition-colors duration-300`}
                                  style={{
                                    height: `${height}%`,
                                    backgroundColor: isPast 
                                      ? (isMe ? '#53bdeb' : '#00a884') 
                                      : (isMe ? '#02856c' : '#3c4b53')
                                  }}
                                />
                              );
                            })}
                          </div>

                          {/* Timing and Voice Indicator */}
                          <div className="flex justify-between items-center text-[10px] text-[#8696a0] font-mono leading-none">
                            <span className={playingMessageId === msg.id ? "text-[#53bdeb] font-semibold animate-pulse" : ""}>
                              {playingMessageId === msg.id 
                                ? `Playing ${Math.floor(((playbackProgress[msg.id] || 0) / 100) * (parseInt(duration.split(":")[1], 10) || 5))}s` 
                                : `Voice note • ${duration}`}
                            </span>
                          </div>
                        </div>

                        {/* Microphone icon helper */}
                        <div className="text-[#8696a0] shrink-0 self-end mb-1">
                          <Mic className="w-4 h-4 text-[#53bdeb]" />
                        </div>
                      </div>

                      {/* Tiny individual progress bar for offline voice note */}
                      {msg.isOfflinePending && (
                        <div className="mt-2 pt-1.5 border-t border-amber-500/15 space-y-1 select-none">
                          <div className="flex justify-between items-center text-[8px] font-mono font-bold text-amber-400 leading-none">
                            <span className="flex items-center gap-0.5">
                              <CloudLightning className="w-2.5 h-2.5 animate-pulse text-amber-500" />
                              {isSyncing ? "SYNCING VOICE CLIP..." : "QUEUED IN LOCAL CACHE"}
                            </span>
                            <span>{isSyncing ? "80%" : "0%"}</span>
                          </div>
                          <div className="w-full bg-[#1b1b1f]/50 h-1 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                isSyncing 
                                  ? "bg-emerald-400 w-[80%] animate-pulse" 
                                  : "bg-amber-500 w-[15%]"
                              }`}
                            />
                          </div>
                        </div>
                      )}

                      {/* Time & Receipts */}
                      <div className="flex items-center justify-end gap-1 text-[9px] text-[#8696a0] mt-1 text-right select-none">
                        <span>{msg.timestamp}</span>
                        {isMe && (
                          msg.isOfflinePending ? (
                            <Clock className="w-2.5 h-2.5 text-amber-500 animate-pulse" title="Offline Queue" />
                          ) : (
                            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    <div 
                      className={`px-3 py-2 text-xs leading-relaxed shadow relative whitespace-pre-wrap ${
                        isMe 
                          ? "bg-[#005c4b] text-[#e9edef] rounded-xl rounded-tr-none" 
                          : msg.senderId === 'meta-ai'
                            ? "bg-[#182229] border-l-4 border-sky-500 text-[#e9edef] rounded-xl rounded-tl-none"
                            : "bg-[#202c33] text-[#e9edef] rounded-xl rounded-tl-none"
                      }`}
                    >
                      {/* Sender Name if Group Chat and not me */}
                      {!isMe && activeChat.isGroup && (
                        <span className="block text-[10px] font-bold text-amber-400 mb-0.5">
                          {msg.senderName}
                        </span>
                      )}
                      
                      <span>{msg.content}</span>

                      {/* Tiny individual progress bar for offline standard messages */}
                      {msg.isOfflinePending && (
                        <div className="mt-2 pt-1.5 border-t border-amber-500/10 space-y-1 w-32 select-none">
                          <div className="flex justify-between items-center text-[8px] font-mono font-bold text-amber-400 leading-none">
                            <span className="flex items-center gap-0.5">
                              <CloudLightning className="w-2.5 h-2.5 animate-pulse text-amber-500" />
                              {isSyncing ? "SYNCING..." : "QUEUED"}
                            </span>
                            <span>{isSyncing ? "75%" : "0%"}</span>
                          </div>
                          <div className="w-full bg-[#1b1b1f]/50 h-1 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                isSyncing 
                                  ? "bg-emerald-400 w-[75%] animate-pulse" 
                                  : "bg-amber-500 w-[20%]"
                              }`}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Time & Receipts */}
                      <div className="flex items-center justify-end gap-1 text-[9px] text-[#8696a0] mt-1 text-right select-none">
                        <span>{msg.timestamp}</span>
                        {isMe && (
                          msg.isOfflinePending ? (
                            <Clock className="w-2.5 h-2.5 text-amber-500 animate-pulse" title="Offline Queue" />
                          ) : (
                            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* AI responding loader */}
            {isAiResponding && (
              <div className="flex items-start gap-2.5 max-w-[75%] self-start animate-bubble">
                <div className="w-7 h-7 rounded-full bg-[#202c33] flex items-center justify-center animate-pulse border border-[#222d34] text-sky-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="bg-[#182229] border border-[#222d34] px-3.5 py-2.5 rounded-xl rounded-tl-none text-xs text-[#8696a0] flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-[#00a884] animate-spin" />
                  <span>Meta AI is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Collapsible WhatsApp Contact Info Side Panel (Right Drawer) */}
          {showContactInfo && (
            <div className="w-80 bg-[#111b21] border-l border-[#222d34] flex flex-col h-full animate-scaleIn select-none shrink-0 z-10 absolute md:static right-0 top-0 shadow-2xl">
              
              {/* Drawer Header */}
              <div className="h-14 px-4 bg-[#202c33] flex items-center justify-between border-b border-[#222d34]/60">
                <span className="text-xs font-bold text-[#e9edef]">Contact info</span>
                <button 
                  onClick={() => setShowContactInfo(false)}
                  className="p-1 rounded-full hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* Large Profile Picture Header */}
                <div className="flex flex-col items-center text-center p-4 bg-[#111b21] rounded-2xl border border-[#222d34]/40 space-y-3">
                  <img
                    src={activeChat.avatar}
                    alt={activeChat.name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-[#00a884] shadow-md shadow-emerald-950/20"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h5 className="text-sm font-bold text-[#e9edef]">{activeChat.name}</h5>
                    <p className="text-[10px] text-[#8696a0] font-mono mt-0.5">
                      {activeChat.isMetaAI ? "meta-ai@connections.io" : activeChat.isGroup ? "Group Chat" : "+1 (555) 019-2834"}
                    </p>
                  </div>
                </div>

                {/* About / Bio Panel */}
                <div className="bg-[#1f2c34]/50 border border-[#222d34]/60 rounded-xl p-3.5 space-y-1.5">
                  <span className="text-[9px] font-mono font-bold text-[#8096a0] uppercase tracking-wider block">About / Status</span>
                  <p className="text-xs text-[#e9edef] font-medium leading-normal">
                    {activeChat.isMetaAI 
                      ? "I am Meta AI, your integrated virtual logic and creative writing assistant powered by Gemini. Ask me about system, feed optimization, or coding." 
                      : activeChat.isGroup 
                        ? "Official Group stream for real-time collaboration. Keep messages constructive!" 
                        : "Hey there! I am using WhatsApp | Connections."}
                  </p>
                  <span className="text-[9px] text-[#8696a0] block pt-1">Updated 2 days ago</span>
                </div>
                
                {/* Chat Actions */}
                <div className="bg-[#1f2c34]/50 border border-[#222d34]/60 rounded-xl p-3.5 space-y-2.5">
                  <span className="text-[9px] font-mono font-bold text-[#8096a0] uppercase tracking-wider block">Chat Settings</span>
                  <button
                    onClick={() => handleToggleArchive(activeChat.id, !activeChat.isArchived)}
                    className="w-full flex items-center justify-between text-left text-xs font-semibold p-2 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] border border-[#222d34] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Archive className="w-3.5 h-3.5 text-[#00a884]" />
                      {activeChat.isArchived ? "Restore from Archive" : "Archive Chat"}
                    </span>
                    <span className="text-[10px] text-[#8696a0] font-mono">{activeChat.isArchived ? "ARCHIVED" : "ACTIVE"}</span>
                  </button>
                </div>

                {/* Secure Encryption details */}
                <div className="bg-[#1f2c34]/30 border border-[#222d34]/40 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-[#00a884]">
                    <Lock className="w-4 h-4" />
                    <span className="text-xs font-bold font-sans">End-to-End Encryption</span>
                  </div>
                  <p className="text-[10px] text-[#8696a0] leading-relaxed">
                    All private media, texts, and voice calls are secured with full state encryption keys. Chat logs reside securely in the cloud or local buffer.
                  </p>
                </div>

                {/* Shared Media Simulation */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-[#8696a0] uppercase tracking-wider block">Media, Links & Docs</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="aspect-square bg-[#202c33] hover:bg-[#2a3942] rounded-lg border border-[#222d34] flex flex-col items-center justify-center text-center cursor-pointer p-1">
                      <ImageIcon className="w-4 h-4 text-emerald-400 mb-1" />
                      <span className="text-[8px] text-[#8696a0] truncate max-w-full">photo.png</span>
                    </div>
                    <div className="aspect-square bg-[#202c33] hover:bg-[#2a3942] rounded-lg border border-[#222d34] flex flex-col items-center justify-center text-center cursor-pointer p-1">
                      <Lock className="w-4 h-4 text-sky-400 mb-1" />
                      <span className="text-[8px] text-[#8696a0] truncate max-w-full">security_key</span>
                    </div>
                    <div className="aspect-square bg-[#202c33] hover:bg-[#2a3942] rounded-lg border border-[#222d34] flex flex-col items-center justify-center text-center cursor-pointer p-1">
                      <Cpu className="w-4 h-4 text-amber-400 mb-1" />
                      <span className="text-[8px] text-[#8696a0] truncate max-w-full">logs_v14</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Text Composer Area */}
        <div className="p-3 bg-[#1f2c34] border-t border-[#222d34]/60 shrink-0 select-none">
          {isRecordingVoice ? (
            <div className="flex items-center justify-between gap-4 py-1.5 px-3 bg-[#2a3942] rounded-xl">
              {/* Left side: Recording Status Indicator */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                <span className="text-xs text-red-400 font-bold tracking-wider font-mono uppercase">REC</span>
                <span className="text-sm font-semibold font-mono text-[#e9edef]">
                  {Math.floor(recordingSeconds / 60)}:{recordingSeconds % 60 < 10 ? '0' : ''}{recordingSeconds % 60}
                </span>
              </div>

              {/* Middle: Visual Waveform Animation */}
              <div className="flex-1 flex justify-center items-center gap-[4px] h-6 px-4">
                {[12, 24, 16, 28, 14, 22, 18, 30, 26, 12, 20, 24, 14, 18, 22, 16, 28, 14].map((h, i) => (
                  <div
                    key={i}
                    className="w-[2.5px] bg-[#00a884] rounded-full animate-bounce"
                    style={{
                      height: `${h}px`,
                      animationDelay: `${i * 0.08}s`,
                      animationDuration: '0.6s'
                    }}
                  />
                ))}
              </div>

              {/* Right side: Actions (Trash vs Send) */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Cancel/Trash Trigger */}
                <button
                  type="button"
                  onClick={cancelVoiceRecording}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-full transition-all focus:outline-none"
                  title="Discard Voice Recording"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>

                {/* Send/Check Trigger */}
                <button
                  type="button"
                  onClick={sendVoiceNote}
                  className="bg-[#00a884] hover:bg-[#008f72] p-2 rounded-full text-[#111b21] shadow-md hover:scale-105 transition-all focus:outline-none flex items-center justify-center"
                  title="Send Voice Note"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              
              {/* Attachment paperclip (Simulated feedback) */}
              <button
                type="button"
                onClick={() => {
                  if (triggerToast) triggerToast("WhatsApp attachment menu: Photos, Docs, Contacts, or Polls can be added! 📎", "info");
                }}
                className="p-2 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] transition-colors"
                title="Add Attachment"
              >
                <Paperclip className="w-4.5 h-4.5" />
              </button>

              {/* Emoji Selector (Simulated feedback) */}
              <button
                type="button"
                onClick={() => {
                  if (triggerToast) triggerToast("Emoticon keyboard toggled! 😊 Choose from system keyboard or search.", "info");
                }}
                className="p-2 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] transition-colors"
                title="Add Emoji"
              >
                <Smile className="w-4.5 h-4.5" />
              </button>

              {/* Chat Input Bar */}
              <input
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                placeholder={
                  activeChat.isMetaAI 
                    ? "Ask Meta AI anything... (or ask about settings & network)" 
                    : "Type a message..."
                }
                className="flex-1 bg-[#2a3942] border border-transparent text-sm text-[#e9edef] placeholder-[#8696a0] rounded-lg py-2 px-4 focus:outline-none focus:bg-[#374955] transition-colors"
              />
              
              {/* Preserved Voice Input Button with WhatsApp styling */}
              <VoiceInputButton
                onTranscriptComplete={(text) => {
                  setTypedMessage(prev => {
                    const separator = prev && !prev.endsWith(" ") ? " " : "";
                    return prev + separator + text;
                  });
                  if (triggerToast) {
                    triggerToast("Speech recognized and polished with AI! ✨", "success");
                  }
                }}
                className="p-0.5"
              />

              {/* WhatsApp classic green send trigger / Mic Trigger for Recording */}
              {!typedMessage.trim() ? (
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  id="btn-voice-record-start"
                  className="bg-[#00a884] hover:bg-[#008f72] p-2.5 rounded-full text-[#111b21] shadow-lg hover:scale-105 transition-all focus:outline-none flex items-center justify-center shrink-0"
                  title="Record Voice Note"
                >
                  <Mic className="w-4.5 h-4.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!typedMessage.trim() || isAiResponding}
                  id="btn-chat-send"
                  className="bg-[#00a884] hover:bg-[#008f72] disabled:opacity-40 p-2.5 rounded-full text-[#111b21] shadow-lg transition-all focus:outline-none flex items-center justify-center shrink-0"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
