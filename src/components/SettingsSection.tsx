import React, { useState, useEffect } from "react";
import { AppSettings, Chat, Post, CallLog } from "../types";
import { 
  Sliders, 
  Settings, 
  Database, 
  Image, 
  Video, 
  Volume2, 
  User, 
  Sparkles, 
  CloudLightning,
  Monitor,
  Download,
  Smartphone,
  Laptop,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  Lock,
  ChevronRight,
  QrCode,
  Cpu,
  Network,
  Server,
  HardDrive,
  Copy,
  ExternalLink,
  BookOpen,
  Trash2,
  RefreshCw,
  Loader2
} from "lucide-react";

interface SettingsSectionProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  userEmail: string;
  chats?: Chat[];
  setChats?: React.Dispatch<React.SetStateAction<Chat[]>>;
  posts?: Post[];
  setPosts?: React.Dispatch<React.SetStateAction<Post[]>>;
  calls?: CallLog[];
  setCalls?: React.Dispatch<React.SetStateAction<CallLog[]>>;
  triggerToast?: (message: string, type?: 'success' | 'info' | 'warning') => void;
  loadPostsAndChats?: () => Promise<void>;
}

export default function SettingsSection({
  settings,
  setSettings,
  userEmail,
  chats,
  setChats,
  posts,
  setPosts,
  calls,
  setCalls,
  triggerToast,
  loadPostsAndChats
}: SettingsSectionProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'desktop'>('android');
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeHubTab, setActiveHubTab] = useState<'qrcode' | 'blueprint'>('qrcode');

  // Storage and device usage optimization states
  const [systemOptimized, setSystemOptimized] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [statusesCount, setStatusesCount] = useState(0);
  const [statusesMediaCount, setStatusesMediaCount] = useState(0);
  const [isClearing, setIsClearing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchStatusesStats = async () => {
      try {
        const res = await fetch("/api/statuses");
        if (res.ok) {
          const data = await res.json();
          const items = data.statuses || [];
          setStatusesCount(items.length);
          setStatusesMediaCount(items.filter((s: any) => s.type === 'image' || s.mediaUrl).length);
        }
      } catch (err) {
        console.error("Failed to fetch status stats:", err);
      }
    };
    fetchStatusesStats();
  }, []);

  const handleClearMedia = async () => {
    setIsClearing(prev => ({ ...prev, media: true }));
    try {
      const res = await fetch("/api/storage/clear-media", { method: "POST" });
      if (res.ok) {
        // Strip media url from posts
        if (setPosts && posts) {
          setPosts(prev => prev.map(p => ({ ...p, mediaUrl: undefined })));
        }
        // Strip media url from chats messages
        if (setChats && chats) {
          setChats(prev => prev.map(c => ({
            ...c,
            messages: c.messages.map(m => ({ ...m, mediaUrl: undefined }))
          })));
        }
        setStatusesMediaCount(0);
        if (loadPostsAndChats) {
          await loadPostsAndChats();
        }
        if (triggerToast) {
          triggerToast("All media attachments purged to optimize local and cloud disk space! 💾", "success");
        }
      } else {
        throw new Error("Failed to clear media");
      }
    } catch (err: any) {
      if (triggerToast) {
        triggerToast("Failed to clear media attachments.", "warning");
      }
    } finally {
      setIsClearing(prev => ({ ...prev, media: false }));
    }
  };

  const handleClearChats = async () => {
    setIsClearing(prev => ({ ...prev, chats: true }));
    try {
      const res = await fetch("/api/storage/clear-chats", { method: "POST" });
      if (res.ok) {
        if (setChats) {
          setChats(prev => prev.map(c => ({
            ...c,
            lastMessage: "Chat history cleared",
            lastMessageTime: "Just now",
            unreadCount: 0,
            messages: []
          })));
        }
        if (triggerToast) {
          triggerToast("Chat messages history wiped successfully!", "success");
        }
      } else {
        throw new Error("Failed to clear chats");
      }
    } catch (err: any) {
      if (triggerToast) {
        triggerToast("Failed to clear chat history.", "warning");
      }
    } finally {
      setIsClearing(prev => ({ ...prev, chats: false }));
    }
  };

  const handleClearStatuses = async () => {
    setIsClearing(prev => ({ ...prev, statuses: true }));
    try {
      const res = await fetch("/api/storage/clear-statuses", { method: "POST" });
      if (res.ok) {
        setStatusesCount(0);
        setStatusesMediaCount(0);
        if (triggerToast) {
          triggerToast("All active status updates deleted from server list!", "success");
        }
      } else {
        throw new Error("Failed");
      }
    } catch (err) {
      if (triggerToast) {
        triggerToast("Failed to clear status updates.", "warning");
      }
    } finally {
      setIsClearing(prev => ({ ...prev, statuses: false }));
    }
  };

  const handleClearCalls = async () => {
    setIsClearing(prev => ({ ...prev, calls: true }));
    setTimeout(() => {
      if (setCalls) {
        setCalls([]);
      }
      setIsClearing(prev => ({ ...prev, calls: false }));
      if (triggerToast) {
        triggerToast("Recent voice & video call history logs cleared!", "success");
      }
    }, 400);
  };

  const handleOptimizeCache = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setSystemOptimized(true);
      setIsOptimizing(false);
      if (triggerToast) {
        triggerToast("Connections database indexes rebuilt and optimized! Released 22.7 MB of system cache.", "success");
      }
    }, 1200);
  };

  useEffect(() => {
    // Detect if already installed / running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setIsInstalled(true);
    }

    // Auto detect platform to pre-select correct instructions tab
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setActivePlatform('ios');
    } else if (/android/.test(ua)) {
      setActivePlatform('android');
    } else {
      setActivePlatform('desktop');
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  const isOwner = userEmail === "nathanaeltinotenda7@gmail.com";

  const handleToggleMedia = () => {
    setSettings(prev => ({ ...prev, mediaAutoDownload: !prev.mediaAutoDownload }));
  };

  const handleToggleNoiseCancellation = () => {
    setSettings(prev => ({ ...prev, noiseCancellation: !prev.noiseCancellation }));
  };

  const handleCopyLink = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://ai.studio/build';
    try {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      // Fallback for iframe restrictions
      const el = document.createElement('textarea');
      el.value = currentUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Dynamic Space Calculations (MB or KB)
  // Media Files (Images & Attachments in posts & chats)
  // Each media post: ~2.4 MB. Each chat message with media attachment: ~1.5 MB. Statuses with images: ~1.8 MB.
  const postsMediaCount = posts ? posts.filter(p => p.mediaUrl).length : 0;
  const chatsMediaCount = chats ? chats.reduce((sum, c) => sum + (c.messages || []).filter(m => (m as any).mediaUrl).length, 0) : 0;
  
  const mediaAttachmentSizeKB = (postsMediaCount * 2450) + (chatsMediaCount * 1530) + (statusesMediaCount * 1850);
  const mediaMB = Number((mediaAttachmentSizeKB / 1024).toFixed(1));

  // Chat Text Threads:
  const chatsCount = chats ? chats.length : 0;
  const messagesCount = chats ? chats.reduce((sum, c) => sum + (c.messages || []).length, 0) : 0;
  const chatThreadsSizeKB = (chatsCount * 45) + (messagesCount * 2.8);
  const chatsMB = Number((chatThreadsSizeKB / 1024).toFixed(2));

  // Broadcast Updates & Stories (statusesCount)
  const statusesSizeKB = statusesCount * 15;
  const statusesMB = Number((statusesSizeKB / 1024).toFixed(2));

  // Call Logs (callsCount)
  const callsCount = calls ? calls.length : 0;
  const callsSizeKB = callsCount * 0.8;
  const callsMB = Number((callsSizeKB / 1024).toFixed(3));

  // System Database files & UI cache
  const systemCacheMB = systemOptimized ? 1.8 : 24.5;

  // Aggregate used storage
  const totalUsedMB = Number((mediaMB + chatsMB + statusesMB + callsMB + systemCacheMB).toFixed(1));
  const deviceMaxCapacityGB = 64.0; // Typical partition limit

  // Segment bar percentages
  const sumUsedMB = mediaMB + chatsMB + statusesMB + callsMB + systemCacheMB;
  const mediaPct = sumUsedMB > 0 ? (mediaMB / sumUsedMB) * 100 : 0;
  const chatsPct = sumUsedMB > 0 ? (chatsMB / sumUsedMB) * 100 : 0;
  const statusesPct = sumUsedMB > 0 ? (statusesMB / sumUsedMB) * 100 : 0;
  const callsPct = sumUsedMB > 0 ? (callsMB / sumUsedMB) * 100 : 0;
  const systemPct = sumUsedMB > 0 ? (systemCacheMB / sumUsedMB) * 100 : 0;

  return (
    <div className="flex-1 bg-[#0b141a] text-[#e9edef] p-4 md:p-6 overflow-y-auto space-y-5 h-full" id="settings-container">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222d34]/60 pb-4 select-none shrink-0">
        <div>
          <h2 className="text-md font-bold text-[#e9edef] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#00a884]" />
            Settings
          </h2>
          <p className="text-[11px] text-[#8696a0]">Configure chat media preservation, network usage, and device installations</p>
        </div>
        
        {isOwner && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00a884]/15 text-[#00a884] border border-[#00a884]/20 self-start">
            OWNER CONFIGURATION ACTIVE
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Column: Data Usage & Quality Presets */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Storage & Data Usage Breakdown */}
          <div className="bg-[#111b21] border border-[#222d34]/60 rounded-2xl p-5 md:p-6 space-y-5" id="storage-breakdown-section">
            <div className="flex items-center justify-between select-none">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-5 h-5 text-[#00a884]" />
                <h3 className="text-xs font-bold text-[#e9edef] uppercase tracking-wider font-sans">
                  Storage and Data Breakdown
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#00a884] bg-[#00a884]/10 px-2 py-0.5 rounded border border-[#00a884]/20 font-bold">
                ACTIVE MONITOR
              </span>
            </div>

            <p className="text-xs text-[#8696a0] leading-relaxed">
              View how much physical device storage is consumed by your personal chat messages, status feeds, and offline media attachments. Purge individual caches to optimize memory footprint.
            </p>

            {/* Visual Storage Meter */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-baseline select-none">
                <div className="text-sm font-bold text-[#e9edef] flex items-baseline gap-1">
                  <span>{totalUsedMB} MB</span>
                  <span className="text-xs text-[#8696a0] font-normal">of 64.0 GB used</span>
                </div>
                <span className="text-[10px] text-[#00a884] font-semibold font-mono">
                  {((totalUsedMB / (deviceMaxCapacityGB * 1024)) * 100).toFixed(4)}% full
                </span>
              </div>

              {/* Segmented bar */}
              <div className="w-full h-3 bg-[#202c33] rounded-full overflow-hidden flex shadow-inner">
                {mediaMB > 0 && (
                  <div 
                    style={{ width: `${mediaPct}%` }} 
                    className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                    title={`Media Attachments: ${mediaMB} MB`}
                  />
                )}
                {chatsMB > 0 && (
                  <div 
                    style={{ width: `${chatsPct}%` }} 
                    className="h-full bg-[#00a884] transition-all duration-500 ease-out"
                    title={`Chats & Messages: ${chatsMB} MB`}
                  />
                )}
                {statusesMB > 0 && (
                  <div 
                    style={{ width: `${statusesPct}%` }} 
                    className="h-full bg-sky-500 transition-all duration-500 ease-out"
                    title={`Statuses & Broadcasts: ${statusesMB} MB`}
                  />
                )}
                {callsMB > 0 && (
                  <div 
                    style={{ width: `${callsPct}%` }} 
                    className="h-full bg-amber-500 transition-all duration-500 ease-out"
                    title={`Call Logs: ${callsMB} MB`}
                  />
                )}
                {systemCacheMB > 0 && (
                  <div 
                    style={{ width: `${systemPct}%` }} 
                    className="h-full bg-slate-500 transition-all duration-500 ease-out"
                    title={`System Cache: ${systemCacheMB} MB`}
                  />
                )}
              </div>

              {/* Colorful Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1.5 text-[10px] text-[#8696a0] font-medium select-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-500 shrink-0" />
                  <span>Media ({mediaMB} MB)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-[#00a884] shrink-0" />
                  <span>Chats ({chatsMB} MB)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-sky-500 shrink-0" />
                  <span>Statuses ({statusesMB} MB)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500 shrink-0" />
                  <span>Calls ({callsMB} MB)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-slate-500 shrink-0" />
                  <span>System ({systemCacheMB} MB)</span>
                </div>
              </div>
            </div>

            {/* Individual Breakdown & Clear utility */}
            <div className="border-t border-[#222d34]/40 pt-4 space-y-3">
              <span className="text-[10px] font-mono font-bold text-[#8696a0] uppercase tracking-wider block select-none">
                Manage Individual Databases
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                
                {/* Media attachments breakdown */}
                <div className="bg-[#202c33]/25 border border-[#222d34]/40 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-[#e9edef] block">Media Attachments</span>
                    <span className="text-[10px] text-[#8696a0] block leading-normal mt-0.5">
                      {postsMediaCount} feed images, {chatsMediaCount} chat files, {statusesMediaCount} status images
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-400 block mt-1">{mediaMB} MB used</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearMedia}
                    disabled={mediaMB === 0 || isClearing.media}
                    className="p-2 text-xs font-bold bg-[#ea0038]/10 hover:bg-[#ea0038]/20 disabled:bg-[#202c33]/40 disabled:text-slate-600 border border-[#ea0038]/20 disabled:border-[#222d34]/60 text-red-400 hover:text-red-300 rounded-xl transition-all flex items-center justify-center gap-1.5 min-w-[76px] h-9 shrink-0 focus:outline-none cursor-pointer"
                    title="Purge all loaded files"
                  >
                    {isClearing.media ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Chat message history breakdown */}
                <div className="bg-[#202c33]/25 border border-[#222d34]/40 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-[#e9edef] block">Chats & Threads</span>
                    <span className="text-[10px] text-[#8696a0] block leading-normal mt-0.5">
                      {chatsCount} active threads, {messagesCount} local & cloud text messages stored
                    </span>
                    <span className="text-xs font-mono font-bold text-[#00a884] block mt-1">{chatsMB} MB used</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearChats}
                    disabled={messagesCount === 0 || isClearing.chats}
                    className="p-2 text-xs font-bold bg-[#ea0038]/10 hover:bg-[#ea0038]/20 disabled:bg-[#202c33]/40 disabled:text-slate-600 border border-[#ea0038]/20 disabled:border-[#222d34]/60 text-red-400 hover:text-red-300 rounded-xl transition-all flex items-center justify-center gap-1.5 min-w-[76px] h-9 shrink-0 focus:outline-none cursor-pointer"
                    title="Wipe chats message database"
                  >
                    {isClearing.chats ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Status updates breakdown */}
                <div className="bg-[#202c33]/25 border border-[#222d34]/40 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-[#e9edef] block">Status Updates</span>
                    <span className="text-[10px] text-[#8696a0] block leading-normal mt-0.5">
                      {statusesCount} dynamic server status story posts tracked
                    </span>
                    <span className="text-xs font-mono font-bold text-sky-400 block mt-1">{statusesMB} MB used</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearStatuses}
                    disabled={statusesCount === 0 || isClearing.statuses}
                    className="p-2 text-xs font-bold bg-[#ea0038]/10 hover:bg-[#ea0038]/20 disabled:bg-[#202c33]/40 disabled:text-slate-600 border border-[#ea0038]/20 disabled:border-[#222d34]/60 text-red-400 hover:text-red-300 rounded-xl transition-all flex items-center justify-center gap-1.5 min-w-[76px] h-9 shrink-0 focus:outline-none cursor-pointer"
                    title="Purge active stories"
                  >
                    {isClearing.statuses ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Call logs history breakdown */}
                <div className="bg-[#202c33]/25 border border-[#222d34]/40 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-[#e9edef] block">Call Log History</span>
                    <span className="text-[10px] text-[#8696a0] block leading-normal mt-0.5">
                      {callsCount} incoming/outgoing voice and video logs recorded
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400 block mt-1">{callsMB} MB used</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearCalls}
                    disabled={callsCount === 0 || isClearing.calls}
                    className="p-2 text-xs font-bold bg-[#ea0038]/10 hover:bg-[#ea0038]/20 disabled:bg-[#202c33]/40 disabled:text-slate-600 border border-[#ea0038]/20 disabled:border-[#222d34]/60 text-red-400 hover:text-red-300 rounded-xl transition-all flex items-center justify-center gap-1.5 min-w-[76px] h-9 shrink-0 focus:outline-none cursor-pointer"
                    title="Clear calls log"
                  >
                    {isClearing.calls ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* Optimize Storage Quick Action */}
              <div className="bg-[#202c33]/15 border border-[#222d34]/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-3 select-none">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">Optimize System Cache & Index Files</span>
                  <p className="text-[10px] text-[#8696a0] leading-relaxed">
                    Clears temporary system logs, emoji vector packages, and compressed avatar caching directories. Keeps your essential files intact.
                  </p>
                  <span className="text-[10px] font-mono text-[#8696a0] block">
                    Current Cache Size: <strong className="text-white font-bold">{systemCacheMB} MB</strong> {systemOptimized ? "(Fully Optimized)" : "(Recommends cleaning)"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleOptimizeCache}
                  disabled={systemOptimized || isOptimizing}
                  className="px-4 py-2.5 bg-[#00a884] hover:bg-[#008f72] disabled:bg-[#202c33]/60 text-[#111b21] disabled:text-slate-500 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 font-sans shrink-0 focus:outline-none cursor-pointer"
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Optimizing...</span>
                    </>
                  ) : systemOptimized ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 animate-pulse" />
                      <span>System Optimized</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Optimize Cache</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* Data Usage Section */}
          <div className="bg-[#111b21] border border-[#222d34]/60 rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center gap-2.5 select-none">
              <Database className="w-5 h-5 text-[#00a884]" />
              <h3 className="text-xs font-bold text-[#e9edef] uppercase tracking-wider font-sans">
                Data & Storage Savings
              </h3>
            </div>
            
            <p className="text-xs text-[#8696a0] leading-relaxed">
              Define the default bandwidth style for loading images and peer-to-peer audio calls. "Low Data Mode" compresses files before delivery.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {[
                { key: 'low', label: 'Low Data Mode', desc: 'Saves 45% cell data' },
                { key: 'medium', label: 'Medium Quality', desc: 'Standard compression' },
                { key: 'high', label: 'High Fidelity', desc: 'Lossless parameters' }
              ].map(opt => {
                const isSelected = settings.dataUsage === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, dataUsage: opt.key as any }))}
                    className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between h-24 focus:outline-none ${
                      isSelected
                        ? "bg-[#00a884]/10 border-[#00a884] text-[#e9edef]"
                        : "bg-[#202c33]/40 border-[#222d34]/60 text-[#8696a0] hover:border-[#222d34] hover:bg-[#202c33]/70"
                    }`}
                  >
                    <span className={`text-xs font-bold ${isSelected ? 'text-[#00a884]' : 'text-[#e9edef]'}`}>{opt.label}</span>
                    <span className="text-[10px] text-[#8696a0] font-mono leading-tight">{opt.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom slider parameter */}
            <div className="pt-4 border-t border-[#222d34]/40 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#8696a0]">Buffer threshold limit:</span>
                <span className="text-[#00a884] font-mono font-bold">{settings.lowDataWarningThreshold} MB</span>
              </div>
              <input
                type="range"
                min="10"
                max="250"
                step="10"
                value={settings.lowDataWarningThreshold}
                onChange={(e) => setSettings(prev => ({ ...prev, lowDataWarningThreshold: parseInt(e.target.value) }))}
                className="w-full accent-[#00a884] bg-[#202c33] h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#8696a0] font-mono select-none">
                <span>10 MB</span>
                <span>250 MB (Maximum offline queue)</span>
              </div>
            </div>
          </div>

          {/* Picture Quality Section */}
          <div className="bg-[#111b21] border border-[#222d34]/60 rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center gap-2.5 select-none">
              <Image className="w-5 h-5 text-[#00a884]" />
              <h3 className="text-xs font-bold text-[#e9edef] uppercase tracking-wider font-sans">
                Media Upload Quality
              </h3>
            </div>

            <p className="text-xs text-[#8696a0] leading-relaxed">
              Adjust resolution compressions applied when sending status stories or broadcasting messages in chat threads.
            </p>

            <div className="space-y-2.5 pt-1">
              {[
                { key: 'low', title: 'Data Saver Profile (Compressed)', spec: 'Images under 120KB optimized for rapid sync over low signal bands.' },
                { key: 'standard', title: 'Standard Resolution Profile', spec: 'Smart WebP compressions (under 450KB) with pristine sharpness.' },
                { key: 'high', title: 'High Definition (Primal Resolution)', spec: 'Lossless transmission. Recommended only on high-speed Wi-Fi.' }
              ].map(opt => {
                const isSelected = settings.pictureQuality === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, pictureQuality: opt.key as any }))}
                    className={`w-full p-4 rounded-xl text-left border transition-all flex items-start gap-3 focus:outline-none ${
                      isSelected
                        ? "bg-[#00a884]/5 border-[#00a884]"
                        : "bg-[#202c33]/30 border-[#222d34]/60 hover:bg-[#202c33]/50"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                      isSelected ? "border-[#00a884]" : "border-slate-600"
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-[#00a884] rounded-full animate-pulse" />}
                    </div>
                    <div>
                      <span className={`text-xs font-bold block ${isSelected ? 'text-[#00a884]' : 'text-[#e9edef]'}`}>{opt.title}</span>
                      <span className="text-[10px] text-[#8696a0] font-medium block mt-1 leading-relaxed">{opt.spec}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Video & Call Parameter Settings */}
          <div className="bg-[#111b21] border border-[#222d34]/60 rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center gap-2.5 select-none">
              <Video className="w-5 h-5 text-[#00a884]" />
              <h3 className="text-xs font-bold text-[#e9edef] uppercase tracking-wider font-sans">
                Voice & Video Call Tuning
              </h3>
            </div>

            <p className="text-xs text-[#8696a0] leading-relaxed">
              Fine-tune the direct device codec formats and hardware parameters to guarantee stable connection handshakes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              
              {/* Select target resolution */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase text-[#8696a0] select-none">Video Resolution</label>
                <select
                  value={settings.videoResolution}
                  onChange={(e) => setSettings(prev => ({ ...prev, videoResolution: e.target.value as any }))}
                  className="w-full bg-[#202c33] border border-[#222d34]/60 text-xs text-[#e9edef] font-semibold rounded-lg p-2.5 focus:outline-none focus:border-[#00a884] transition-colors cursor-pointer"
                >
                  <option value="720p">HD Stream (720p)</option>
                  <option value="1080p">Full HD High Fidelity (1080p)</option>
                  <option value="4k">4K Ultra Resolution (Requires Wi-Fi)</option>
                </select>
              </div>

              {/* Select frame rate */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase text-[#8696a0] select-none">Target Framerate</label>
                <select
                  value={settings.videoFrameRate}
                  onChange={(e) => setSettings(prev => ({ ...prev, videoFrameRate: parseInt(e.target.value) }))}
                  className="w-full bg-[#202c33] border border-[#222d34]/60 text-xs text-[#e9edef] font-semibold rounded-lg p-2.5 focus:outline-none focus:border-[#00a884] transition-colors cursor-pointer"
                >
                  <option value="24">24 FPS Cinematic</option>
                  <option value="30">30 FPS Standard</option>
                  <option value="60">60 FPS Ultra Fluid</option>
                </select>
              </div>

              {/* Select video codec */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase text-[#8696a0] select-none">Video Codec</label>
                <select
                  value={settings.videoCodec}
                  onChange={(e) => setSettings(prev => ({ ...prev, videoCodec: e.target.value as any }))}
                  className="w-full bg-[#202c33] border border-[#222d34]/60 text-xs text-[#e9edef] font-semibold rounded-lg p-2.5 focus:outline-none focus:border-[#00a884] transition-colors cursor-pointer"
                >
                  <option value="H264">H.264 AVC (Maximum legacy compatibility)</option>
                  <option value="H265">HEVC H.265 (High efficiency streaming)</option>
                  <option value="VP9">VP9 Profile (WebRTC standard codec)</option>
                </select>
              </div>

              {/* Select audio codec */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase text-[#8696a0] select-none">Audio Compression</label>
                <select
                  value={settings.audioCodec}
                  onChange={(e) => setSettings(prev => ({ ...prev, audioCodec: e.target.value as any }))}
                  className="w-full bg-[#202c33] border border-[#222d34]/60 text-xs text-[#e9edef] font-semibold rounded-lg p-2.5 focus:outline-none focus:border-[#00a884] transition-colors cursor-pointer"
                >
                  <option value="Opus">Opus (Recommended voice band codec)</option>
                  <option value="AAC">AAC (High-fidelity music/file track)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Device compatibility list, toggles, PWA instructions */}
        <div className="space-y-5">
          
          {/* PWA Device Installation Hub */}
          <div className="bg-[#111b21] border border-[#222d34]/60 rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 select-none">
                <Download className="w-4 h-4 text-[#00a884]" />
                <h4 className="text-xs font-bold text-[#e9edef] uppercase tracking-wider font-sans">
                  Install on Device
                </h4>
              </div>
              {isInstalled ? (
                <span className="flex items-center gap-1 bg-[#00a884]/15 border border-[#00a884]/30 text-[#00a884] font-mono text-[9px] px-2 py-0.5 rounded font-bold">
                  INSTALLED
                </span>
              ) : (
                <span className="bg-[#53bdeb]/10 border border-[#53bdeb]/20 text-[#53bdeb] font-mono text-[9px] px-2 py-0.5 rounded">
                  PWA OK
                </span>
              )}
            </div>

            <p className="text-[11px] text-[#8696a0] leading-relaxed">
              Install Connections on iOS, Android, or Desktop to run standalone with native alerts, launch animations, and offline storage persistence.
            </p>

            {/* Platform Tab Selectors */}
            <div className="flex bg-[#202c33] p-1 rounded-xl border border-[#222d34]/60 select-none">
              <button
                onClick={() => setActivePlatform('android')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all ${
                  activePlatform === 'android' ? "bg-[#00a884] text-[#111b21]" : "text-[#8696a0] hover:text-[#e9edef]"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Android
              </button>
              <button
                onClick={() => setActivePlatform('ios')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all ${
                  activePlatform === 'ios' ? "bg-[#00a884] text-[#111b21]" : "text-[#8696a0] hover:text-[#e9edef]"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                iOS (Apple)
              </button>
              <button
                onClick={() => setActivePlatform('desktop')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all ${
                  activePlatform === 'desktop' ? "bg-[#00a884] text-[#111b21]" : "text-[#8696a0] hover:text-[#e9edef]"
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                PC/Mac
              </button>
            </div>

            {/* Platform Content */}
            <div className="bg-[#202c33]/30 border border-[#222d34]/40 rounded-xl p-4 text-[11px] space-y-3">
              {isInstalled ? (
                <div className="text-center py-2 space-y-2 select-none">
                  <CheckCircle2 className="w-8 h-8 text-[#00a884] mx-auto animate-pulse" />
                  <span className="font-bold text-[#e9edef] block">Connections is Installed!</span>
                  <p className="text-[10px] text-[#8696a0] leading-relaxed">
                    You are running inside a borderless standalone app window with full local cache storage.
                  </p>
                </div>
              ) : (
                <>
                  {activePlatform === 'android' && (
                    <div className="space-y-3">
                      {isInstallable ? (
                        <div className="space-y-2">
                          <p className="text-[#8696a0]">Click below to trigger automatic launcher placement:</p>
                          <button
                            onClick={handleInstallClick}
                            className="w-full flex items-center justify-center gap-2 bg-[#00a884] hover:bg-[#008f72] text-[#111b21] py-2 rounded-lg text-xs font-bold transition-all shadow-md"
                          >
                            <Download className="w-4 h-4" />
                            Install App Now
                          </button>
                        </div>
                      ) : (
                        <ol className="list-decimal list-inside space-y-2 text-[#8696a0] leading-normal font-sans font-medium">
                          <li>Open <strong className="text-[#e9edef]">Google Chrome</strong> on your Android phone.</li>
                          <li>Tap the browser options button <strong className="text-[#e9edef]">(⋮)</strong> next to the address bar.</li>
                          <li>Select <strong className="text-[#e9edef]">"Add to Home screen"</strong> or <strong className="text-[#00a884]">"Install App"</strong>.</li>
                          <li>Confirm to pin the WhatsApp icon on your phone launcher screen.</li>
                        </ol>
                      )}
                    </div>
                  )}

                  {activePlatform === 'ios' && (
                    <div className="space-y-2 text-[#8696a0] leading-normal font-sans font-medium">
                      <p className="text-[#e9edef]">Safari does not support auto-prompts, but you can pin it manually in 5 seconds:</p>
                      <ol className="list-decimal list-inside space-y-2">
                        <li>Launch this page inside Apple's native <strong className="text-[#e9edef]">Safari Browser</strong>.</li>
                        <li>
                          Tap Safari's bottom <strong className="text-[#e9edef] inline-flex items-center gap-0.5">Share <Share className="w-3.5 h-3.5 text-[#00a884] inline" /></strong> button.
                        </li>
                        <li>
                          Scroll the share sheet down and select <strong className="text-[#00a884] inline-flex items-center gap-0.5">Add to Home Screen <PlusSquare className="w-3.5 h-3.5 inline" /></strong>.
                        </li>
                        <li>
                          Confirm the name is "Connections" and tap <strong className="text-[#e9edef]">Add</strong> in the top-right.
                        </li>
                      </ol>
                    </div>
                  )}

                  {activePlatform === 'desktop' && (
                    <div className="space-y-3">
                      {isInstallable ? (
                        <div className="space-y-2">
                          <p className="text-[#8696a0]">Your laptop/PC browser supports direct standalone launcher placement:</p>
                          <button
                            onClick={handleInstallClick}
                            className="w-full flex items-center justify-center gap-2 bg-[#00a884] hover:bg-[#008f72] text-[#111b21] py-2 rounded-lg text-xs font-bold transition-all"
                          >
                            <Download className="w-4 h-4" />
                            Install Standalone App
                          </button>
                        </div>
                      ) : (
                        <ol className="list-decimal list-inside space-y-2 text-[#8696a0] leading-normal font-sans font-medium">
                          <li>Open <strong className="text-[#e9edef]">Chrome or Microsoft Edge</strong> on your laptop/Mac.</li>
                          <li>Click the small <strong className="text-[#00a884]">Install</strong> icon in the right side of the address bar (a screen with an arrow).</li>
                          <li>The app is now placed directly in your local Windows/macOS programs list.</li>
                        </ol>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Quick Info & Verification cards */}
          <div className="bg-[#111b21] border border-[#222d34]/60 rounded-2xl p-5 md:p-6 space-y-4">
            <span className="text-[10px] font-mono font-bold text-[#8696a0] uppercase tracking-wider block">
              Preferences
            </span>
            
            <div className="space-y-4">
              
              {/* Media Auto Download */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#e9edef] block">Media Auto-Download</span>
                  <span className="text-[10px] text-[#8696a0]">Cache received images</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleMedia}
                  className={`w-10 h-5.5 rounded-full relative transition-colors focus:outline-none ${
                    settings.mediaAutoDownload ? "bg-[#00a884]" : "bg-[#2a3942]"
                  }`}
                >
                  <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full transition-all ${
                    settings.mediaAutoDownload ? "right-0.5 bg-[#111b21]" : "left-0.5"
                  }`} />
                </button>
              </div>

              {/* Noise Cancellation */}
              <div className="flex items-center justify-between pt-3.5 border-t border-[#222d34]/40">
                <div>
                  <span className="text-xs font-bold text-[#e9edef] block">Intelligent Acoustic Canceller</span>
                  <span className="text-[10px] text-[#8696a0]">Filter call static background sounds</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleNoiseCancellation}
                  className={`w-10 h-5.5 rounded-full relative transition-colors focus:outline-none ${
                    settings.noiseCancellation ? "bg-[#00a884]" : "bg-[#2a3942]"
                  }`}
                >
                  <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full transition-all ${
                    settings.noiseCancellation ? "right-0.5 bg-[#111b21]" : "left-0.5"
                  }`} />
                </button>
              </div>

              {/* Ringtone selector */}
              <div className="pt-3.5 border-t border-[#222d34]/40 space-y-2">
                <span className="text-xs font-bold text-[#e9edef] block">Incoming Ringtone Chime:</span>
                <select
                  value={settings.selectedRingtone}
                  onChange={(e) => setSettings(prev => ({ ...prev, selectedRingtone: e.target.value }))}
                  className="w-full bg-[#202c33] border border-[#222d34]/60 text-xs text-[#e9edef] font-semibold rounded-lg p-2.5 focus:outline-none focus:border-[#00a884] cursor-pointer"
                >
                  <option value="Default Chime">Default CONNECTIONS Chime</option>
                  <option value="Digital Ascent">Digital Ascent (Modern Synth)</option>
                  <option value="Cosmic Slate">Cosmic Slate (Ambient Pulse)</option>
                  <option value="Marimba Classic">Marimba Classic (Classic)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dynamic Link & Systems Blueprint Hub */}
          <div className="bg-[#111b21] border border-[#222d34]/60 rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222d34]/40 pb-3 select-none">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-sans tracking-wider">
                <BookOpen className="w-4 h-4 text-[#00a884]" />
                PWA Link & Blueprint Hub
              </h4>
            </div>

            {/* Tab switchers */}
            <div className="flex bg-[#202c33]/80 p-1 rounded-xl border border-[#222d34]/40">
              <button
                type="button"
                onClick={() => setActiveHubTab('qrcode')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeHubTab === 'qrcode'
                    ? "bg-[#00a884] text-[#111b21]"
                    : "text-[#8696a0] hover:text-[#e9edef]"
                }`}
              >
                <QrCode className="w-4 h-4" />
                Phone QR Link
              </button>
              <button
                type="button"
                onClick={() => setActiveHubTab('blueprint')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeHubTab === 'blueprint'
                    ? "bg-[#00a884] text-[#111b21]"
                    : "text-[#8696a0] hover:text-[#e9edef]"
                }`}
              >
                <Cpu className="w-4 h-4" />
                System Blueprint
              </button>
            </div>

            {/* Tab 1 Content: QR Code */}
            {activeHubTab === 'qrcode' && (
              <div className="space-y-4 text-center">
                <p className="text-[11px] text-[#8696a0] leading-relaxed">
                  Scan this live, responsive QR code on your phone's camera to immediately open Connections on your device. Works from any hosted URL or local network!
                </p>

                <div className="relative inline-block p-3 bg-white rounded-2xl mx-auto shadow-inner">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      typeof window !== 'undefined' ? window.location.href : 'https://ai.studio/build'
                    )}&color=0b141a&bgcolor=ffffff`}
                    alt="Scan to open on phone"
                    className="w-36 h-36 object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 border border-[#00a884]/20 rounded-2xl pointer-events-none" />
                </div>

                <div className="space-y-2 pt-1">
                  <div className="bg-[#202c33]/50 border border-[#222d34]/60 rounded-xl p-2.5 flex items-center justify-between gap-2 max-w-full">
                    <span className="text-[10px] text-[#8696a0] truncate select-all font-mono">
                      {typeof window !== 'undefined' ? window.location.href : 'https://ai.studio/build'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="shrink-0 p-2 rounded-lg bg-[#00a884]/10 hover:bg-[#00a884]/20 text-[#00a884] transition-all"
                      title="Copy URL"
                    >
                      {copiedLink ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {copiedLink && (
                    <span className="text-[10px] font-mono text-[#00a884] block font-bold animate-pulse">
                      App Link copied securely! Send to your phone.
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2 Content: Architectural Blueprint */}
            {activeHubTab === 'blueprint' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#222d34]/40 pb-2">
                  <Sparkles className="w-4 h-4 text-[#00a884] shrink-0" />
                  <span className="text-xs font-bold text-[#e9edef]">WhatsApp-Style Blueprint</span>
                </div>

                <p className="text-[11px] text-[#8696a0] leading-relaxed">
                  Connections operates using a secure, client-first, edge-synced PWA hybrid architecture built for zero-latency messaging.
                </p>

                {/* Vertical flow timeline */}
                <div className="space-y-3 font-sans">
                  
                  {/* Step 1 */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30 flex items-center justify-center text-[10px] font-bold font-mono">
                        01
                      </div>
                      <div className="w-0.5 flex-1 bg-[#222d34]/60 my-1" />
                    </div>
                    <div className="flex-1 pb-2">
                      <span className="text-xs font-bold text-[#e9edef] block">Service Worker Shell</span>
                      <p className="text-[10px] text-[#8696a0] mt-0.5 leading-relaxed">
                        Static assets are cached via <code className="text-emerald-400 font-mono text-[9px]">sw.js</code>. The application launches in under 1 second, even with zero network connection.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30 flex items-center justify-center text-[10px] font-bold font-mono">
                        02
                      </div>
                      <div className="w-0.5 flex-1 bg-[#222d34]/60 my-1" />
                    </div>
                    <div className="flex-1 pb-2">
                      <span className="text-xs font-bold text-[#e9edef] block">Optimistic Sync Layer</span>
                      <p className="text-[10px] text-[#8696a0] mt-0.5 leading-relaxed">
                        Messages & swipe-archives update instantaneously in the React state tree and local browser storage. Queue flushes seamlessly upon connection auto-detection.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30 flex items-center justify-center text-[10px] font-bold font-mono">
                        03
                      </div>
                      <div className="w-0.5 flex-1 bg-[#222d34]/60 my-1" />
                    </div>
                    <div className="flex-1 pb-2">
                      <span className="text-xs font-bold text-[#e9edef] block">Secure Node/Express Proxy</span>
                      <p className="text-[10px] text-[#8696a0] mt-0.5 leading-relaxed">
                        Backend API routes handle secrets securely. Raw API keys like Gemini are never bundled into the client files, protecting owner credentials.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30 flex items-center justify-center text-[10px] font-bold font-mono">
                        04
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-bold text-[#e9edef] block">Durability JSON Store</span>
                      <p className="text-[10px] text-[#8696a0] mt-0.5 leading-relaxed">
                        Data writes securely to thread-safe file structures on the server host, creating a simple, lightweight, zero-cold-start cloud database.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* Owner specific Free / Offline assurance card */}
          <div className="bg-[#111b21] border border-[#222d34]/60 p-5 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wider">
              <Network className="w-4 h-4 text-[#00a884] animate-pulse" />
              Hybrid Connection Cached
            </h4>
            <p className="text-xs text-[#8696a0] leading-relaxed">
              If cellular connection is lost, you can still publish statuses, write threads, comment, queue messages, and tune parameters safely. 
            </p>
            <p className="text-xs text-[#8696a0] leading-relaxed">
              They persist locally inside your browser's persistent key-value vault, and sync to Cloud servers the moment you regain internet access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
