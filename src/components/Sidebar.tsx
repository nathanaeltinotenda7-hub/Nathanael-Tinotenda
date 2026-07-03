import React from "react";
import { 
  MessageSquare, 
  Phone, 
  Settings, 
  ShieldAlert, 
  Wifi, 
  WifiOff, 
  User, 
  Sparkles,
  CircleDashed,
  Briefcase,
  HelpCircle,
  Menu
} from "lucide-react";

interface SidebarProps {
  activeTab: 'feed' | 'chats' | 'calls' | 'settings' | 'admin' | 'profile';
  setActiveTab: (tab: 'feed' | 'chats' | 'calls' | 'settings' | 'admin' | 'profile') => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  isOwnerMode: boolean;
  setIsOwnerMode: (owner: boolean) => void;
  userEmail: string;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  isOffline,
  setIsOffline,
  isOwnerMode,
  setIsOwnerMode,
  userEmail
}: SidebarProps) {
  const isOwner = userEmail === "nathanaeltinotenda7@gmail.com";

  return (
    <>
      {/* 1. Desktop Vertical Left Rail (Hidden on mobile, block on md screens and up) */}
      <div 
        className="hidden md:flex w-64 bg-[#111b21] text-[#e9edef] flex-col border-r border-[#222d34] h-full select-none" 
        id="app-sidebar-desktop"
      >
        {/* WhatsApp Brand Header */}
        <div className="p-4 bg-[#202c33] flex items-center justify-between border-b border-[#222d34]/40">
          <div className="flex items-center space-x-3">
            <div className="bg-[#00a884] p-1.5 rounded-full shadow-md shadow-emerald-950/20">
              <Sparkles className="w-5 h-5 text-[#111b21]" />
            </div>
            <div>
              <h1 className="font-sans font-bold tracking-tight text-md text-[#e9edef] flex items-center gap-1">
                WhatsApp
                <span className="text-[10px] bg-[#2a3942] text-[#00a884] px-1.5 py-0.5 rounded-md font-mono font-bold">Web</span>
              </h1>
              <p className="text-[10px] text-[#8696a0] font-mono tracking-wider">
                CONNECTIONS SYSTEM
              </p>
            </div>
          </div>
        </div>

        {/* Network & Simulation Link Panel */}
        <div className="p-3 mx-3 mt-3 rounded-xl bg-[#202c33] border border-[#222d34] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#8696a0] font-medium font-sans">Network Status</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
              isOffline ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-[#00a884]/10 text-[#00a884] border border-[#00a884]/20"
            }`}>
              {isOffline ? <WifiOff className="w-2.5 h-2.5 mr-1" /> : <Wifi className="w-2.5 h-2.5 mr-1" />}
              {isOffline ? "OFFLINE" : "ONLINE"}
            </span>
          </div>

          <button
            onClick={() => setIsOffline(!isOffline)}
            id="btn-toggle-offline-desktop"
            className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 ${
              isOffline 
                ? "bg-[#00a884] hover:bg-[#008f72] text-[#111b21]" 
                : "bg-[#2a3942] hover:bg-[#374955] text-[#e9edef] border border-[#374955]"
            }`}
          >
            <span className="text-[11px]">{isOffline ? "Go Online (Sync Cloud)" : "Go Offline (Buffer Local)"}</span>
          </button>
        </div>

        {/* Desktop Menu Navigation List */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-[9px] font-mono font-bold text-[#8696a0] uppercase tracking-widest mb-2.5">
            CHATS & UPDATES
          </p>

          <button
            onClick={() => setActiveTab('chats')}
            id="nav-chats-desktop"
            className={`w-full flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-150 text-xs font-semibold ${
              activeTab === 'chats'
                ? "bg-[#2a3942] text-white border-l-4 border-[#00a884]"
                : "text-[#8696a0] hover:bg-[#202c33]/60 hover:text-[#e9edef]"
            }`}
          >
            <MessageSquare className={`w-4 h-4 ${activeTab === 'chats' ? 'text-[#00a884]' : 'text-[#8696a0]'}`} />
            <div className="flex-1 flex justify-between items-center">
              <span>Chats & AI</span>
              <span className="bg-[#00a884]/15 text-[9px] text-[#00a884] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                META
              </span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('feed')}
            id="nav-feed-desktop"
            className={`w-full flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-150 text-xs font-semibold ${
              activeTab === 'feed'
                ? "bg-[#2a3942] text-white border-l-4 border-[#00a884]"
                : "text-[#8696a0] hover:bg-[#202c33]/60 hover:text-[#e9edef]"
            }`}
          >
            <CircleDashed className={`w-4 h-4 ${activeTab === 'feed' ? 'text-[#00a884]' : 'text-[#8696a0]'}`} />
            <div className="flex-1 flex justify-between items-center">
              <span>Status & Feed</span>
              <span className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse" />
            </div>
          </button>

          <button
            onClick={() => setActiveTab('calls')}
            id="nav-calls-desktop"
            className={`w-full flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-150 text-xs font-semibold ${
              activeTab === 'calls'
                ? "bg-[#2a3942] text-white border-l-4 border-[#00a884]"
                : "text-[#8696a0] hover:bg-[#202c33]/60 hover:text-[#e9edef]"
            }`}
          >
            <Phone className={`w-4 h-4 ${activeTab === 'calls' ? 'text-[#00a884]' : 'text-[#8696a0]'}`} />
            <span>Voice & Video Calls</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            id="nav-profile-desktop"
            className={`w-full flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-150 text-xs font-semibold ${
              activeTab === 'profile'
                ? "bg-[#2a3942] text-white border-l-4 border-[#00a884]"
                : "text-[#8696a0] hover:bg-[#202c33]/60 hover:text-[#e9edef]"
            }`}
          >
            <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-[#00a884]' : 'text-[#8696a0]'}`} />
            <span>Profile Status</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            id="nav-settings-desktop"
            className={`w-full flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-150 text-xs font-semibold ${
              activeTab === 'settings'
                ? "bg-[#2a3942] text-white border-l-4 border-[#00a884]"
                : "text-[#8696a0] hover:bg-[#202c33]/60 hover:text-[#e9edef]"
            }`}
          >
            <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-[#00a884]' : 'text-[#8696a0]'}`} />
            <span>Settings</span>
          </button>

          {/* Admin styled as Business Tools */}
          <p className="pt-4 px-3 text-[9px] font-mono font-bold text-[#8696a0] uppercase tracking-widest mb-2.5">
            BUSINESS SOLUTIONS
          </p>

          <button
            onClick={() => setActiveTab('admin')}
            id="nav-admin-desktop"
            className={`w-full flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-150 text-xs font-semibold ${
              activeTab === 'admin'
                ? "bg-[#2a3942] text-white border-l-4 border-amber-500"
                : "text-[#8696a0] hover:bg-[#202c33]/60 hover:text-[#e9edef]"
            }`}
          >
            <Briefcase className={`w-4 h-4 ${activeTab === 'admin' ? 'text-amber-400' : 'text-[#8696a0]'}`} />
            <div className="flex flex-col items-start min-w-0">
              <span className="font-semibold text-[11px]">Business Center</span>
              <span className="text-[9px] text-[#8696a0] truncate max-w-[140px]">
                {isOwner ? "Nathanael (Verified)" : "Guest Access"}
              </span>
            </div>
          </button>
        </nav>

        {/* Desktop Footer Card */}
        <div className="p-3 border-t border-[#222d34]/60 bg-[#1f2c34]/30 flex flex-col space-y-2">
          <div className="flex items-center space-x-3">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-[#202c33] border border-[#222d34] flex items-center justify-center text-[#00a884] font-bold text-xs">
                {isOwner ? "NA" : "GU"}
              </div>
              <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[#111b21] ${
                isOffline ? "bg-red-500" : "bg-[#00a884]"
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-[#e9edef] truncate">
                {isOwner ? "Nathanael (Owner)" : "Guest User"}
              </h4>
              <p className="text-[9px] text-[#8696a0] truncate" title={userEmail}>
                {userEmail}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1.5 border-t border-[#222d34]/50 text-[10px]">
            <span className="text-[#8696a0] text-[9px]">Developer Override:</span>
            <button
              onClick={() => setIsOwnerMode(!isOwnerMode)}
              id="toggle-owner-mode-desktop"
              className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold transition-colors ${
                isOwnerMode 
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                  : "bg-[#2a3942] text-[#8696a0]"
              }`}
            >
              {isOwnerMode ? "Owner View" : "Guest View"}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Mobile Bottom Bar Navigation (Visible on mobile, hidden on md and up) */}
      <div 
        className="md:hidden w-full bg-[#111b21] border-t border-[#222d34] px-1 py-1.5 flex items-center justify-around z-40 select-none shrink-0"
        id="app-sidebar-mobile"
      >
        <button
          onClick={() => setActiveTab('chats')}
          id="nav-chats-mobile"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'chats' ? "text-[#00a884]" : "text-[#8696a0]"
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#00a884] animate-ping" />
          </div>
          <span className="text-[9px] font-sans font-bold mt-1 tracking-wider uppercase">Chats</span>
        </button>

        <button
          onClick={() => setActiveTab('feed')}
          id="nav-feed-mobile"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'feed' ? "text-[#00a884]" : "text-[#8696a0]"
          }`}
        >
          <CircleDashed className="w-5 h-5" />
          <span className="text-[9px] font-sans font-bold mt-1 tracking-wider uppercase">Status</span>
        </button>

        <button
          onClick={() => setActiveTab('calls')}
          id="nav-calls-mobile"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'calls' ? "text-[#00a884]" : "text-[#8696a0]"
          }`}
        >
          <Phone className="w-5 h-5" />
          <span className="text-[9px] font-sans font-bold mt-1 tracking-wider uppercase">Calls</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          id="nav-profile-mobile"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'profile' ? "text-[#00a884]" : "text-[#8696a0]"
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[9px] font-sans font-bold mt-1 tracking-wider uppercase">Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          id="nav-admin-mobile"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'admin' ? "text-amber-400" : "text-[#8696a0]"
          }`}
        >
          <Briefcase className="w-5 h-5" />
          <span className="text-[9px] font-sans font-bold mt-1 tracking-wider uppercase">Business</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          id="nav-settings-mobile"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'settings' ? "text-[#00a884]" : "text-[#8696a0]"
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[9px] font-sans font-bold mt-1 tracking-wider uppercase">Settings</span>
        </button>
      </div>
    </>
  );
}

