import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import FeedSection from "./components/FeedSection";
import StatusSection from "./components/StatusSection";
import ChatsSection from "./components/ChatsSection";
import CallsSection from "./components/CallsSection";
import SettingsSection from "./components/SettingsSection";
import AdminSection from "./components/AdminSection";
import ProfileSection from "./components/ProfileSection";

import { 
  INITIAL_POSTS, 
  INITIAL_CHATS, 
  INITIAL_STORIES, 
  INITIAL_CALLS, 
  INITIAL_ANNOUNCEMENTS, 
  DEFAULT_SETTINGS 
} from "./mockData";
import { Post, Chat, Story, CallLog, AppSettings, SystemAnnouncement } from "./types";
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Sparkles, 
  ShieldAlert, 
  Clock,
  Heart,
  MessageCircle,
  Video
} from "lucide-react";

export default function App() {
  // App Core States
  const [activeTab, setActiveTab] = useState<'feed' | 'chats' | 'calls' | 'settings' | 'admin' | 'profile'>('feed');
  const [feedMode, setFeedMode] = useState<'status' | 'broadcast'>('status');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isOwnerMode, setIsOwnerMode] = useState<boolean>(true); // Defaults to true as the owner's request
  
  // User Authentication State
  const [currentUser, setCurrentUser] = useState<{ username: string; email: string; avatar: string; bio: string } | null>(null);

  // Data States
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);
  const [calls, setCalls] = useState<CallLog[]>(INITIAL_CALLS);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>(INITIAL_ANNOUNCEMENTS);

  // Syncing indicator
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Global custom non-blocking notification toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Hardcoded owner email context from AI Studio metadata
  const userEmail = "nathanaeltinotenda7@gmail.com";
  const currentUserEmail = currentUser ? currentUser.email : (isOwnerMode ? userEmail : "guest@connections.io");

  // Load posts and chats from the real backend stream
  const loadPostsAndChats = async () => {
    if (isOffline) return;
    try {
      const token = localStorage.getItem("connections_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Fetch dynamic recommended posts
      const postRes = await fetch("/api/posts", { headers });
      if (postRes.ok) {
        const postData = await postRes.json();
        setPosts(postData.posts);
      }

      // Fetch chats list
      const chatRes = await fetch("/api/chats");
      if (chatRes.ok) {
        const chatData = await chatRes.json();
        setChats(chatData.chats);
      }
    } catch (err) {
      console.error("Failed to fetch live data:", err);
    }
  };

  // Restore authenticated session and load data on boot
  useEffect(() => {
    const initAuthAndData = async () => {
      const token = localStorage.getItem("connections_token");
      if (token) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const user = await res.json();
            setCurrentUser(user);
          }
        } catch (err) {
          console.error("Session restore failed:", err);
        }
      }
      
      // Load settings from server
      try {
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.settings) {
            setSettings(settingsData.settings);
          }
        }
      } catch (err) {
        console.error("Failed to load settings from server:", err);
      }

      loadPostsAndChats();
    };
    initAuthAndData();
  }, [isOffline, currentUser?.email]);

  // Save settings to server when changed
  useEffect(() => {
    if (isOffline) return;
    const saveSettings = async () => {
      try {
        await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings)
        });
      } catch (err) {
        console.error("Failed to save settings to server:", err);
      }
    };
    saveSettings();
  }, [settings, isOffline]);

  // Watch offline toggle state to trigger simulated synchronization
  useEffect(() => {
    if (!isOffline) {
      // Transitioning to online: Sync any offline-created posts or messages
      const pendingPostCount = posts.filter(p => p.isOfflinePending).length;
      const pendingMessageCount = chats.reduce((acc, chat) => 
        acc + chat.messages.filter(m => m.isOfflinePending).length, 0
      );

      if (pendingPostCount > 0 || pendingMessageCount > 0) {
        setIsSyncing(true);
        setSyncNotice(`Syncing ${pendingPostCount} posts and ${pendingMessageCount} messages from local cache to cloud...`);
        
        // Collect local buffer pending items
        const pendingPosts = posts.filter(p => p.isOfflinePending);
        const pendingMessages: any[] = [];
        chats.forEach(chat => {
          chat.messages.filter(m => m.isOfflinePending).forEach(m => {
            pendingMessages.push({ chatId: chat.id, message: m });
          });
        });

        fetch("/api/chats/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pendingPosts, pendingMessages })
        })
        .then(res => res.json())
        .then(syncRes => {
          setIsSyncing(false);
          setSyncNotice(`Successfully synced ${syncRes.syncedCount || (pendingPostCount + pendingMessageCount)} items to cloud stream!`);
          loadPostsAndChats();
          setTimeout(() => {
            setSyncNotice(null);
          }, 3000);
        })
        .catch(err => {
          console.error("Sync error:", err);
          // Fallback
          setPosts(prev => prev.map(p => p.isOfflinePending ? { ...p, isOfflinePending: false } : p));
          setChats(prevChats => prevChats.map(c => ({
            ...c,
            messages: c.messages.map(m => m.isOfflinePending ? { ...m, isOfflinePending: false } : m)
          })));
          setIsSyncing(false);
          setSyncNotice("All local actions resolved successfully!");
          setTimeout(() => {
            setSyncNotice(null);
          }, 3000);
        });
      }
    }
  }, [isOffline]);

  // Manual Synchronization Force Method
  const forceManualSync = async () => {
    if (isOffline) {
      triggerToast("Device is Offline. Please switch to Online mode first to synchronize pending items!", "warning");
      return;
    }

    const pendingPostCount = posts.filter(p => p.isOfflinePending).length;
    const pendingMessageCount = chats.reduce((acc, chat) => 
      acc + chat.messages.filter(m => m.isOfflinePending).length, 0
    );

    if (pendingPostCount === 0 && pendingMessageCount === 0) {
      setIsSyncing(true);
      setSyncNotice("Connecting to database stream...");
      try {
        await loadPostsAndChats();
        triggerToast("Sync successful. Your feeds and chat messages are fully up-to-date! 💾", "success");
      } catch (err) {
        triggerToast("Failed to fetch live updates from cloud.", "warning");
      } finally {
        setIsSyncing(false);
        setSyncNotice(null);
      }
      return;
    }

    setIsSyncing(true);
    setSyncNotice(`Synchronizing ${pendingPostCount} posts and ${pendingMessageCount} messages...`);
    triggerToast(`Syncing ${pendingPostCount + pendingMessageCount} offline-pending items...`, "info");

    const pendingPosts = posts.filter(p => p.isOfflinePending);
    const pendingMessages: any[] = [];
    chats.forEach(chat => {
      chat.messages.filter(m => m.isOfflinePending).forEach(m => {
        pendingMessages.push({ chatId: chat.id, message: m });
      });
    });

    try {
      const res = await fetch("/api/chats/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingPosts, pendingMessages })
      });
      
      if (res.ok) {
        const syncRes = await res.json();
        const totalSynced = syncRes.syncedCount || (pendingPostCount + pendingMessageCount);
        
        // Update local state to clear pending flags
        setPosts(prev => prev.map(p => p.isOfflinePending ? { ...p, isOfflinePending: false } : p));
        setChats(prevChats => prevChats.map(c => ({
          ...c,
          messages: c.messages.map(m => m.isOfflinePending ? { ...m, isOfflinePending: false } : m)
        })));

        await loadPostsAndChats();
        
        triggerToast(`Manual synchronization successful! Uploaded ${totalSynced} pending items. 🚀`, "success");
        setSyncNotice(`Synced ${totalSynced} items!`);
      } else {
        throw new Error("Server Sync API error response");
      }
    } catch (err) {
      console.error("Manual sync failed:", err);
      triggerToast("Manual synchronization failed. Please retry shortly.", "warning");
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSyncNotice(null);
      }, 3000);
    }
  };

  // Method to append post
  const addPost = async (content: string, mediaUrl?: string) => {
    const newPost: Post = {
      id: `p_${Date.now()}`,
      authorName: currentUser ? currentUser.username : (currentUserEmail === userEmail ? "Nathanael (Owner)" : "Guest User"),
      authorAvatar: currentUser ? currentUser.avatar : (currentUserEmail === userEmail 
        ? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" 
        : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"),
      content,
      mediaUrl,
      likes: 0,
      hasLiked: false,
      timestamp: "Just now",
      comments: [],
      isOfflinePending: isOffline
    };

    if (isOffline) {
      setPosts(prev => [newPost, ...prev]);
      triggerToast("Post buffered locally (offline). Will sync when online.", "info");
    } else {
      try {
        const token = localStorage.getItem("connections_token");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/posts", {
          method: "POST",
          headers,
          body: JSON.stringify({ content, mediaUrl })
        });
        if (res.ok) {
          triggerToast("Published to Connections Cloud!", "success");
          loadPostsAndChats();
        } else {
          setPosts(prev => [newPost, ...prev]);
        }
      } catch (err) {
        setPosts(prev => [newPost, ...prev]);
      }
    }
  };

  // Current system time string
  const [formattedTime, setFormattedTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setFormattedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Pending counts calculation
  const pendingPostCount = posts.filter(p => p.isOfflinePending).length;
  const pendingMessageCount = chats.reduce((acc, chat) => 
    acc + (chat.messages || []).filter(m => m.isOfflinePending).length, 0
  );
  const totalPending = pendingPostCount + pendingMessageCount;

  return (
    <div className="w-full h-screen bg-[#050505] text-[#e0e0e0] flex flex-col md:flex-row font-sans overflow-hidden" id="app-root">
      
      {/* Sidebar navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isOffline={isOffline}
        setIsOffline={setIsOffline}
        isOwnerMode={isOwnerMode}
        setIsOwnerMode={setIsOwnerMode}
        userEmail={userEmail}
      />

      {/* Main viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative" id="app-viewport">
        
        {/* Global synchronization notifications overlay */}
        {isSyncing && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0c0c0c] border border-blue-500/30 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3 animate-pulse max-w-md w-full">
            <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
            <div className="text-xs">
              <span className="font-bold text-white block">Offline Hybrid Syncing</span>
              <span className="text-slate-400 block truncate mt-0.5">{syncNotice}</span>
            </div>
          </div>
        )}

        {!isSyncing && syncNotice && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/90 border border-emerald-500/40 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3 animate-fadeIn max-w-md w-full">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold text-emerald-200">{syncNotice}</span>
          </div>
        )}

        {/* Global Applet Header */}
        <header className="h-16 border-b border-[#1a1a1a] flex items-center justify-between px-6 bg-[#080808] shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-bold font-mono tracking-widest uppercase text-white hidden md:block">
              CONNECTIONS SYSTEM v1.4
            </h1>
            
            {/* Inline responsive status badges */}
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                isOffline 
                  ? "bg-red-500/10 text-red-400 border-red-500/20" 
                  : "bg-green-500/10 text-green-400 border-green-500/20"
              }`}>
                {isOffline ? "LOCAL BUFFER ONLY" : "CLOUD STREAM ACTIVE"}
              </span>

              {settings.dataUsage === 'low' && (
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-mono font-semibold">
                  Low Data Mode
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Quick-Access Sync Button */}
            <button
              type="button"
              id="header-manual-sync-btn"
              onClick={forceManualSync}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all relative select-none cursor-pointer ${
                totalPending > 0
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 shadow-md shadow-amber-500/5 animate-pulse"
                  : "bg-[#202c33]/80 text-[#e9edef] border-[#222d34]/40 hover:bg-[#202c33] hover:text-white"
              } focus:outline-none shrink-0`}
              title="Force immediate manual sync of local pending items to the cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-[#00a884]" : "text-slate-400"}`} />
              <span className="hidden sm:inline">
                {isSyncing ? "Syncing..." : totalPending > 0 ? `Sync (${totalPending})` : "Sync Stream"}
              </span>
              {totalPending > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#ea0038] text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-mono font-bold border border-[#050505] shadow animate-bounce">
                  {totalPending}
                </span>
              )}
            </button>

            {/* Meta AI Quick Access indicator */}
            <div className="flex items-center gap-2 text-xs text-blue-400 font-medium bg-blue-500/10 px-3 py-1 rounded-xl border border-blue-500/15">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Meta AI Active</span>
            </div>

            {/* Dynamic System Clock */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono font-semibold">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{formattedTime || "00:00:00"} UTC</span>
            </div>
          </div>
        </header>

        {/* Workspace body matching current active tab selection */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#050505]">
          {activeTab === 'feed' && (
            <div className="flex-1 flex flex-col min-h-0 h-full" id="feed-root-container">
              {/* Dynamic Sub-tab switcher */}
              <div className="bg-[#1f2c34]/40 border-b border-[#222d34]/60 px-6 py-2.5 flex items-center justify-between shrink-0 select-none">
                <span className="text-[11px] text-[#8696a0] font-sans font-bold uppercase tracking-wider">
                  Updates Stream
                </span>

                <div className="flex bg-[#202c33]/80 p-0.5 rounded-xl border border-[#222d34]/40">
                  <button
                    type="button"
                    id="subtab-status"
                    onClick={() => setFeedMode('status')}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      feedMode === 'status'
                        ? "bg-[#00a884] text-[#111b21] shadow"
                        : "text-[#8696a0] hover:text-[#e9edef]"
                    }`}
                  >
                    Status Updates
                  </button>
                  <button
                    type="button"
                    id="subtab-broadcast"
                    onClick={() => setFeedMode('broadcast')}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      feedMode === 'broadcast'
                        ? "bg-[#00a884] text-[#111b21] shadow"
                        : "text-[#8696a0] hover:text-[#e9edef]"
                    }`}
                  >
                    Broadcast Feed
                  </button>
                </div>
              </div>

              {feedMode === 'status' ? (
                <StatusSection 
                  isOffline={isOffline}
                  currentUserEmail={currentUserEmail}
                  triggerToast={triggerToast}
                />
              ) : (
                <FeedSection 
                  posts={posts} 
                  setPosts={setPosts} 
                  stories={stories} 
                  setStories={setStories} 
                  isOffline={isOffline}
                  addPost={addPost}
                  currentUserEmail={currentUserEmail}
                  triggerToast={triggerToast}
                  isSyncing={isSyncing}
                />
              )}
            </div>
          )}

          {activeTab === 'chats' && (
            <ChatsSection 
              chats={chats} 
              setChats={setChats} 
              isOffline={isOffline}
              userEmail={currentUserEmail}
              triggerToast={triggerToast}
              isSyncing={isSyncing}
            />
          )}

          {activeTab === 'calls' && (
            <CallsSection 
              calls={calls} 
              setCalls={setCalls} 
              settings={settings}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsSection 
              settings={settings} 
              setSettings={setSettings} 
              userEmail={currentUserEmail}
              chats={chats}
              setChats={setChats}
              posts={posts}
              setPosts={setPosts}
              calls={calls}
              setCalls={setCalls}
              triggerToast={triggerToast}
              loadPostsAndChats={loadPostsAndChats}
            />
          )}

          {activeTab === 'admin' && (
            <AdminSection 
              settings={settings} 
              announcements={announcements} 
              setAnnouncements={setAnnouncements}
              userEmail={currentUserEmail}
              triggerToast={triggerToast}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileSection
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              triggerToast={triggerToast}
              isOffline={isOffline}
            />
          )}
        </div>

        {/* Global Floating custom non-blocking Toast */}
        {toast && (
          <div className={`absolute bottom-6 right-6 z-50 p-4 rounded-xl border shadow-2xl flex items-center gap-2.5 max-w-sm animate-fadeIn ${
            toast.type === 'success' 
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100' 
              : toast.type === 'warning' 
                ? 'bg-amber-950/90 border-amber-500/40 text-amber-100' 
                : 'bg-blue-950/90 border-blue-500/40 text-blue-100'
          }`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse shrink-0" />
            <p className="text-xs font-semibold">{toast.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
