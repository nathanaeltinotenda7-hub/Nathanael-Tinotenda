import React, { useState, useEffect, useRef } from "react";
import { StatusUpdate, StatusViewer } from "../types";
import { 
  Plus, 
  Type, 
  Image as ImageIcon, 
  Palette, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Clock, 
  Send, 
  Check, 
  Trash, 
  Sparkles,
  Camera,
  BookOpen,
  Volume2,
  Lock,
  Pause,
  Play
} from "lucide-react";

interface StatusSectionProps {
  isOffline: boolean;
  currentUserEmail: string;
  triggerToast?: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const CURATED_PHOTOS = [
  { name: "Coffee Workspace", url: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800" },
  { name: "Sunny Coastline", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800" },
  { name: "Neon Tech", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800" },
  { name: "Forest Retreat", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800" },
  { name: "City Skyline", url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800" },
  { name: "Minimalist Plants", url: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800" },
  { name: "Cozy Study", url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800" },
  { name: "Vaporwave Art", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800" }
];

const BACKGROUND_GRADIENTS = [
  { name: "Teal Emerald", value: "linear-gradient(135deg, #11b8a6, #10b981)", class: "from-teal-500 to-emerald-600" },
  { name: "Sunset Cosmic", value: "linear-gradient(135deg, #9333ea, #ec4899)", class: "from-purple-600 to-pink-500" },
  { name: "Midnight Indigo", value: "linear-gradient(135deg, #3730a3, #0f172a)", class: "from-indigo-800 to-slate-900" },
  { name: "Fiery Red-Orange", value: "linear-gradient(135deg, #f97316, #dc2626)", class: "from-orange-500 to-red-600" },
  { name: "Blue Cyan Wave", value: "linear-gradient(135deg, #3b82f6, #22d3ee)", class: "from-blue-500 to-cyan-400" },
  { name: "Charcoal Velvet", value: "linear-gradient(135deg, #262626, #09090b)", class: "from-neutral-800 to-zinc-950" }
];

const FONT_OPTIONS = [
  { id: "font-status-sans", name: "Modern Sans", class: "font-status-sans" },
  { id: "font-status-serif", name: "Elegant Serif", class: "font-status-serif" },
  { id: "font-status-mono", name: "Tech Mono", class: "font-status-mono" },
  { id: "font-status-display", name: "Space Display", class: "font-status-display" },
  { id: "font-status-handwritten", name: "Playful Script", class: "font-status-handwritten" }
];

// Helper to format timestamps nicely
function formatTimeRemaining(createdAtIso: string): string {
  const diffMs = Date.now() - new Date(createdAtIso).getTime();
  const diffHours = Math.floor(diffMs / (3600 * 1000));
  
  if (diffHours <= 0) {
    const diffMins = Math.floor(diffMs / (60 * 1000));
    return diffMins <= 1 ? "Just now" : `${diffMins} minutes ago`;
  }
  return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
}

export default function StatusSection({
  isOffline,
  currentUserEmail,
  triggerToast
}: StatusSectionProps) {
  const [statuses, setStatuses] = useState<StatusUpdate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Composers State
  const [showTextComposer, setShowTextComposer] = useState<boolean>(false);
  const [showImageComposer, setShowImageComposer] = useState<boolean>(false);

  // Text Status Data
  const [textStatusContent, setTextStatusContent] = useState<string>("");
  const [selectedGradientIdx, setSelectedGradientIdx] = useState<number>(0);
  const [backgroundColor, setBackgroundColor] = useState<string>("linear-gradient(135deg, #11b8a6, #10b981)");
  const [fontStyle, setFontStyle] = useState<string>("font-status-sans");
  const [textColor, setTextColor] = useState<string>("#ffffff");

  // Image Status Data
  const [imageStatusCaption, setImageStatusCaption] = useState<string>("");
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [customImageInput, setCustomImageInput] = useState<string>("");

  // Viewer State
  const [viewingUserEmail, setViewingUserEmail] = useState<string | null>(null);
  const [activeStatusIndex, setActiveStatusIndex] = useState<number>(0);
  const [isViewerPaused, setIsViewerPaused] = useState<boolean>(false);
  const [showViewerDetails, setShowViewerDetails] = useState<boolean>(false);

  // Timer Ref for progress tracking
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [playerProgress, setPlayerProgress] = useState<number>(0); // 0 to 100

  // Fetch status updates from the real backend stream
  const fetchStatuses = async () => {
    try {
      const res = await fetch("/api/statuses");
      if (res.ok) {
        const data = await res.json();
        setStatuses(data.statuses || []);
      }
    } catch (err) {
      console.error("Failed to load statuses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
    // Poll updates every 30 seconds to catch expired updates instantly
    const pollInterval = setInterval(fetchStatuses, 30000);
    return () => clearInterval(pollInterval);
  }, []);

  // Handle Create Status
  const handleCreateStatus = async (type: 'text' | 'image') => {
    if (type === 'text' && !textStatusContent.trim()) return;
    if (type === 'image' && !selectedImageUrl) return;

    const payload = {
      type,
      content: type === 'text' ? textStatusContent : imageStatusCaption,
      mediaUrl: type === 'image' ? selectedImageUrl : undefined,
      backgroundColor: type === 'text' ? backgroundColor : undefined,
      fontStyle: type === 'text' ? fontStyle : undefined,
      textColor: type === 'text' ? textColor : undefined
    };

    // Optimistic UI state update
    const mockNewStatus: StatusUpdate = {
      id: `st_opt_${Date.now()}`,
      userEmail: currentUserEmail,
      userName: currentUserEmail === "nathanaeltinotenda7@gmail.com" ? "Nathanael (Owner)" : "Guest User",
      userAvatar: currentUserEmail === "nathanaeltinotenda7@gmail.com" 
        ? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" 
        : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      type: payload.type,
      content: payload.content,
      mediaUrl: payload.mediaUrl,
      backgroundColor: payload.backgroundColor,
      fontStyle: payload.fontStyle,
      textColor: payload.textColor,
      createdAt: new Date().toISOString(),
      views: []
    };

    setStatuses(prev => [mockNewStatus, ...prev]);

    if (isOffline) {
      if (triggerToast) {
        triggerToast("Status saved in local offline buffer. Will sync when online!", "info");
      }
      resetComposers();
      return;
    }

    try {
      const res = await fetch("/api/statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (triggerToast) {
          triggerToast("Status updated successfully! Expiring in 24 hours.", "success");
        }
        fetchStatuses();
      } else {
        throw new Error("Failed to post status to server");
      }
    } catch (err) {
      console.error(err);
      if (triggerToast) {
        triggerToast("Failed to publish status update.", "warning");
      }
    }

    resetComposers();
  };

  const resetComposers = () => {
    setShowTextComposer(false);
    setShowImageComposer(false);
    setTextStatusContent("");
    setImageStatusCaption("");
    setSelectedImageUrl("");
    setCustomImageInput("");
    setBackgroundColor("linear-gradient(135deg, #11b8a6, #10b981)");
    setSelectedGradientIdx(0);
    setFontStyle("font-status-sans");
    setTextColor("#ffffff");
  };

  // Group statuses by user for WhatsApp layout list
  const groupedStatuses = statuses.reduce((acc: Record<string, StatusUpdate[]>, status) => {
    const email = status.userEmail;
    if (!acc[email]) {
      acc[email] = [];
    }
    acc[email].push(status);
    return acc;
  }, {});

  // Sort groups: make sure the most recent statuses are first
  const sortedUsers = Object.keys(groupedStatuses).sort((a, b) => {
    const aLatest = new Date(groupedStatuses[a][0].createdAt).getTime();
    const bLatest = new Date(groupedStatuses[b][0].createdAt).getTime();
    return bLatest - aLatest;
  });

  // Separate my status vs others
  const myActiveStatuses = groupedStatuses[currentUserEmail] || [];
  const otherUsers = sortedUsers.filter(email => email !== currentUserEmail);

  // Divide others into viewed & unviewed
  const unviewedGroups: string[] = [];
  const viewedGroups: string[] = [];

  otherUsers.forEach(email => {
    const userStatuses = groupedStatuses[email];
    // Check if ALL of this user's statuses have been viewed by currentUser
    const allViewed = userStatuses.every(status => 
      status.views.some(v => v.userEmail === currentUserEmail)
    );
    if (allViewed) {
      viewedGroups.push(email);
    } else {
      unviewedGroups.push(email);
    }
  });

  // Open Full Screen Status Viewer
  const handleOpenViewer = (email: string) => {
    setViewingUserEmail(email);
    // Find the first unviewed status for this user, default to 0 if all viewed
    const userStatuses = groupedStatuses[email] || [];
    const firstUnviewedIdx = userStatuses.findIndex(s => 
      !s.views.some(v => v.userEmail === currentUserEmail)
    );
    setActiveStatusIndex(firstUnviewedIdx !== -1 ? firstUnviewedIdx : 0);
    setPlayerProgress(0);
    setIsViewerPaused(false);
    setShowViewerDetails(false);
  };

  // Record that a status is viewed
  const recordStatusView = async (statusId: string) => {
    if (isOffline) return;
    try {
      await fetch("/api/statuses/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId })
      });
      // Silent update on our client side state
      setStatuses(prev => prev.map(s => {
        if (s.id === statusId) {
          const alreadyViewed = s.views.some(v => v.userEmail === currentUserEmail);
          if (!alreadyViewed) {
            return {
              ...s,
              views: [...s.views, {
                userEmail: currentUserEmail,
                userName: currentUserEmail === "nathanaeltinotenda7@gmail.com" ? "Nathanael (Owner)" : "Guest User",
                userAvatar: currentUserEmail === "nathanaeltinotenda7@gmail.com" 
                  ? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" 
                  : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
                viewedAt: new Date().toISOString()
              }]
            };
          }
        }
        return s;
      }));
    } catch (err) {
      console.error("Failed to record view on server:", err);
    }
  };

  // Status Player Engine (Auto-advancer)
  useEffect(() => {
    if (!viewingUserEmail) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const activeStatusesList = groupedStatuses[viewingUserEmail] || [];
    if (activeStatusesList.length === 0) return;

    const currentStatus = activeStatusesList[activeStatusIndex];
    if (currentStatus) {
      // Record view when a status displays, provided it's not my own
      if (currentStatus.userEmail !== currentUserEmail) {
        recordStatusView(currentStatus.id);
      }
    }

    if (isViewerPaused) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    // 40ms interval for smooth progressive rendering (total duration = 4000ms)
    const step = 1; // % of progress per tick
    const tickMs = 40; // 40ms * 100 steps = 4000ms (4 seconds)

    progressIntervalRef.current = setInterval(() => {
      setPlayerProgress(prev => {
        if (prev >= 100) {
          // Finished this status! Go to next
          if (activeStatusIndex < activeStatusesList.length - 1) {
            setActiveStatusIndex(idx => idx + 1);
            return 0;
          } else {
            // All statuses viewed for this contact! Close player
            setViewingUserEmail(null);
            return 0;
          }
        }
        return prev + step;
      });
    }, tickMs);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [viewingUserEmail, activeStatusIndex, isViewerPaused]);

  // Navigate Status Player Manually
  const handlePrevStatus = () => {
    if (activeStatusIndex > 0) {
      setActiveStatusIndex(idx => idx - 1);
      setPlayerProgress(0);
    }
  };

  const handleNextStatus = () => {
    const activeStatusesList = groupedStatuses[viewingUserEmail || ""] || [];
    if (activeStatusIndex < activeStatusesList.length - 1) {
      setActiveStatusIndex(idx => idx + 1);
      setPlayerProgress(0);
    } else {
      setViewingUserEmail(null);
    }
  };

  const handlePauseToggle = () => {
    setIsViewerPaused(!isViewerPaused);
  };

  return (
    <div className="flex-1 bg-[#0b141a] flex flex-col md:flex-row overflow-hidden h-full text-[#e9edef]" id="status-viewport">
      
      {/* LEFT COLUMN: Status Directory (WhatsApp Style) */}
      <div className="w-full md:w-96 bg-[#111b21] border-r border-[#222d34]/60 flex flex-col h-full shrink-0">
        
        {/* Directory Header */}
        <div className="p-4 bg-[#202c33] border-b border-[#222d34]/60 flex items-center justify-between select-none">
          <div>
            <h3 className="font-sans font-bold text-sm text-[#e9edef] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#00a884] animate-pulse" />
              My Status & Stories
            </h3>
            <p className="text-[10px] text-[#8696a0]">Post updates that disappear after 24h</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTextComposer(true)}
              className="p-2 rounded-full hover:bg-[#2a3942] text-[#00a884] transition-all"
              title="Add Text Status"
              id="btn-add-text-status"
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowImageComposer(true)}
              className="p-2 rounded-full hover:bg-[#2a3942] text-[#00a884] transition-all"
              title="Add Image Status"
              id="btn-add-image-status"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Directory List */}
        <div className="flex-1 overflow-y-auto space-y-4 p-3 select-none">
          
          {/* 1. MY STATUS SLOT */}
          <div className="bg-[#182229]/60 border border-[#222d34]/40 rounded-xl p-3">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#8696a0] block mb-2.5">
              My Personal Status
            </span>

            {myActiveStatuses.length > 0 ? (
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => handleOpenViewer(currentUserEmail)}
                  className="flex-1 flex items-center gap-3.5 text-left focus:outline-none group"
                >
                  <div className="relative w-12 h-12 rounded-full p-[2.5px] border-2 border-[#00a884] transition-transform group-hover:scale-105">
                    {myActiveStatuses[0].type === 'image' ? (
                      <img 
                        src={myActiveStatuses[0].mediaUrl} 
                        alt="My Status" 
                        className="w-full h-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div 
                        style={{ 
                          background: myActiveStatuses[0].backgroundColor || "linear-gradient(135deg, #11b8a6, #10b981)", 
                          color: myActiveStatuses[0].textColor || "#ffffff" 
                        }}
                        className={`w-full h-full rounded-full flex items-center justify-center text-[8px] font-bold p-1 overflow-hidden leading-tight ${myActiveStatuses[0].fontStyle || "font-status-sans"}`}
                      >
                        {myActiveStatuses[0].content.substring(0, 15)}...
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 bg-[#00a884] text-white p-0.5 rounded-full border-2 border-[#111b21]">
                      <Eye className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">My Status Update</h4>
                    <p className="text-[10px] text-[#8696a0] mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#00a884]" />
                      {myActiveStatuses.length} updates • Latest {formatTimeRemaining(myActiveStatuses[0].createdAt)}
                    </p>
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3.5">
                <div className="relative w-11 h-11 rounded-full bg-[#202c33] border border-[#222d34] flex items-center justify-center text-[#8696a0]">
                  <Camera className="w-5 h-5 text-[#8696a0]" />
                  <button 
                    onClick={() => setShowTextComposer(true)}
                    className="absolute -bottom-0.5 -right-0.5 bg-[#00a884] hover:bg-[#008f72] text-[#111b21] p-1 rounded-full border-2 border-[#111b21] transition-transform active:scale-95"
                  >
                    <Plus className="w-3 h-3 text-[#111b21] font-bold" />
                  </button>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Share a status update</h4>
                  <p className="text-[10px] text-[#8696a0] mt-0.5">Let your friends know what you're up to</p>
                </div>
              </div>
            )}
          </div>

          {/* 2. RECENT / UNVIEWED UPDATES */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#00a884] pl-2 block">
              Recent Updates ({unviewedGroups.length})
            </span>
            
            {unviewedGroups.length > 0 ? (
              unviewedGroups.map(email => {
                const userStatuses = groupedStatuses[email];
                const latestStatus = userStatuses[0];
                return (
                  <button
                    key={email}
                    onClick={() => handleOpenViewer(email)}
                    className="w-full flex items-center gap-3.5 p-2 rounded-xl hover:bg-[#202c33]/60 text-left transition-colors focus:outline-none group"
                  >
                    {/* Ring indicator around avatar: number of statuses splits the circle */}
                    <div className="relative w-11 h-11 rounded-full flex items-center justify-center p-[2px] border-2 border-[#00a884] transition-transform group-hover:scale-105">
                      <img 
                        src={latestStatus.userAvatar} 
                        alt={latestStatus.userName} 
                        className="w-full h-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {userStatuses.length > 1 && (
                        <div className="absolute inset-0 border-2 border-dashed border-[#00a884]/60 rounded-full animate-spin-slow pointer-events-none" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#e9edef] truncate">{latestStatus.userName}</h4>
                      <p className="text-[10px] text-[#8696a0] mt-0.5 flex items-center gap-1 font-mono">
                        {formatTimeRemaining(latestStatus.createdAt)}
                      </p>
                    </div>

                    {userStatuses.length > 1 && (
                      <span className="bg-[#00a884]/10 text-[#00a884] text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full border border-[#00a884]/20 shrink-0">
                        {userStatuses.length} updates
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <p className="text-[11px] text-[#8696a0] pl-2 py-1">No new status updates from your contacts.</p>
            )}
          </div>

          {/* 3. VIEWED UPDATES */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#8696a0] pl-2 block">
              Viewed Updates ({viewedGroups.length})
            </span>

            {viewedGroups.length > 0 ? (
              viewedGroups.map(email => {
                const userStatuses = groupedStatuses[email];
                const latestStatus = userStatuses[0];
                return (
                  <button
                    key={email}
                    onClick={() => handleOpenViewer(email)}
                    className="w-full flex items-center gap-3.5 p-2 rounded-xl hover:bg-[#202c33]/40 text-left transition-colors focus:outline-none opacity-70 hover:opacity-100 group"
                  >
                    <div className="relative w-11 h-11 rounded-full flex items-center justify-center p-[2px] border-2 border-slate-600 transition-transform group-hover:scale-105">
                      <img 
                        src={latestStatus.userAvatar} 
                        alt={latestStatus.userName} 
                        className="w-full h-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#e9edef] truncate">{latestStatus.userName}</h4>
                      <p className="text-[10px] text-[#8696a0] mt-0.5 flex items-center gap-1 font-mono">
                        Viewed • {formatTimeRemaining(latestStatus.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="text-[11px] text-[#8696a0] pl-2 py-1">Updates you view will appear here.</p>
            )}
          </div>
        </div>

        {/* Safety Lock Label */}
        <div className="p-3.5 bg-[#121c22] border-t border-[#222d34]/40 text-center select-none shrink-0">
          <p className="text-[10px] text-[#8696a0] flex items-center justify-center gap-1.5 leading-normal">
            <Lock className="w-3.5 h-3.5 text-[#00a884]" />
            Your status updates are <span className="text-[#00a884] font-semibold">End-to-End Encrypted</span>
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Status Hero / Dynamic Canvas */}
      <div className="flex-1 bg-[#0b141a] flex flex-col items-center justify-center relative p-6 select-none h-full" id="status-hero-preview">
        
        {/* Abstract background graphics */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,168,132,0.06),transparent_60%)] pointer-events-none" />

        {/* Normal State: Splash Hero screen */}
        {!showTextComposer && !showImageComposer && (
          <div className="text-center max-w-sm space-y-5 animate-fadeIn z-10">
            <div className="w-20 h-20 bg-[#202c33]/75 border border-[#222d34]/60 rounded-full flex items-center justify-center mx-auto shadow-xl">
              <Plus className="w-9 h-9 text-[#00a884] animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                Status Broadcast Engine
              </h4>
              <p className="text-xs text-[#8696a0] leading-relaxed px-4">
                Share what is happening right now. Select a composer to begin drafting your text or image broadcast.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowTextComposer(true)}
                className="bg-[#202c33] hover:bg-[#2a3942] hover:text-[#00a884] text-white border border-[#222d34]/80 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg"
              >
                <Type className="w-4 h-4 text-[#00a884]" />
                Write Status
              </button>
              <button
                onClick={() => setShowImageComposer(true)}
                className="bg-[#00a884] hover:bg-[#008f72] text-[#111b21] text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg"
              >
                <ImageIcon className="w-4 h-4" />
                Photo Status
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE TEXT STATUS COMPOSER */}
        {showTextComposer && (
          <div className="w-full max-w-lg bg-[#111b21] border border-[#222d34]/60 rounded-2xl p-5 md:p-6 shadow-2xl space-y-5 animate-slideUp z-10">
            <div className="flex items-center justify-between border-b border-[#222d34]/40 pb-3">
              <h4 className="text-xs font-bold text-white uppercase font-sans tracking-widest flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-[#00a884]" />
                Craft Text Status
              </h4>
              <button onClick={resetComposers} className="p-1.5 rounded-full hover:bg-[#202c33] text-slate-400 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* PREVIEW CONTAINER */}
            <div 
              style={{ background: backgroundColor }}
              className="w-full aspect-[16/10] rounded-xl flex flex-col items-center justify-center p-6 text-center shadow-inner relative overflow-hidden transition-all duration-300"
            >
              <textarea
                value={textStatusContent}
                onChange={(e) => setTextStatusContent(e.target.value)}
                placeholder="Type what is on your mind..."
                rows={3}
                maxLength={180}
                style={{ color: textColor }}
                className={`w-full bg-transparent border-none text-md md:text-lg font-bold placeholder-white/50 focus:outline-none focus:ring-0 resize-none text-center outline-none leading-relaxed px-4 ${fontStyle}`}
              />
              <span className="absolute bottom-3 right-3 text-[10px] text-white/55 font-mono">
                {180 - textStatusContent.length} chars left
              </span>
            </div>

            {/* COLOR PALETTE PICKER */}
            <div className="space-y-3.5 bg-[#182229]/60 border border-[#222d34]/40 rounded-xl p-3">
              <div>
                <label className="text-[10px] text-[#8696a0] font-mono uppercase tracking-wider block mb-1.5">Background Style</label>
                <div className="flex items-center gap-3">
                  {/* Preset list */}
                  <div className="flex-1 flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
                    {BACKGROUND_GRADIENTS.map((grad, idx) => (
                      <button
                        key={grad.name}
                        type="button"
                        onClick={() => {
                          setSelectedGradientIdx(idx);
                          setBackgroundColor(grad.value);
                        }}
                        style={{ background: grad.value }}
                        className={`w-7 h-7 rounded-full shrink-0 border-2 transition-all ${
                          selectedGradientIdx === idx ? "border-white scale-110 shadow-lg" : "border-transparent hover:scale-105"
                        }`}
                        title={grad.name}
                      />
                    ))}
                  </div>

                  {/* Divider line */}
                  <div className="w-[1px] h-6 bg-[#222d34]/80 shrink-0" />

                  {/* Solid BG Color Picker */}
                  <div className="relative shrink-0 flex items-center gap-1">
                    <label 
                      htmlFor="bg-color-input"
                      style={{ background: selectedGradientIdx === -1 ? backgroundColor : "linear-gradient(45deg, red, orange, yellow, green, blue, purple)" }}
                      className={`w-7 h-7 rounded-full cursor-pointer flex items-center justify-center border-2 transition-all ${
                        selectedGradientIdx === -1 ? "border-white scale-110 shadow-lg" : "border-transparent hover:scale-105"
                      }`}
                      title="Custom Solid Background"
                    >
                      <Palette className="w-3.5 h-3.5 text-white mix-blend-difference" />
                    </label>
                    <input 
                      type="color"
                      id="bg-color-input"
                      value={selectedGradientIdx === -1 ? backgroundColor : "#11b8a6"}
                      onChange={(e) => {
                        setSelectedGradientIdx(-1);
                        setBackgroundColor(e.target.value);
                      }}
                      className="sr-only"
                    />
                    {selectedGradientIdx === -1 && (
                      <span className="text-[9px] font-mono text-white bg-[#00a884] px-1 rounded">Custom</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Text Color Customizer */}
              <div className="flex items-center justify-between pt-1 border-t border-[#222d34]/20">
                <span className="text-[10px] text-[#8696a0] font-mono uppercase tracking-wider">Status Text Color</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#8696a0]">{textColor.toUpperCase()}</span>
                  <label 
                    htmlFor="text-color-input"
                    style={{ backgroundColor: textColor }}
                    className="w-6 h-6 rounded-md cursor-pointer border border-[#222d34] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
                    title="Customize Text Color"
                  >
                    <Type className="w-3 h-3 text-white mix-blend-difference" />
                  </label>
                  <input 
                    type="color"
                    id="text-color-input"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="sr-only"
                  />
                </div>
              </div>
            </div>

            {/* FONT SELECTOR */}
            <div className="space-y-2 bg-[#182229]/60 border border-[#222d34]/40 rounded-xl p-3">
              <label className="text-[10px] text-[#8696a0] font-mono uppercase tracking-wider block mb-1">Select Font Style</label>
              <div className="flex flex-wrap gap-1.5">
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => setFontStyle(font.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      fontStyle === font.id
                        ? "bg-[#00a884] border-[#00a884] text-[#111b21] shadow-md"
                        : "bg-[#202c33] border-[#222d34]/60 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]/80"
                    } ${font.class}`}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>

            {/* SUBMIT */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={resetComposers}
                className="px-4 py-2 text-xs font-bold rounded-xl text-[#8696a0] hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateStatus('text')}
                disabled={!textStatusContent.trim()}
                className="bg-[#00a884] hover:bg-[#008f72] disabled:opacity-45 text-[#111b21] text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Publish Status
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE IMAGE STATUS COMPOSER */}
        {showImageComposer && (
          <div className="w-full max-w-lg bg-[#111b21] border border-[#222d34]/60 rounded-2xl p-5 md:p-6 shadow-2xl space-y-5 animate-slideUp z-10">
            <div className="flex items-center justify-between border-b border-[#222d34]/40 pb-3">
              <h4 className="text-xs font-bold text-white uppercase font-sans tracking-widest flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#00a884]" />
                Select Photo Broadcast
              </h4>
              <button onClick={resetComposers} className="p-1.5 rounded-full hover:bg-[#202c33] text-slate-400 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CURATED IMAGE SELECTOR */}
            <div className="space-y-2">
              <label className="text-[10px] text-[#8696a0] font-mono uppercase tracking-wider block">1. Click to select a design photo</label>
              <div className="grid grid-cols-4 gap-2">
                {CURATED_PHOTOS.map(photo => (
                  <button
                    key={photo.name}
                    type="button"
                    onClick={() => {
                      setSelectedImageUrl(photo.url);
                      setCustomImageInput("");
                    }}
                    className={`aspect-video rounded-lg overflow-hidden border-2 transition-all relative group ${
                      selectedImageUrl === photo.url ? "border-[#00a884] scale-105 shadow-md" : "border-transparent hover:scale-102"
                    }`}
                  >
                    <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] text-white font-bold text-center leading-tight px-1">{photo.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* CUSTOM IMAGE URL */}
            <div className="space-y-1">
              <label className="text-[10px] text-[#8696a0] font-mono uppercase tracking-wider block">Or input custom image url</label>
              <input
                type="text"
                value={customImageInput}
                onChange={(e) => {
                  setCustomImageInput(e.target.value);
                  setSelectedImageUrl(e.target.value);
                }}
                placeholder="https://images.unsplash.com/your-custom-photo-url"
                className="w-full bg-[#202c33] border border-[#222d34] rounded-xl px-4 py-2 text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:bg-[#2a3942] transition-all font-mono"
              />
            </div>

            {/* PHOTO PREVIEW */}
            {selectedImageUrl && (
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-[#222d34] bg-black">
                <img src={selectedImageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                
                {/* Caption input overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8 flex items-center gap-2">
                  <input
                    type="text"
                    value={imageStatusCaption}
                    onChange={(e) => setImageStatusCaption(e.target.value)}
                    placeholder="Add an optional caption..."
                    className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 rounded-xl px-4 py-1.5 text-xs text-white placeholder-white/60 focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* SUBMIT */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={resetComposers}
                className="px-4 py-2 text-xs font-bold rounded-xl text-[#8696a0] hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateStatus('image')}
                disabled={!selectedImageUrl}
                className="bg-[#00a884] hover:bg-[#008f72] disabled:opacity-45 text-[#111b21] text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Publish Status
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FULLSCREEN WHATSAPP-STYLE STATUS PLAYER OVERLAY */}
      {viewingUserEmail && (
        <div 
          className="fixed inset-0 bg-[#080b0d] z-50 flex flex-col md:flex-row items-center justify-center select-none"
          id="status-player-overlay"
        >
          {/* Active status items details */}
          {(() => {
            const list = groupedStatuses[viewingUserEmail] || [];
            const current = list[activeStatusIndex];
            if (!current) return null;

            return (
              <div className="relative w-full max-w-xl aspect-[9/16] md:max-h-[92vh] md:rounded-2xl bg-black flex flex-col justify-between overflow-hidden shadow-2xl">
                
                {/* 1. PROGRESS SEGMENT BARS */}
                <div className="absolute top-4 inset-x-4 flex gap-1.5 z-40">
                  {list.map((item, idx) => {
                    let fillWidth = "0%";
                    if (idx < activeStatusIndex) fillWidth = "100%";
                    else if (idx === activeStatusIndex) fillWidth = `${playerProgress}%`;

                    return (
                      <div key={item.id} className="h-[3px] flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full transition-all duration-40" 
                          style={{ width: fillWidth }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* 2. PLAYER TOP BAR: Contact Info & controls */}
                <div className="absolute top-7 inset-x-4 flex items-center justify-between z-40 text-white">
                  <div className="flex items-center gap-3">
                    <img 
                      src={current.userAvatar} 
                      alt={current.userName} 
                      className="w-9 h-9 rounded-full object-cover border border-white/25"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-xs font-bold tracking-wide drop-shadow">{current.userName}</h4>
                      <p className="text-[9px] text-white/80 drop-shadow mt-0.5">{formatTimeRemaining(current.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handlePauseToggle}
                      className="p-1.5 rounded-full hover:bg-white/10 text-white transition-all"
                      title={isViewerPaused ? "Resume" : "Pause"}
                    >
                      {isViewerPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
                    </button>
                    <button 
                      onClick={() => setViewingUserEmail(null)}
                      className="p-1.5 rounded-full hover:bg-white/10 text-white transition-all"
                      title="Close status"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* 3. CLICK NAVIGATION SENSORS (Left to go back, right to go forward) */}
                <div className="absolute inset-y-16 inset-x-0 flex z-20">
                  <div 
                    onClick={handlePrevStatus}
                    className="w-1/3 h-full cursor-pointer hover:bg-gradient-to-r hover:from-white/5 hover:to-transparent transition-all" 
                  />
                  <div 
                    onClick={handlePauseToggle}
                    className="w-1/3 h-full cursor-pointer" 
                  />
                  <div 
                    onClick={handleNextStatus}
                    className="w-1/3 h-full cursor-pointer hover:bg-gradient-to-l hover:from-white/5 hover:to-transparent transition-all" 
                  />
                </div>

                {/* 4. CONTENT ZONE */}
                <div className="flex-1 w-full h-full flex items-center justify-center relative z-10">
                  {current.type === 'image' ? (
                    <div className="w-full h-full flex items-center justify-center bg-[#050505]">
                      <img 
                        src={current.mediaUrl} 
                        alt="Status Image" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Image caption overlay */}
                      {current.content && (
                        <div className="absolute inset-x-0 bottom-20 bg-black/60 backdrop-blur-md px-6 py-4 text-center z-30">
                          <p className="text-xs text-white leading-relaxed font-sans">{current.content}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div 
                      style={{ background: current.backgroundColor || "linear-gradient(135deg, #11b8a6, #10b981)" }}
                      className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
                    >
                      <p 
                        style={{ color: current.textColor || "#ffffff" }}
                        className={`text-md md:text-xl font-bold leading-normal max-w-sm whitespace-pre-wrap select-text selection:bg-[#00a884]/40 ${current.fontStyle || "font-status-sans"}`}
                      >
                        {current.content}
                      </p>
                    </div>
                  )}
                </div>

                {/* 5. FOOTER ZONE: VIEWS TRAY (For my status) */}
                {current.userEmail === currentUserEmail && (
                  <div className="absolute bottom-4 inset-x-0 flex flex-col items-center justify-center z-40">
                    <button 
                      onClick={() => setShowViewerDetails(!showViewerDetails)}
                      className="bg-black/60 hover:bg-black/80 backdrop-blur px-4 py-1.5 rounded-full text-white text-[10px] font-bold flex items-center gap-1.5 border border-white/10 shadow-lg active:scale-95 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#00a884]" />
                      <span>{current.views.length} views</span>
                      <span className={`transition-transform duration-200 ${showViewerDetails ? 'rotate-180' : ''}`}>▲</span>
                    </button>
                    
                    {/* Viewer list sliding sheet */}
                    {showViewerDetails && (
                      <div className="absolute bottom-10 bg-[#111b21] border border-[#222d34] w-[90%] rounded-2xl p-3.5 max-h-52 overflow-y-auto shadow-2xl animate-slideUp">
                        <div className="flex items-center justify-between border-b border-[#222d34]/60 pb-2 mb-2">
                          <span className="text-[10px] text-[#8696a0] uppercase font-mono font-bold tracking-wider">
                            Viewed by ({current.views.length})
                          </span>
                          <button onClick={() => setShowViewerDetails(false)} className="text-[10px] text-[#00a884] hover:underline font-bold font-sans">
                            Hide
                          </button>
                        </div>

                        {current.views.length > 0 ? (
                          <div className="space-y-2.5">
                            {current.views.map((viewer, vidx) => (
                              <div key={vidx} className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <img src={viewer.userAvatar} alt={viewer.userName} className="w-7 h-7 rounded-full object-cover" />
                                  <div>
                                    <span className="text-xs font-semibold text-white block">{viewer.userName}</span>
                                    <span className="text-[8px] text-[#8696a0] block font-mono">{viewer.userEmail}</span>
                                  </div>
                                </div>
                                <span className="text-[9px] text-[#8696a0] font-mono">
                                  {new Date(viewer.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-[#8696a0] text-center py-2">No views yet. Share link with friends!</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })()}
        </div>
      )}

    </div>
  );
}
