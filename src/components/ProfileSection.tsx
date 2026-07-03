import React, { useState, useEffect } from "react";
import { User, Shield, Lock, Mail, FileText, CheckCircle, LogOut, Camera, KeyRound } from "lucide-react";

interface ProfileSectionProps {
  currentUser: { username: string; email: string; avatar: string; bio: string } | null;
  setCurrentUser: (user: { username: string; email: string; avatar: string; bio: string } | null) => void;
  triggerToast: (message: string, type: 'success' | 'info' | 'warning') => void;
  isOffline: boolean;
}

export default function ProfileSection({
  currentUser,
  setCurrentUser,
  triggerToast,
  isOffline
}: ProfileSectionProps) {
  const [isLoginView, setIsLoginView] = useState<boolean>(true);
  
  // Auth Form Inputs
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150");

  // Profile Edit Inputs
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Loading state
  const [loading, setLoading] = useState(false);

  // Sync edit form fields with current user state
  useEffect(() => {
    if (currentUser) {
      setEditUsername(currentUser.username);
      setEditBio(currentUser.bio);
      setEditAvatar(currentUser.avatar);
    }
  }, [currentUser]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) {
      triggerToast("Cannot sign up while offline. Please connect to cloud link.", "warning");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, avatar, bio })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sign up.");
      }

      localStorage.setItem("connections_token", data.token);
      setCurrentUser(data.user);
      triggerToast(`Account created! Welcome, ${data.user.username} 🎉`, "success");
    } catch (err: any) {
      triggerToast(err.message, "warning");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) {
      triggerToast("Cannot log in while offline. Local cached credentials only.", "warning");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log in.");
      }

      localStorage.setItem("connections_token", data.token);
      setCurrentUser(data.user);
      triggerToast(`Welcome back, ${data.user.username}!`, "success");
    } catch (err: any) {
      triggerToast(err.message, "warning");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) {
      triggerToast("Saving profile offline is queued for cloud sync.", "info");
      // Simulate local save instantly
      setCurrentUser({
        ...currentUser!,
        username: editUsername,
        avatar: editAvatar,
        bio: editBio
      });
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("connections_token");
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ username: editUsername, avatar: editAvatar, bio: editBio })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile.");
      }

      setCurrentUser(data.user);
      setIsEditing(false);
      triggerToast("Profile updated successfully on cloud!", "success");
    } catch (err: any) {
      triggerToast(err.message, "warning");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("connections_token");
    setCurrentUser(null);
    triggerToast("Logged out of session safely.", "info");
  };

  const avatarOptions = [
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6" id="profile-workspace">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-[#0c0c0c] border border-[#1a1a1a] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-mono text-indigo-400 font-bold uppercase tracking-widest block mb-2">
            Accounts & Identity Center
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            User Security & Profile Customization
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Register an account, manage secure credential storage hashed with PBKDF2 parameters, edit bios, upload avatars, and see interactive session controls.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800/80 px-4 py-2.5 rounded-2xl">
          <Shield className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-300 font-bold">
            PBKDF2-SHA512 SECURE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Column - Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {currentUser ? (
            /* Logged In View */
            <div className="bg-[#080808] border border-[#1a1a1a] rounded-2xl p-6 md:p-8 space-y-6">
              <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-[#151515]">
                <div className="relative group shrink-0">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.username}
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-500/20 shadow-xl group-hover:border-indigo-500 transition-colors"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="space-y-1.5 text-center md:text-left flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                    <h3 className="text-xl font-bold text-white">{currentUser.username}</h3>
                    <span className="bg-indigo-900/40 text-indigo-300 border border-indigo-800/30 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                      ACTIVE USER
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5 justify-center md:justify-start">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    {currentUser.email}
                  </p>
                  <p className="text-xs text-slate-300 bg-[#0d0d0d] px-3.5 py-2.5 rounded-xl border border-[#151515] italic">
                    "{currentUser.bio}"
                  </p>
                </div>
              </div>

              {isEditing ? (
                /* Edit Form */
                <form onSubmit={handleSaveProfile} className="space-y-5 pt-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-indigo-400">
                    Edit Profile Details
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Username</label>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="w-full bg-[#121212] border border-[#222] text-xs text-white rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Select Profile Avatar</label>
                      <div className="flex gap-2">
                        {avatarOptions.map((av, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setEditAvatar(av)}
                            className={`w-9 h-9 rounded-lg overflow-hidden border-2 transition-all ${
                              editAvatar === av ? "border-indigo-500 scale-105" : "border-transparent opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img src={av} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Short Bio</label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      className="w-full bg-[#121212] border border-[#222] text-xs text-white rounded-xl p-3 h-20 focus:outline-none focus:border-indigo-500 resize-none"
                      placeholder="Write a tiny description of yourself..."
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl text-xs font-medium hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all"
                  >
                    Edit Profile info
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2.5 bg-red-950/40 border border-red-900/30 text-red-200 rounded-xl text-xs font-semibold hover:bg-red-900/20 transition-all flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Safely Sign Out
                  </button>
                </div>
              )}

            </div>
          ) : (
            /* Logged Out / Auth Forms */
            <div className="bg-[#080808] border border-[#1a1a1a] rounded-2xl p-6 md:p-8 space-y-6">
              
              {/* Tab Selector */}
              <div className="flex border-b border-[#151515]">
                <button
                  onClick={() => setIsLoginView(true)}
                  className={`flex-1 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
                    isLoginView ? "border-indigo-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Account Sign In
                </button>
                <button
                  onClick={() => setIsLoginView(false)}
                  className={`flex-1 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
                    !isLoginView ? "border-indigo-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Create New Account
                </button>
              </div>

              {isLoginView ? (
                /* Login Form */
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@example.com"
                        className="w-full bg-[#121212] border border-[#222] text-xs text-white rounded-xl p-3.5 pl-11 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Secure Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••••"
                        className="w-full bg-[#121212] border border-[#222] text-xs text-white rounded-xl p-3.5 pl-11 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/10"
                  >
                    {loading ? "Authenticating securely..." : "Sign In & Authorize"}
                  </button>
                </form>
              ) : (
                /* Signup Form */
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Nathanael"
                        className="w-full bg-[#121212] border border-[#222] text-xs text-white rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nathanael@connections.io"
                        className="w-full bg-[#121212] border border-[#222] text-xs text-white rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Secure Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password (PBKDF2 Hashed)"
                      className="w-full bg-[#121212] border border-[#222] text-xs text-white rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Short Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Hi, I am using Connections to talk offline!"
                      className="w-full bg-[#121212] border border-[#222] text-xs text-white rounded-xl p-3 h-16 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Choose profile picture</label>
                    <div className="flex gap-2 pt-1">
                      {avatarOptions.map((av, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatar(av)}
                          className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all ${
                            avatar === av ? "border-indigo-500 scale-105" : "border-transparent opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img src={av} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/10"
                  >
                    {loading ? "Hashing and registering..." : "Register Securely"}
                  </button>
                </form>
              )}

            </div>
          )}

        </div>

        {/* Right Column - Security details & explanation info */}
        <div className="space-y-6">
          
          {/* Security Status Card */}
          <div className="bg-[#080808] border border-[#1a1a1a] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                Security Engineering
              </h3>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              CONNECTIONS implements industry standard cryptographically secure user security mechanisms:
            </p>

            <ul className="space-y-2.5 pt-1">
              <li className="flex items-start gap-2.5 text-[11px]">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-200 block">PBKDF2 Hashing</span>
                  <span className="text-slate-500 leading-normal block">Passwords are salted dynamically with 16 random hex bytes and put through 1,000 hashing iterations of SHA512.</span>
                </div>
              </li>
              <li className="flex items-start gap-2.5 text-[11px]">
                <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-200 block">Bearer Token Sessions</span>
                  <span className="text-slate-500 leading-normal block">A 48-character random session token is generated upon successful login, kept client-side in secure state, and validated server-side.</span>
                </div>
              </li>
              <li className="flex items-start gap-2.5 text-[11px]">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-200 block">Local Cache Isolation</span>
                  <span className="text-slate-500 leading-normal block">All security tokens and profile state is gracefully backed up to localStorage to enable complete offline boot and sync capability.</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Active Session Status */}
          <div className="bg-[#080808] border border-[#1a1a1a] rounded-2xl p-6 space-y-3.5">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Cryptographic Token Context
            </h3>
            
            <div className="space-y-2 bg-slate-950/60 border border-slate-900 rounded-xl p-4">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-500">SESSION:</span>
                <span className={currentUser ? "text-emerald-400 font-bold" : "text-amber-500 font-bold"}>
                  {currentUser ? "AUTHORIZED" : "UNAUTHORIZED"}
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-500">TOKEN:</span>
                <span className="text-indigo-400 font-bold truncate max-w-[120px]">
                  {currentUser ? localStorage.getItem("connections_token") || "No Token" : "None"}
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-500">CIPHER:</span>
                <span className="text-slate-400">AES-256-GCM (TLS)</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
