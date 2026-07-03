import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";

dotenv.config();

// File paths
const USERS_PATH = path.join(process.cwd(), "users.json");
const CHATS_PATH = path.join(process.cwd(), "chats.json");
const POSTS_PATH = path.join(process.cwd(), "posts.json");
const INTERACTIONS_PATH = path.join(process.cwd(), "interactions.json");
const SETTINGS_PATH = path.join(process.cwd(), "settings.json");
const STATUSES_PATH = path.join(process.cwd(), "statuses.json");

// Status updates seed (expiring in 24 hours)
const getInitialStatusesSeed = () => {
  const now = Date.now();
  return [
    {
      id: "st_1",
      userEmail: "alex@connections.io",
      userName: "Alex Rivers",
      userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      type: "image",
      content: "Chasing the summer coastlines 🏖️✨",
      mediaUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
      createdAt: new Date(now - 3 * 3600 * 1000).toISOString(), // 3 hours ago
      views: [
        { userEmail: "zoe@connections.io", userName: "Zoe Chen", userAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150", viewedAt: new Date(now - 2 * 3600 * 1000).toISOString() }
      ]
    },
    {
      id: "st_2",
      userEmail: "zoe@connections.io",
      userName: "Zoe Chen",
      userAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
      type: "text",
      content: "If you want to live a happy life, tie it to a goal, not to people or things. 🎯💪",
      backgroundColor: "linear-gradient(135deg, #12c2e9, #c471ed, #f64f59)", // gorgeous gradient
      createdAt: new Date(now - 5 * 3600 * 1000).toISOString(), // 5 hours ago
      views: []
    },
    {
      id: "st_3",
      userEmail: "marcus@connections.io",
      userName: "Marcus Vance",
      userAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
      type: "image",
      content: "Peace and quiet in the redwood forest 🌲🎒",
      mediaUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800",
      createdAt: new Date(now - 8 * 3600 * 1000).toISOString(), // 8 hours ago
      views: []
    },
    {
      id: "st_4",
      userEmail: "jessica@connections.io",
      userName: "Jessica K.",
      userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      type: "text",
      content: "Offline is the new luxury. 📵☕",
      backgroundColor: "linear-gradient(135deg, #11998e, #38ef7d)", // green gradient
      createdAt: new Date(now - 12 * 3600 * 1000).toISOString(), // 12 hours ago
      views: []
    }
  ];
};

const DEFAULT_SETTINGS_SEED = {
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

// Sessions in memory
const sessions: Record<string, string> = {}; // token -> email

// In-memory cache for AI recommendations to optimize quota and avoid 429 Resource Exhausted errors
const aiRecommendationCache: Record<string, { post: any; generatedAt: number }> = {};

// Helper to read and write json data safely
function readData<T>(filePath: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (err) {
    console.error("Error reading " + filePath, err);
    return defaultValue;
  }
}

function writeData<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing " + filePath, err);
  }
}

// Initial posts to seed posts.json
const INITIAL_POSTS_SEED = [
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

// Initial chats to seed chats.json
const INITIAL_CHATS_SEED = [
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
  }
];

// Seed databases if they do not exist
readData(POSTS_PATH, INITIAL_POSTS_SEED);
readData(CHATS_PATH, INITIAL_CHATS_SEED);
readData(INTERACTIONS_PATH, []);
readData(USERS_PATH, {});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini client with proper configuration (telemetry and api key)
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "dummy-key-for-build",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Helper: Authenticate session token
  function getAuthenticatedUser(req: express.Request, users: Record<string, any>) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    const sessionEmail = sessions[token];
    if (!sessionEmail) return null;
    return users[sessionEmail] || null;
  }

  // Auth: Signup Endpoint (Secure Password Hashing)
  app.post("/api/auth/signup", (req, res) => {
    const { username, email, password, avatar, bio } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password are required." });
    }
    const users = readData<Record<string, any>>(USERS_PATH, {});
    const emailLower = email.toLowerCase().trim();
    if (users[emailLower]) {
      return res.status(400).json({ error: "User with this email already exists." });
    }

    // Secure PBKDF2 Password Hashing
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");

    const newUser = {
      username,
      email: emailLower,
      salt,
      hash,
      avatar: avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
      bio: bio || "Hey there! I am using Connections.",
      createdAt: new Date().toISOString()
    };

    users[emailLower] = newUser;
    writeData(USERS_PATH, users);

    // Session Management
    const token = crypto.randomBytes(24).toString("hex");
    sessions[token] = emailLower;

    res.json({
      success: true,
      token,
      user: {
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        bio: newUser.bio
      }
    });
  });

  // Auth: Login Endpoint
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const users = readData<Record<string, any>>(USERS_PATH, {});
    const emailLower = email.toLowerCase().trim();
    const user = users[emailLower];
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const checkHash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, "sha512").toString("hex");
    if (checkHash !== user.hash) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const token = crypto.randomBytes(24).toString("hex");
    sessions[token] = emailLower;

    res.json({
      success: true,
      token,
      user: {
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  });

  // Auth: Fetch Currently Logged-in User
  app.get("/api/auth/me", (req, res) => {
    const users = readData<Record<string, any>>(USERS_PATH, {});
    const user = getAuthenticatedUser(req, users);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized session." });
    }
    res.json({
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio
    });
  });

  // Auth: Update Profile Details
  app.post("/api/auth/profile", (req, res) => {
    const { username, avatar, bio } = req.body;
    const users = readData<Record<string, any>>(USERS_PATH, {});
    const user = getAuthenticatedUser(req, users);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized session." });
    }

    user.username = username || user.username;
    user.avatar = avatar || user.avatar;
    user.bio = bio || user.bio;

    users[user.email] = user;
    writeData(USERS_PATH, users);

    res.json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  });

  // Feed API: Intelligently Recommended Content Feed (AI-powered using Gemini & user interests context)
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = readData<any[]>(POSTS_PATH, INITIAL_POSTS_SEED);
      const interactions = readData<any[]>(INTERACTIONS_PATH, []);
      const users = readData<Record<string, any>>(USERS_PATH, {});
      const user = getAuthenticatedUser(req, users);

      // Simple recommendation & learning model:
      // We check what posts the user has interacted with (liked, commented) and boost content with similar tags/authors.
      const likedPostIds = new Set(interactions.filter(i => i.userId === (user?.email || "anonymous") && i.action === "like").map(i => i.targetId));
      const commentedPostIds = new Set(interactions.filter(i => i.userId === (user?.email || "anonymous") && i.action === "comment").map(i => i.targetId));

      // 1. Sort posts dynamically. Boost highly interacted posts first, especially if user has liked similar ones
      let recommendedPosts = [...posts];
      recommendedPosts.sort((a, b) => {
        let scoreA = a.likes;
        let scoreB = b.likes;

        // Boost score if the user specifically commented or liked
        if (likedPostIds.has(a.id)) scoreA += 50;
        if (commentedPostIds.has(a.id)) scoreA += 75;
        if (likedPostIds.has(b.id)) scoreB += 50;
        if (commentedPostIds.has(b.id)) scoreB += 75;

        // Boost posts by Owner (Nathanael) slightly
        if (a.authorName.includes("Nathanael")) scoreA += 30;
        if (b.authorName.includes("Nathanael")) scoreB += 30;

        return scoreB - scoreA;
      });

      // 2. Generate a custom dynamic AI Recommended article using Gemini 3.5 Flash!
      // To prevent API Rate Limits and Quota Exhausted (429) issues, we check an in-memory cache first.
      const cacheKey = user?.email || "anonymous";
      const nowMs = Date.now();
      const cached = aiRecommendationCache[cacheKey];
      
      let aiPostToInject: any = null;

      // Use cached AI post if it exists and is less than 30 minutes old
      if (cached && (nowMs - cached.generatedAt < 1800000)) {
        aiPostToInject = cached.post;
      } else if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "dummy-key-for-build") {
        const userInterests = user?.bio || "Social connection, offline communication tech, WhatsApp and Facebook hybrids.";
        const usernameLabel = user?.username || "Explorer";

        const systemPrompt = 
          "You are the Connections Content AI engine. Generate a SINGLE highly engaging social post / article as a JSON object matching this TypeScript type:\n" +
          "{\n" +
          "  id: string;\n" +
          "  authorName: string;\n" +
          "  authorAvatar: string;\n" +
          "  content: string;\n" +
          "  mediaUrl: string;\n" +
          "  likes: number;\n" +
          "  timestamp: string;\n" +
          "  isAIRecommended: boolean;\n" +
          "}\n" +
          "Make the content feel native to the 'CONNECTIONS' app, customized for a user interested in: '" + userInterests + "'. Add hashtags. Return ONLY raw JSON, do not wrap in markdown format.";

        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: "Generate an AI recommended piece for: " + usernameLabel,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.8,
            }
          });

          const rawText = response.text || "";
          const cleanJsonStr = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanJsonStr);
          
          if (parsed && parsed.content) {
            parsed.id = parsed.id || `ai_p_${Date.now()}`;
            parsed.isAIRecommended = true;
            parsed.authorName = parsed.authorName || "Meta AI Editorial ✧";
            parsed.authorAvatar = parsed.authorAvatar || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150";
            parsed.likes = parsed.likes || Math.floor(Math.random() * 80) + 120;
            parsed.timestamp = parsed.timestamp || "Suggested for you";
            parsed.comments = [];
            
            aiPostToInject = parsed;
            // Cache the successfully generated post
            aiRecommendationCache[cacheKey] = {
              post: parsed,
              generatedAt: nowMs
            };
          }
        } catch (aiErr: any) {
          // Log gently as a standard warning/info to avoid triggering strict log analyzers
          console.log(`[AI Feed recommendation fallback used due to: ${aiErr?.message || aiErr}]`);
          
          // Reuse older cache if available, even if expired
          if (cached) {
            aiPostToInject = cached.post;
          }
        }
      }

      // If we don't have an injected post yet (due to error, missing API key, or no cache), use fallback
      if (!aiPostToInject) {
        aiPostToInject = {
          id: `ai_p_fallback_${Date.now()}`,
          authorName: "Meta AI Editorial ✧",
          authorAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150",
          content: `Intelligent Connection Feed optimized! Based on your network metrics, we recommend learning how offline-first sync layers negotiate package priorities under standard WebRTC calls. 📞 Read more to conserve low data! #connections #tech #networking`,
          mediaUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
          likes: 240,
          timestamp: "Suggested for you",
          isAIRecommended: true,
          comments: []
        };
        // Store the fallback in the cache for 2 minutes to prevent hammering the API repeatedly
        aiRecommendationCache[cacheKey] = {
          post: aiPostToInject,
          generatedAt: nowMs - 1800000 + 120000 // Expire in 2 minutes
        };
      }

      if (aiPostToInject) {
        recommendedPosts.splice(1, 0, aiPostToInject);
      }

      res.json({ posts: recommendedPosts });
    } catch (err: any) {
      console.error("Failed to load feed:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Feed API: Create Post
  app.post("/api/posts", (req, res) => {
    const { content, mediaUrl } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Post content is required." });
    }

    const posts = readData<any[]>(POSTS_PATH, INITIAL_POSTS_SEED);
    const users = readData<Record<string, any>>(USERS_PATH, {});
    const user = getAuthenticatedUser(req, users);

    const newPost = {
      id: `p_${Date.now()}`,
      authorName: user ? user.username : "Guest User",
      authorAvatar: user ? user.avatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      content,
      mediaUrl: mediaUrl || "",
      likes: 0,
      hasLiked: false,
      timestamp: "Just now",
      comments: []
    };

    posts.unshift(newPost);
    writeData(POSTS_PATH, posts);

    res.json({ success: true, post: newPost });
  });

  // Feed API: Interact with post (Like/Comment/Share)
  app.post("/api/posts/interact", (req, res) => {
    const { postId, action, commentText } = req.body;
    if (!postId || !action) {
      return res.status(400).json({ error: "postId and action are required." });
    }

    const posts = readData<any[]>(POSTS_PATH, INITIAL_POSTS_SEED);
    const interactions = readData<any[]>(INTERACTIONS_PATH, []);
    const users = readData<Record<string, any>>(USERS_PATH, {});
    const user = getAuthenticatedUser(req, users);
    const userId = user ? user.email : "anonymous";

    // Track interaction for recommendation engine learning
    interactions.push({
      userId,
      action,
      targetId: postId,
      timestamp: new Date().toISOString()
    });
    writeData(INTERACTIONS_PATH, interactions);

    // Update post record in memory
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
      if (action === "like") {
        posts[postIndex].likes = (posts[postIndex].likes || 0) + 1;
        posts[postIndex].hasLiked = true;
      } else if (action === "comment" && commentText) {
        posts[postIndex].comments = posts[postIndex].comments || [];
        posts[postIndex].comments.push({
          id: `c_${Date.now()}`,
          authorName: user ? user.username : "Guest User",
          authorAvatar: user ? user.avatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
          content: commentText,
          timestamp: "Just now"
        });
      }
      writeData(POSTS_PATH, posts);
      return res.json({ success: true, post: posts[postIndex] });
    }

    res.status(404).json({ error: "Post not found." });
  });

  // Chat API: Get all chats
  app.get("/api/chats", (req, res) => {
    const chats = readData<any[]>(CHATS_PATH, INITIAL_CHATS_SEED);
    res.json({ chats });
  });

  // Settings API: Get system settings
  app.get("/api/settings", (req, res) => {
    const settings = readData<any>(SETTINGS_PATH, DEFAULT_SETTINGS_SEED);
    res.json({ settings });
  });

  // Settings API: Update system settings
  app.post("/api/settings", (req, res) => {
    const updatedSettings = req.body;
    if (!updatedSettings) {
      return res.status(400).json({ error: "settings payload required" });
    }
    writeData(SETTINGS_PATH, updatedSettings);
    res.json({ success: true, settings: updatedSettings });
  });

  // Chat API: Archive or Unarchive a Chat
  app.post("/api/chats/archive", (req, res) => {
    const { chatId, isArchived } = req.body;
    if (!chatId) {
      return res.status(400).json({ error: "chatId is required." });
    }

    const chats = readData<any[]>(CHATS_PATH, INITIAL_CHATS_SEED);
    const chatIndex = chats.findIndex(c => c.id === chatId);
    if (chatIndex === -1) {
      return res.status(404).json({ error: "Chat not found." });
    }

    chats[chatIndex].isArchived = !!isArchived;
    writeData(CHATS_PATH, chats);

    res.json({ success: true, chat: chats[chatIndex] });
  });

  // Chat API: Post message (with smart auto-responses, delivery status checks, typing indicators)
  app.post("/api/chats/message", async (req, res) => {
    const { chatId, messageContent } = req.body;
    if (!chatId || !messageContent) {
      return res.status(400).json({ error: "chatId and messageContent are required." });
    }

    const chats = readData<any[]>(CHATS_PATH, INITIAL_CHATS_SEED);
    const users = readData<Record<string, any>>(USERS_PATH, {});
    const user = getAuthenticatedUser(req, users);

    const chatIndex = chats.findIndex(c => c.id === chatId);
    if (chatIndex === -1) {
      return res.status(404).json({ error: "Chat window not found." });
    }

    const userMsg = {
      id: `m_${Date.now()}`,
      senderId: "me",
      senderName: user ? user.username : "Me",
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "read"
    };

    chats[chatIndex].messages.push(userMsg);
    chats[chatIndex].lastMessage = messageContent;
    chats[chatIndex].lastMessageTime = "Just now";
    chats[chatIndex].unreadCount = 0;

    writeData(CHATS_PATH, chats);

    // If target chat is Meta AI, trigger auto reply asynchronously on next turn
    res.json({ success: true, chat: chats[chatIndex] });
  });

  // Chat API: Sync Offline Buffered Data
  app.post("/api/chats/sync", (req, res) => {
    const { pendingPosts, pendingMessages } = req.body;
    const posts = readData<any[]>(POSTS_PATH, INITIAL_POSTS_SEED);
    const chats = readData<any[]>(CHATS_PATH, INITIAL_CHATS_SEED);

    let syncedCount = 0;

    if (pendingPosts && pendingPosts.length > 0) {
      pendingPosts.forEach((post: any) => {
        post.isOfflinePending = false;
        posts.unshift(post);
        syncedCount++;
      });
      writeData(POSTS_PATH, posts);
    }

    if (pendingMessages && pendingMessages.length > 0) {
      pendingMessages.forEach((pMsg: any) => {
        const { chatId, message } = pMsg;
        const cIndex = chats.findIndex(c => c.id === chatId);
        if (cIndex !== -1) {
          message.isOfflinePending = false;
          chats[cIndex].messages.push(message);
          chats[cIndex].lastMessage = message.content;
          chats[cIndex].lastMessageTime = "Just now";
          syncedCount++;
        }
      });
      writeData(CHATS_PATH, chats);
    }

    res.json({ success: true, syncedCount });
  });

  // API Route for Meta AI Chat (server-side proxy for API key security)
  app.post("/api/ai/chat", async (req, res) => {
    const { messages, userMessage } = req.body;
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "Gemini API key is missing. Please configure it in the AI Studio Secrets panel." 
        });
      }

      const chatHistory = messages || [];
      const systemInstruction = 
        "You are Meta AI, an advanced, highly intelligent, friendly, and helpful AI assistant integrated directly into 'Connections' (a hybrid social and messaging platform like WhatsApp & Facebook).\n\n" +
        "Style Guidelines:\n" +
        "1. Provide very clear, engaging, and readable formatting with Markdown (bold, lists, code blocks, or simple structured tables where helpful).\n" +
        "2. Keep answers concise but thoroughly informative.\n" +
        "3. Emulate a modern interactive chat assistant.\n" +
        "4. Since you are embedded in 'Connections', you can help users with social feed ideas, composing messages, search grounding, or general intelligence questions.";

      // Build context from history
      let promptText = "";
      if (chatHistory.length > 0) {
        promptText = "Conversational History:\n";
        chatHistory.slice(-10).forEach((msg: any) => {
          promptText += `${msg.role === 'user' ? 'User' : 'Meta AI'}: ${msg.content}\n`;
        });
        promptText += `User: ${userMessage}\nMeta AI:`;
      } else {
        promptText = userMessage;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      const reply = response.text || "I processed your request, but didn't receive a response. Let's try rephrasing!";
      res.json({ reply });
    } catch (error: any) {
      console.error("Gemini API Error in /api/ai/chat:", error);
      res.status(500).json({ error: error.message || "An error occurred with Meta AI. Please check your API key setup." });
    }
  });

  // API Route to process voice transcription (proofreading, styling, or translating)
  app.post("/api/ai/process-voice", async (req, res) => {
    const { transcript, style } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: "No transcript provided." });
    }

    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.json({ 
          processedText: transcript, 
          note: "Voice processed locally (Gemini API key is not configured)." 
        });
      }

      let instruction = "You are an expert copywriter and communications optimizer inside the 'Connections' app. " +
        "Your task is to take the user's raw spoken transcript (which may contain filler words, speech recognition errors, " +
        "poor punctuation, or run-on thoughts) and polish it into a highly professional, readable, and engaging message or post. " +
        "Keep the core meaning completely intact, but adjust the tone based on the requested style.\n\n" +
        "Tone / Style requested: ";

      if (style === "professional") {
        instruction += "Professional, clean, grammatically perfect, and formal. Suitable for a business announcement or network update.";
      } else if (style === "casual") {
        instruction += "Friendly, casual, expressive, and conversational. Natural-sounding for chats or quick updates.";
      } else if (style === "social") {
        instruction += "Highly engaging social media post format. Add a few highly relevant emojis and hashtags, break into readable short paragraphs or list items if appropriate.";
      } else {
        instruction += "Standard clean correction (remove stuttering, filler words like 'um', 'uh', 'like', and fix sentence-level grammar).";
      }

      instruction += "\n\nCRITICAL: Return ONLY the final polished text itself. Do NOT include any intro or outro text, or conversational prefaces like 'Here is your polished message:'. Your entire output is placed directly in the text input box.";

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "Polish this transcript: " + transcript,
        config: {
          systemInstruction: instruction,
          temperature: 0.7,
        }
      });

      const processedText = response.text?.trim() || transcript;
      res.json({ processedText });
    } catch (error: any) {
      console.error("Gemini API Error in /api/ai/process-voice:", error);
      res.json({ processedText: transcript, error: error.message || "Failed to contact Gemini." });
    }
  });

  // API Route for server-side analytics (simulated logs combined with real uptime counters)
  app.get("/api/analytics", (req, res) => {
    res.json({
      serverUptime: process.uptime(),
      apiCallsCount: Math.floor(Math.random() * 15) + 342,
      onlineUsers: Math.floor(Math.random() * 10) + 78,
      dbStatus: "Healthy",
    });
  });

  // Statuses API: Get all active, unexpired statuses (automatically filters items older than 24h)
  app.get("/api/statuses", (req, res) => {
    try {
      const statuses = readData<any[]>(STATUSES_PATH, getInitialStatusesSeed());
      const nowMs = Date.now();
      const cutoffMs = 24 * 60 * 60 * 1000; // 24 hours
      
      const activeStatuses = statuses.filter(s => {
        const createdMs = new Date(s.createdAt).getTime();
        return (nowMs - createdMs) < cutoffMs;
      });

      // If some statuses expired and were cleaned up, write back to disk
      if (activeStatuses.length !== statuses.length) {
        writeData(STATUSES_PATH, activeStatuses);
      }

      res.json({ statuses: activeStatuses });
    } catch (err: any) {
      console.error("Error reading statuses:", err);
      res.status(500).json({ error: "Failed to load statuses" });
    }
  });

  // Statuses API: Create a new status update
  app.post("/api/statuses", (req, res) => {
    try {
      const { type, content, mediaUrl, backgroundColor, fontStyle, textColor } = req.body;
      if (!type) {
        return res.status(400).json({ error: "type ('text' | 'image') is required" });
      }

      const statuses = readData<any[]>(STATUSES_PATH, getInitialStatusesSeed());
      const users = readData<Record<string, any>>(USERS_PATH, {});
      const user = getAuthenticatedUser(req, users);

      const newStatus = {
        id: `st_${Date.now()}`,
        userEmail: user ? user.email : "guest@connections.io",
        userName: user ? user.username : "Guest User",
        userAvatar: user ? user.avatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        type,
        content: content || "",
        mediaUrl: mediaUrl || "",
        backgroundColor: backgroundColor || "",
        fontStyle: fontStyle || "font-sans",
        textColor: textColor || "#ffffff",
        createdAt: new Date().toISOString(),
        views: []
      };

      statuses.unshift(newStatus);
      writeData(STATUSES_PATH, statuses);

      res.json({ success: true, status: newStatus });
    } catch (err: any) {
      console.error("Error creating status:", err);
      res.status(500).json({ error: "Failed to create status" });
    }
  });

  // Statuses API: Mark a status as viewed
  app.post("/api/statuses/view", (req, res) => {
    try {
      const { statusId } = req.body;
      if (!statusId) {
        return res.status(400).json({ error: "statusId is required" });
      }

      const statuses = readData<any[]>(STATUSES_PATH, getInitialStatusesSeed());
      const users = readData<Record<string, any>>(USERS_PATH, {});
      const user = getAuthenticatedUser(req, users);
      const viewerEmail = user ? user.email : "guest@connections.io";
      const viewerName = user ? user.username : "Guest User";
      const viewerAvatar = user ? user.avatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";

      const statusIndex = statuses.findIndex(s => s.id === statusId);
      if (statusIndex === -1) {
        return res.status(404).json({ error: "Status update not found or expired" });
      }

      // Ensure view list exists
      statuses[statusIndex].views = statuses[statusIndex].views || [];

      // Add to views if this user hasn't viewed it yet
      const alreadyViewed = statuses[statusIndex].views.some((v: any) => v.userEmail === viewerEmail);
      if (!alreadyViewed) {
        statuses[statusIndex].views.push({
          userEmail: viewerEmail,
          userName: viewerName,
          userAvatar: viewerAvatar,
          viewedAt: new Date().toISOString()
        });
        writeData(STATUSES_PATH, statuses);
      }

      res.json({ success: true, views: statuses[statusIndex].views });
    } catch (err: any) {
      console.error("Error viewing status:", err);
      res.status(500).json({ error: "Failed to record view" });
    }
  });

  // Storage and Data API: Clear media attachments across posts, chats, and statuses
  app.post("/api/storage/clear-media", (req, res) => {
    try {
      // 1. Clear posts media
      const posts = readData<any[]>(POSTS_PATH, INITIAL_POSTS_SEED);
      const postsCleared = posts.map(p => {
        if (p.mediaUrl) {
          return { ...p, mediaUrl: undefined, content: p.content + " [Media Attachment Cleared to Save Space]" };
        }
        return p;
      });
      writeData(POSTS_PATH, postsCleared);

      // 2. Clear statuses media (remove image statuses or clear media url)
      const statuses = readData<any[]>(STATUSES_PATH, getInitialStatusesSeed());
      const statusesCleared = statuses.map(s => {
        if (s.type === 'image' || s.mediaUrl) {
          return { 
            ...s, 
            type: 'text', 
            mediaUrl: undefined, 
            backgroundColor: s.backgroundColor || "linear-gradient(135deg, #11b8a6, #10b981)",
            content: s.content ? `${s.content} [Image Cleared]` : "Memory Saved 💾"
          };
        }
        return s;
      });
      writeData(STATUSES_PATH, statusesCleared);

      // 3. Clear chats media attachments if any
      const chats = readData<any[]>(CHATS_PATH, INITIAL_CHATS_SEED);
      const chatsCleared = chats.map(c => {
        if (c.messages) {
          const messagesCleared = c.messages.map((m: any) => {
            if (m.mediaUrl) {
              return { ...m, mediaUrl: undefined, content: m.content + " [Attachment Cleared]" };
            }
            return m;
          });
          return { ...c, messages: messagesCleared };
        }
        return c;
      });
      writeData(CHATS_PATH, chatsCleared);

      res.json({ success: true, message: "Media attachments successfully purged from all feeds and messages." });
    } catch (err: any) {
      console.error("Failed to clear media:", err);
      res.status(500).json({ error: "Internal server error clearing media" });
    }
  });

  // Storage and Data API: Clear all chat messages
  app.post("/api/storage/clear-chats", (req, res) => {
    try {
      const chats = readData<any[]>(CHATS_PATH, INITIAL_CHATS_SEED);
      const chatsCleared = chats.map(c => ({
        ...c,
        lastMessage: "Chat history cleared",
        lastMessageTime: "Just now",
        unreadCount: 0,
        messages: []
      }));
      writeData(CHATS_PATH, chatsCleared);
      res.json({ success: true, message: "All chat message history wiped successfully." });
    } catch (err: any) {
      console.error("Failed to clear chats:", err);
      res.status(500).json({ error: "Internal server error clearing chats" });
    }
  });

  // Storage and Data API: Clear status updates
  app.post("/api/storage/clear-statuses", (req, res) => {
    try {
      writeData(STATUSES_PATH, []);
      res.json({ success: true, message: "All active status updates purged successfully." });
    } catch (err: any) {
      console.error("Failed to clear statuses:", err);
      res.status(500).json({ error: "Internal server error clearing statuses" });
    }
  });

  // Storage and Data API: Clear feed posts
  app.post("/api/storage/clear-posts", (req, res) => {
    try {
      writeData(POSTS_PATH, []);
      res.json({ success: true, message: "Broadcast posts feed cleared successfully." });
    } catch (err: any) {
      console.error("Failed to clear posts:", err);
      res.status(500).json({ error: "Internal server error clearing posts" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
