import React, { useState } from "react";
import { Post, Story, Comment } from "../types";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Image as ImageIcon, 
  Send, 
  X, 
  User, 
  CloudLightning,
  CircleDashed,
  Plus,
  Lock,
  MessageSquareQuote
} from "lucide-react";
import VoiceInputButton from "./VoiceInputButton";

interface FeedSectionProps {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  stories: Story[];
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
  isOffline: boolean;
  addPost: (content: string, mediaUrl?: string) => void;
  currentUserEmail: string;
  triggerToast?: (message: string, type?: 'success' | 'info' | 'warning') => void;
  isSyncing?: boolean;
}

const SAMPLE_PHOTOS = [
  { name: "Coffee Workspace", url: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800" },
  { name: "Sunny Coastline", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800" },
  { name: "Neon Tech", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800" },
  { name: "Forest Retreat", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800" }
];

export default function FeedSection({
  posts,
  setPosts,
  stories,
  setStories,
  isOffline,
  addPost,
  currentUserEmail,
  triggerToast,
  isSyncing = false
}: FeedSectionProps) {
  const [newPostText, setNewPostText] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  
  // Active story viewer state
  const [activeStory, setActiveStory] = useState<Story | null>(null);

  // New comment states mapped by Post ID
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim() && !selectedPhoto) return;

    addPost(newPostText, selectedPhoto || undefined);
    setNewPostText("");
    setSelectedPhoto(null);
    setShowPhotoPicker(false);
  };

  const handleLike = async (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          hasLiked: !post.hasLiked,
          likes: post.hasLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));

    if (!isOffline) {
      try {
        const token = localStorage.getItem("connections_token");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        await fetch("/api/posts/interact", {
          method: "POST",
          headers,
          body: JSON.stringify({ postId, action: "like" })
        });
        if (triggerToast) {
          triggerToast("Meta AI recommendation engine updated with your like preference! ✨", "success");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      if (triggerToast) {
        triggerToast("Liked offline. Interaction saved in local cache.", "info");
      }
    }
  };

  const handleAddComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    const newComment: Comment = {
      id: `c_${Date.now()}`,
      authorName: currentUserEmail === "nathanaeltinotenda7@gmail.com" ? "Nathanael (Owner)" : "Guest User",
      authorAvatar: currentUserEmail === "nathanaeltinotenda7@gmail.com" 
        ? "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" 
        : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      content: text,
      timestamp: "Just now"
    };

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, newComment]
        };
      }
      return post;
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: "" }));

    if (!isOffline) {
      try {
        const token = localStorage.getItem("connections_token");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        await fetch("/api/posts/interact", {
          method: "POST",
          headers,
          body: JSON.stringify({ postId, action: "comment", commentText: text })
        });
        if (triggerToast) {
          triggerToast("Comment added! Meta AI learning engine updated.", "success");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      if (triggerToast) {
        triggerToast("Comment saved offline. Pending cloud sync.", "info");
      }
    }
  };

  const viewStory = (story: Story) => {
    setActiveStory(story);
    // Mark story as viewed
    setStories(prev => prev.map(s => s.id === story.id ? { ...s, isViewed: true } : s));
  };

  return (
    <div className="flex-1 bg-[#0b141a] flex flex-col overflow-y-auto h-full" id="feed-container">
      
      {/* Feed/Updates Page Header */}
      <div className="bg-[#202c33] px-6 py-4 border-b border-[#222d34]/60 flex items-center justify-between sticky top-0 z-10 select-none shadow-md shrink-0">
        <div>
          <h2 className="font-sans font-bold text-md text-[#e9edef] flex items-center gap-2">
            <CircleDashed className="w-5 h-5 text-[#00a884] animate-pulse" />
            Updates
          </h2>
          <p className="text-[11px] text-[#8696a0]">View Status stories and broadcast community channels</p>
        </div>
        
        {isOffline && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1 flex items-center text-red-400 text-[11px] gap-1.5 animate-pulse">
            <CloudLightning className="w-3.5 h-3.5" />
            <span className="font-mono font-bold uppercase tracking-wider">OFFLINE BUFFER</span>
          </div>
        )}
      </div>

      {/* Main Grid: Stories & Posts */}
      <div className="p-4 md:p-6 max-w-2xl mx-auto w-full space-y-5">
        
        {/* Horizontal Status Updates/Stories */}
        <div className="bg-[#111b21] rounded-2xl p-4 border border-[#222d34]/60 shadow-xl">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00a884] block mb-3.5">
            Status Updates
          </span>
          
          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-none select-none">
            {/* Self Create Story Placeholder */}
            <div 
              onClick={() => {
                if (triggerToast) triggerToast("Tap 'Attach Curated Photo' below to publish a Status Update!", "info");
              }}
              className="flex-shrink-0 flex flex-col items-center cursor-pointer group"
            >
              <div className="relative w-14 h-14 rounded-full bg-[#202c33] border border-[#222d34] p-0.5 flex items-center justify-center transition-transform group-hover:scale-105">
                <div className="w-full h-full rounded-full bg-[#2a3942] flex items-center justify-center text-[#00a884] font-bold text-lg border border-dashed border-[#00a884]/45">
                  <Plus className="w-5 h-5 text-[#00a884]" />
                </div>
              </div>
              <span className="text-[11px] font-medium text-[#e9edef] mt-1.5">My Status</span>
            </div>

            {/* Simulated WhatsApp Stories */}
            {stories.map(story => (
              <button
                key={story.id}
                onClick={() => viewStory(story)}
                id={`story-${story.id}`}
                className="flex-shrink-0 flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                <div className={`relative w-14 h-14 rounded-full p-[2px] transition-transform duration-200 group-hover:scale-105 ${
                  story.isViewed ? "border-2 border-slate-600" : "border-[2.5px] border-[#00a884]"
                }`}>
                  <img
                    src={story.avatar}
                    alt={story.userName}
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-[11px] font-semibold text-[#8696a0] group-hover:text-[#e9edef] mt-1.5 truncate w-14 text-center transition-colors">
                  {story.userName.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* WhatsApp-Style Broadcast Composer */}
        <div className="bg-[#111b21] rounded-2xl p-4 border border-[#222d34]/60 shadow-xl" id="post-composer">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8696a0] block mb-3">
            Share Broadcast Update
          </span>

          <form onSubmit={handleCreatePost} className="space-y-3">
            <div className="flex space-x-3">
              <div className="w-9 h-9 rounded-full bg-[#202c33] border border-[#222d34] flex items-center justify-center text-[#00a884] font-extrabold flex-shrink-0 text-xs select-none">
                {currentUserEmail === "nathanaeltinotenda7@gmail.com" ? "NA" : "GU"}
              </div>
              <div className="flex-1">
                <textarea
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder={`Share news, photos, or status update... ${isOffline ? '(Buffered offline)' : ''}`}
                  rows={2}
                  className="w-full bg-[#202c33] border border-transparent rounded-xl px-4 py-2.5 text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:bg-[#2a3942] resize-none transition-all"
                />
              </div>
            </div>

            {/* Photo preview attached */}
            {selectedPhoto && (
              <div className="relative rounded-xl overflow-hidden border border-[#222d34] max-h-44 bg-[#0b141a]">
                <img src={selectedPhoto} alt="Attachment" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute top-2 right-2 bg-black/80 hover:bg-black text-white p-1 rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#222d34]/40">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPhotoPicker(!showPhotoPicker)}
                  className={`flex items-center space-x-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors ${
                    showPhotoPicker ? "bg-[#00a884] text-[#111b21]" : "bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef]"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#00a884]" />
                  <span>Attach Curated Image</span>
                </button>

                <VoiceInputButton
                  onTranscriptComplete={(text) => {
                    setNewPostText(prev => {
                      const separator = prev && !prev.endsWith(" ") ? " " : "";
                      return prev + separator + text;
                    });
                    if (triggerToast) {
                      triggerToast("Voice content optimized and inserted! ✨", "success");
                    }
                  }}
                />
              </div>

              <button
                type="submit"
                id="btn-submit-post"
                disabled={!newPostText.trim() && !selectedPhoto}
                className="bg-[#00a884] hover:bg-[#008f72] disabled:opacity-40 text-[#111b21] text-xs font-bold px-4 py-2 rounded-lg shadow-md transition-all flex items-center space-x-1.5"
              >
                <span>Broadcast</span>
                <Send className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            {/* Curated Scenery Photo Grid Picker */}
            {showPhotoPicker && (
              <div className="bg-[#202c33]/70 rounded-xl p-3 border border-[#222d34]/60 mt-2 space-y-2 animate-fadeIn">
                <p className="text-[10px] font-mono text-[#8696a0] uppercase tracking-wider font-semibold">Select visual attachment:</p>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLE_PHOTOS.map(photo => (
                    <button
                      key={photo.name}
                      type="button"
                      onClick={() => {
                        setSelectedPhoto(photo.url);
                        setShowPhotoPicker(false);
                      }}
                      className="group relative h-16 rounded-lg overflow-hidden border border-[#222d34] hover:border-[#00a884] text-left transition-all"
                    >
                      <img src={photo.url} alt={photo.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-1.5">
                        <span className="text-[9px] font-bold text-[#e9edef] truncate w-full">{photo.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Community Channel/Broadcast Updates Feed */}
        <div className="space-y-4">
          {posts.map(post => (
            <article 
              key={post.id} 
              id={`post-${post.id}`}
              className="bg-[#111b21] rounded-2xl border border-[#222d34]/55 shadow-xl overflow-hidden"
            >
              {/* Post Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3 select-none">
                  <img
                    src={post.authorAvatar}
                    alt={post.authorName}
                    className="w-10 h-10 rounded-full object-cover border border-[#222d34]"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-[#e9edef] flex items-center gap-1.5">
                      {post.authorName}
                      {post.authorName.includes("Owner") && (
                        <span className="bg-[#00a884]/15 text-[#00a884] border border-[#00a884]/20 text-[8px] px-1.5 py-0.5 rounded font-mono font-bold uppercase">Business Owner</span>
                      )}
                    </h4>
                    <span className="text-[10px] text-[#8696a0] font-mono mt-0.5 block">{post.timestamp}</span>
                  </div>
                </div>

                {/* Pending synchronization overlay/badge */}
                {post.isOfflinePending && (
                  <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full px-2.5 py-0.5 flex items-center text-[9px] font-mono font-bold animate-pulse">
                    <CloudLightning className="w-3 h-3 mr-1 animate-bounce" />
                    QUEUED
                  </div>
                )}
              </div>

              {/* Individual Sync Progress Bar for Offline Pending Post */}
              {post.isOfflinePending && (
                <div className="mx-4 mb-3 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-amber-400 font-bold flex items-center gap-1 font-mono">
                      <CloudLightning className="w-3 h-3 animate-pulse text-amber-500" />
                      {isSyncing ? "UPLOADING TO CLOUD STREAM..." : "OFFLINE QUEUED"}
                    </span>
                    <span className="text-amber-500 font-semibold font-mono">
                      {isSyncing ? "65% Syncing" : "Buffered (0%)"}
                    </span>
                  </div>
                  <div className="w-full bg-[#1b1b1f] h-1.5 rounded-full overflow-hidden border border-amber-500/10">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isSyncing 
                          ? "bg-[#00a884] w-[65%] animate-pulse" 
                          : "bg-amber-500 w-[15%]"
                      }`} 
                    />
                  </div>
                  <p className="text-[9px] text-[#8696a0] leading-normal select-none">
                    {isSyncing 
                      ? "Pushing changes and rebuilding live connection feeds..." 
                      : "This broadcast is cached locally. It will automatically upload once online."
                    }
                  </p>
                </div>
              )}

              {/* Post Body Content */}
              <div className="px-4 pb-3">
                <p className="text-xs text-[#e9edef] leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Attached Media */}
              {post.mediaUrl && (
                <div className="border-y border-[#222d34]/60 max-h-[380px] overflow-hidden bg-[#0b141a] flex items-center justify-center">
                  <img
                    src={post.mediaUrl}
                    alt="Post media"
                    className="w-full h-auto object-cover max-h-[380px]"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Likes & Comments Count Panel */}
              <div className="px-4 py-2 bg-[#1f2c34]/20 border-b border-[#222d34]/30 flex items-center justify-between text-[10px] text-[#8696a0]">
                <div className="flex items-center space-x-1">
                  <Heart className={`w-3.5 h-3.5 ${post.hasLiked ? 'fill-red-500 text-red-500' : 'text-[#8696a0]'}`} />
                  <span className={post.hasLiked ? 'text-[#e9edef] font-bold' : ''}>{post.likes} reactions</span>
                </div>
                <span>{post.comments.length} comments</span>
              </div>

              {/* Interaction Action Buttons */}
              <div className="px-3 py-1 bg-[#111b21] flex items-center justify-around border-b border-[#222d34]/40 select-none">
                <button
                  onClick={() => handleLike(post.id)}
                  id={`btn-like-${post.id}`}
                  className={`flex items-center space-x-1.5 text-xs font-bold py-1.5 px-3 rounded-lg transition-colors ${
                    post.hasLiked 
                      ? "text-red-400 bg-red-950/20" 
                      : "text-[#8696a0] hover:bg-[#202c33]/70 hover:text-[#e9edef]"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.hasLiked ? 'fill-current' : ''}`} />
                  <span>React</span>
                </button>

                <button
                  onClick={() => {
                    const el = document.getElementById(`comment-input-${post.id}`);
                    if (el) el.focus();
                  }}
                  className="flex items-center space-x-1.5 text-xs text-[#8696a0] hover:text-[#e9edef] font-bold py-1.5 px-3 rounded-lg hover:bg-[#202c33]/70 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Reply</span>
                </button>

                <button
                  onClick={() => {
                    if (triggerToast) {
                      triggerToast("Forward link created and copied to WhatsApp clipboard!", "success");
                    }
                  }}
                  className="flex items-center space-x-1.5 text-xs text-[#8696a0] hover:text-[#e9edef] font-bold py-1.5 px-3 rounded-lg hover:bg-[#202c33]/70 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Forward</span>
                </button>
              </div>

              {/* Comments Section */}
              <div className="p-3 bg-[#111b21] space-y-3">
                {post.comments.length > 0 && (
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {post.comments.map(comment => (
                      <div key={comment.id} className="flex space-x-2.5 text-xs items-start animate-bubble">
                        <img
                          src={comment.authorAvatar}
                          alt={comment.authorName}
                          className="w-7 h-7 rounded-full object-cover border border-[#222d34] mt-0.5"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 bg-[#202c33] rounded-xl px-3 py-2 text-[#e9edef]">
                          <div className="flex items-center justify-between mb-0.5 select-none">
                            <span className="font-bold text-[#e9edef] text-[11px]">{comment.authorName}</span>
                            <span className="text-[9px] text-[#8696a0] font-mono">{comment.timestamp}</span>
                          </div>
                          <p className="text-[#e9edef]/90 leading-relaxed text-[11px]">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Comment Composer Form */}
                <form 
                  onSubmit={(e) => handleAddComment(post.id, e)} 
                  className="flex items-center space-x-2 mt-1"
                >
                  <div className="w-6 h-6 rounded-full bg-[#202c33] border border-[#222d34] flex items-center justify-center font-bold text-[9px] text-[#00a884] select-none shrink-0">
                    {currentUserEmail === "nathanaeltinotenda7@gmail.com" ? "ON" : "GU"}
                  </div>
                  <input
                    id={`comment-input-${post.id}`}
                    type="text"
                    value={commentInputs[post.id] || ""}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                    placeholder="Add a reply..."
                    className="flex-1 bg-[#202c33] border border-transparent rounded-lg px-3 py-1.5 text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:bg-[#2a3942] transition-all"
                  />
                  <button
                    type="submit"
                    id={`btn-send-comment-${post.id}`}
                    className="bg-[#00a884] hover:bg-[#008f72] text-[#111b21] p-1.5 rounded-lg transition-colors flex items-center justify-center shrink-0"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Stories Fullscreen Visual Modal styled like WhatsApp Status Viewer */}
      {activeStory && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center animate-fadeIn" id="story-modal">
          
          {/* Active timeline bar at the top */}
          <div className="w-full max-w-sm px-4 pt-4 pb-2 space-y-3 z-10 shrink-0">
            <div className="w-full flex gap-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="w-full bg-[#00a884] h-full rounded-full animate-[loading_5s_linear_forwards]" />
            </div>

            <div className="flex items-center justify-between select-none">
              <div className="flex items-center space-x-3">
                <img 
                  src={activeStory.avatar} 
                  alt="" 
                  className="w-9 h-9 rounded-full object-cover border border-[#00a884] shadow-md shadow-emerald-950/20" 
                  referrerPolicy="no-referrer" 
                />
                <div>
                  <h5 className="font-bold text-xs text-white leading-normal">{activeStory.userName}</h5>
                  <p className="text-[9px] text-slate-400 font-mono">Status Story Update</p>
                </div>
              </div>

              <button
                onClick={() => setActiveStory(null)}
                className="text-white/80 hover:text-white bg-[#202c33]/80 p-2 rounded-full transition-colors focus:outline-none shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Full-screen Content block */}
          <div className="flex-1 w-full max-w-sm bg-black relative flex items-center justify-center overflow-hidden">
            <img 
              src={activeStory.mediaUrl} 
              alt="Story Content" 
              className="max-h-full max-w-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Bottom Lock Info */}
          <div className="p-4 text-center text-slate-400 text-[10px] flex items-center justify-center gap-1.5 z-10 select-none bg-black/40 w-full">
            <Lock className="w-3 h-3 text-[#00a884]" />
            <span>End-to-end encrypted status. Seen only by connections.</span>
          </div>
        </div>
      )}
    </div>
  );
}
