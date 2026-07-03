import React, { useState } from "react";
import { CallLog, AppSettings } from "../types";
import { 
  Phone, 
  Video, 
  PhoneCall, 
  PhoneMissed, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Search, 
  Check, 
  Plus, 
  Sparkles,
  Lock,
  Volume2,
  Mic,
  MicOff,
  Camera,
  X,
  PhoneOff
} from "lucide-react";

interface CallsSectionProps {
  calls: CallLog[];
  setCalls: React.Dispatch<React.SetStateAction<CallLog[]>>;
  settings: AppSettings;
  triggerToast?: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

export default function CallsSection({
  calls,
  setCalls,
  settings,
  triggerToast
}: CallsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [activeCallSimulation, setActiveCallSimulation] = useState<{
    name: string;
    avatar: string;
    type: 'voice' | 'video';
    status: 'connecting' | 'connected' | 'ended';
    elapsedSeconds: number;
  } | null>(null);

  const filteredCalls = calls.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startCall = (name: string, type: 'voice' | 'video', avatar: string) => {
    setActiveCallSimulation({
      name,
      avatar,
      type,
      status: 'connecting',
      elapsedSeconds: 0
    });

    // Simulate connection progress after 1.5 seconds
    setTimeout(() => {
      setActiveCallSimulation(prev => {
        if (!prev || prev.status === 'ended') return prev;
        return { ...prev, status: 'connected' };
      });

      // Add actual call to the recent call history log
      const newLog: CallLog = {
        id: `cl_${Date.now()}`,
        name,
        avatar,
        type,
        direction: 'outgoing',
        timestamp: "Just now",
        duration: "00:15"
      };
      setCalls(prev => [newLog, ...prev]);

      if (triggerToast) {
        triggerToast(`Connected with ${name} via WhatsApp VoIP! 📞`, "success");
      }
    }, 1500);
  };

  const endCall = () => {
    if (activeCallSimulation) {
      setActiveCallSimulation(prev => {
        if (!prev) return null;
        return { ...prev, status: 'ended' };
      });
      setTimeout(() => {
        setActiveCallSimulation(null);
      }, 800);
    }
  };

  const getDirectionIcon = (direction: 'incoming' | 'outgoing' | 'missed') => {
    switch (direction) {
      case 'incoming':
        return <PhoneIncoming className="w-3.5 h-3.5 text-[#00a884]" />;
      case 'outgoing':
        return <PhoneOutgoing className="w-3.5 h-3.5 text-[#53bdeb]" />;
      case 'missed':
        return <PhoneMissed className="w-3.5 h-3.5 text-red-500" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#0b141a] text-[#e9edef] overflow-hidden h-full" id="calls-container">
      
      {/* Calls Panel Left */}
      <div className="flex-1 flex flex-col border-r border-[#222d34]/60 p-4 md:p-6 space-y-5 overflow-y-auto h-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-md font-bold text-[#e9edef] flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-[#00a884]" />
              Call History
            </h2>
            <p className="text-[11px] text-[#8696a0]">Initiate encrypted peer voice or video connections</p>
          </div>

          <button
            onClick={() => startCall("Nathanael (Owner)", "video", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150")}
            id="btn-fast-dial-owner"
            className="bg-[#00a884] hover:bg-[#008f72] text-[#111b21] text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-md self-start"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Call Nathanael (Owner)</span>
          </button>
        </div>

        {/* Quick Quick dial presets */}
        <div className="bg-[#111b21] border border-[#222d34]/60 rounded-2xl p-4 shrink-0">
          <span className="text-[10px] font-mono font-bold uppercase text-[#00a884] tracking-wider block mb-3">
            Quick Dial Network Presets
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { name: "Sarah Jenkins", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
              { name: "Alex Rivers", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
              { name: "Zoe Chen", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150" }
            ].map(user => (
              <div key={user.name} className="bg-[#202c33]/50 border border-[#222d34]/40 rounded-xl p-3 flex flex-col items-center text-center space-y-2 hover:bg-[#202c33]/80 transition-colors">
                <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border border-[#222d34]" referrerPolicy="no-referrer" />
                <span className="text-xs font-bold text-[#e9edef] truncate w-full">{user.name}</span>
                <div className="flex items-center gap-1.5 w-full pt-0.5">
                  <button
                    onClick={() => startCall(user.name, 'voice', user.avatar)}
                    className="flex-1 bg-[#202c33] hover:bg-[#00a884] text-[#8696a0] hover:text-[#111b21] py-1 rounded text-[10px] font-bold border border-[#222d34]/60 transition-colors"
                  >
                    Voice
                  </button>
                  <button
                    onClick={() => startCall(user.name, 'video', user.avatar)}
                    className="flex-1 bg-[#202c33] hover:bg-[#00a884] text-[#8696a0] hover:text-[#111b21] py-1 rounded text-[10px] font-bold border border-[#222d34]/60 transition-colors"
                  >
                    Video
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent logs search and list */}
        <div className="space-y-3.5 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[10px] font-mono font-bold uppercase text-[#8696a0] tracking-wider">
              Recent Call Logs
            </span>
            <div className="relative w-44">
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111b21] border border-transparent rounded-lg py-1 pl-7 pr-3 text-[11px] text-[#e9edef] focus:outline-none placeholder-[#8696a0]"
              />
              <Search className="w-3 h-3 text-[#8696a0] absolute left-2.5 top-2" />
            </div>
          </div>

          <div className="bg-[#111b21] border border-[#222d34]/55 rounded-2xl divide-y divide-[#222d34]/40 overflow-y-auto flex-1">
            {filteredCalls.map(call => (
              <div key={call.id} className="p-3 md:p-4 flex items-center justify-between hover:bg-[#202c33]/40 transition-colors select-none">
                <div className="flex items-center gap-3">
                  <img src={call.avatar} className="w-9 h-9 rounded-full object-cover border border-[#222d34]" referrerPolicy="no-referrer" />
                  <div>
                    <h5 className="text-xs font-bold text-[#e9edef]">{call.name}</h5>
                    <div className="flex items-center gap-1 mt-0.5 select-none">
                      {getDirectionIcon(call.direction)}
                      <span className="text-[10px] text-[#8696a0] capitalize">{call.direction}</span>
                      <span className="text-[10px] text-[#8696a0]">•</span>
                      <span className="text-[10px] text-[#8696a0]">{call.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {call.duration && (
                    <span className="text-[10px] font-mono text-[#8696a0] bg-[#202c33]/60 px-2 py-0.5 rounded border border-[#222d34]/40">
                      {call.duration}
                    </span>
                  )}
                  <button
                    onClick={() => startCall(call.name, call.type, call.avatar)}
                    className="p-2 text-[#8696a0] hover:text-[#00a884] hover:bg-[#202c33]/70 rounded-full transition-colors"
                  >
                    {call.type === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}

            {filteredCalls.length === 0 && (
              <p className="p-8 text-center text-xs text-[#8696a0]">No calls registered in recent history.</p>
            )}
          </div>
        </div>
      </div>

      {/* Connection Properties side column (Right) */}
      <div className="w-full md:w-80 p-4 md:p-6 space-y-5 overflow-y-auto shrink-0 bg-[#111b21] h-full flex flex-col">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#00a884] uppercase tracking-widest mb-3 block">
            Line Parameters
          </span>
          <div className="bg-[#202c33]/40 border border-[#222d34]/60 rounded-2xl p-4 space-y-4">
            <div className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#8696a0]">Video Resolution</span>
                <span className="text-[#00a884] font-mono font-bold">{settings.videoResolution}</span>
              </div>
              <p className="text-[10px] text-[#8696a0] leading-snug">Configured in Connections settings pane.</p>
            </div>

            <div className="border-t border-[#222d34]/40 pt-3 space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#8696a0]">Audio Codec</span>
                <span className="text-[#00a884] font-mono font-bold">{settings.audioCodec}</span>
              </div>
              <p className="text-[10px] text-[#8696a0] leading-snug">Optimized Opus stream with echo canceler filters.</p>
            </div>

            <div className="border-t border-[#222d34]/40 pt-3 space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#8696a0]">Video Codec</span>
                <span className="text-[#00a884] font-mono font-bold">{settings.videoCodec}</span>
              </div>
              <p className="text-[10px] text-[#8696a0] leading-snug">Supports keyframe compression based on band quality.</p>
            </div>

            <div className="border-t border-[#222d34]/40 pt-3 space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#8696a0]">Noise Reduction</span>
                <span className="text-[#00a884] text-[9px] bg-[#00a884]/10 border border-[#00a884]/25 px-2 py-0.5 rounded font-mono uppercase font-bold">
                  {settings.noiseCancellation ? "ACTIVE" : "DISABLED"}
                </span>
              </div>
              <p className="text-[10px] text-[#8696a0] leading-snug">Filters ambient background sounds.</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#00a884]/10 to-transparent p-4.5 rounded-2xl border border-[#00a884]/20 space-y-1.5 flex-1">
          <span className="text-xs font-bold text-[#e9edef] flex items-center gap-1.5 select-none">
            <Lock className="w-3.5 h-3.5 text-[#00a884]" />
            Secure Peer Connection
          </span>
          <p className="text-[11px] text-[#8696a0] leading-relaxed">
            All outbound calls initiate a secure handshaking routine that encrypts standard audio packets to ensure private, leak-proof conversations.
          </p>
        </div>
      </div>

      {/* Video / Voice Call Active overlay styled like true WhatsApp Dial Screen */}
      {activeCallSimulation && (
        <div className="fixed inset-0 bg-[#0b141a] z-50 flex flex-col items-center justify-between p-6 md:p-10 animate-fadeIn">
          
          {/* Header */}
          <div className="w-full flex items-center justify-between max-w-xl text-slate-400 select-none">
            <span className="text-[10px] font-mono flex items-center gap-1.5 bg-[#202c33] border border-[#222d34] px-3 py-1 rounded-full text-[#e9edef]">
              <Lock className="w-3 h-3 text-[#00a884]" />
              End-to-End Encrypted
            </span>
            <span className="text-[10px] font-bold text-[#111b21] uppercase bg-[#00a884] px-2.5 py-0.5 rounded-full tracking-wider">
              {activeCallSimulation.type} CALL
            </span>
          </div>

          {/* Main Display: Video stream mock vs voice profile */}
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 max-w-md w-full relative">
            
            {activeCallSimulation.type === 'video' && activeCallSimulation.status === 'connected' && !isVideoOff ? (
              <div className="w-full aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden border border-[#222d34] shadow-2xl relative">
                {/* Simulated webcam video feed */}
                <img 
                  src={activeCallSimulation.avatar} 
                  alt="Webcam stream" 
                  className="w-full h-full object-cover opacity-90 filter brightness-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* Self preview thumbnail inside top-right */}
                <div className="absolute top-4 right-4 w-28 h-20 bg-slate-950 border border-[#222d34] rounded-xl overflow-hidden shadow-lg">
                  <div className="w-full h-full bg-[#111b21] flex items-center justify-center text-[10px] font-mono text-[#8696a0]">
                    My Camera
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 bg-black/70 border border-[#222d34]/60 rounded-xl px-3 py-1 text-[10px] font-mono text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse" />
                  <span>VOIP HD • VP9</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <img
                    src={activeCallSimulation.avatar}
                    alt={activeCallSimulation.name}
                    className="w-28 h-28 rounded-full object-cover border-4 border-[#00a884]/40 shadow-2xl p-1"
                    referrerPolicy="no-referrer"
                  />
                  {activeCallSimulation.status === 'connecting' && (
                    <div className="absolute inset-0 rounded-full border-4 border-t-[#00a884] animate-spin" />
                  )}
                </div>
                <div className="text-center select-none">
                  <h3 className="text-lg font-bold text-white">{activeCallSimulation.name}</h3>
                  <p className="text-xs text-[#00a884] tracking-widest font-mono uppercase mt-1">
                    {activeCallSimulation.status === 'connecting' ? 'RINGING...' : 'CONNECTED'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Controls Footer */}
          <div className="w-full max-w-md flex items-center justify-center gap-5 pb-4 select-none">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3.5 rounded-full border transition-colors ${
                isMuted 
                  ? 'bg-amber-600 text-white border-amber-500' 
                  : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] border-[#222d34]'
              }`}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button 
              onClick={endCall}
              id="btn-disconnect-call"
              className="p-4 bg-red-600 hover:bg-red-500 text-white rounded-full transition-colors flex items-center justify-center shadow-xl hover:scale-105"
              title="End Call"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-3.5 rounded-full border transition-colors ${
                isVideoOff 
                  ? 'bg-amber-600 text-white border-amber-500' 
                  : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] border-[#222d34]'
              }`}
              title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
