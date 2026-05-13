"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AtSign,
  Bell,
  Check,
  CheckCheck,
  Compass,
  Crown,
  Download,
  FileText,
  Hash,
  ImagePlus,
  Laugh,
  LogOut,
  Menu,
  MessageCircle,
  Mic,
  Pause,
  Paperclip,
  Play,
  Plus,
  Search,
  Send,
  Settings,
  Shield,
  SmilePlus,
  Square,
  Trash2,
  Upload,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const filters = ["All", "Unread", "Favorites", "Groups"];
const emojiBank = ["😀", "😂", "😍", "🥳", "😎", "😭", "😡", "👍", "👎", "🙏", "🔥", "💜", "💙", "✨", "🚀", "✅", "🎉", "💯", "🤝", "👀", "😮", "😴", "🤔", "❤️"];
const reactionBank = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const maxUploadSize = 5 * 1024 * 1024;
const emojiOptions = ["\u{1F600}", "\u{1F602}", "\u{1F60D}", "\u{1F973}", "\u{1F60E}", "\u{1F62D}", "\u{1F621}", "\u{1F44D}", "\u{1F44E}", "\u{1F64F}", "\u{1F525}", "\u{1F49C}", "\u{1F499}", "\u2728", "\u{1F680}", "\u2705", "\u{1F389}", "\u{1F4AF}", "\u{1F91D}", "\u{1F440}", "\u{1F62E}", "\u{1F634}", "\u{1F914}", "\u2764\uFE0F"];
const reactionOptions = ["\u{1F44D}", "\u2764\uFE0F", "\u{1F602}", "\u{1F62E}", "\u{1F622}", "\u{1F64F}"];

const navItems = [
  { id: "explore", label: "Explore", icon: Compass },
  { id: "chats", label: "Chats", icon: MessageCircle },
  { id: "requests", label: "Requests", icon: UsersRound },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
];

function initials(value = "") {
  const text = value.trim() || "NX";
  return text
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function displayName(profile) {
  return profile?.display_name || profile?.full_name || profile?.username || "Nexcord User";
}

function userHandle(profile) {
  return profile?.username ? `@${profile.username}` : profile?.email ?? "No username";
}

function avatarUrl(profile) {
  return profile?.avatar_url || "";
}

function formatBytes(value = 0) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(value = 0) {
  const minutes = Math.floor(value / 60);
  const seconds = String(value % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function Avatar({ profile, size = "md", className = "" }) {
  const sizeClass = size === "lg" ? "nex-avatar-lg" : "nex-avatar";
  const url = avatarUrl(profile);

  return (
    <span className={`${sizeClass} ${profile?.status === "busy" ? "busy" : "online"} ${className}`}>
      {url ? <img src={url} alt="" /> : initials(displayName(profile))}
    </span>
  );
}

function GroupAvatar({ conversation }) {
  if (conversation?.image_url) {
    return (
      <span className="nex-server-icon has-image">
        <img src={conversation.image_url} alt="" />
      </span>
    );
  }

  return <span className="nex-server-icon bg-gradient-to-br from-purple-500 to-cyan-400">{initials(conversation?.title ?? conversation?.name ?? "Group")}</span>;
}

export default function ChatApp() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const redirectHomeAfterSignOut = useRef(false);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState("chats");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [reactionFor, setReactionFor] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voicePreview, setVoicePreview] = useState(null);
  const [playingVoiceId, setPlayingVoiceId] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [toast, setToast] = useState(null);
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupImageFile, setGroupImageFile] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [settingsForm, setSettingsForm] = useState({ username: "", fullName: "", bio: "" });
  const [securityUnlocked, setSecurityUnlocked] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const typingChannelRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioRefs = useRef({});

  const currentUserId = session?.user?.id;

  const showToast = useCallback((type, title, body = "") => {
    setToast({ id: Date.now(), type, title, body });
    window.setTimeout(() => setToast((current) => (current?.title === title ? null : current)), 3200);
  }, []);

  const loadData = useCallback(async () => {
    if (!currentUserId) return;
    setNotice("");

    const [
      profileResult,
      usersResult,
      friendshipsResult,
      requestsResult,
      notificationsResult,
      favoritesResult,
      membershipsResult,
    ] = await Promise.all([
      supabase.from("users").select("id, full_name, username, email, display_name, avatar_url, bio, status").eq("id", currentUserId).maybeSingle(),
      supabase.from("users").select("id, full_name, username, email, display_name, avatar_url, bio, status, created_at").neq("id", currentUserId).order("created_at", { ascending: false }),
      supabase.from("friendships").select("id, user_low_id, user_high_id, created_at").or(`user_low_id.eq.${currentUserId},user_high_id.eq.${currentUserId}`),
      supabase
        .from("friend_requests")
        .select("id, requester_id, receiver_id, status, created_at, responded_at, requester:users!friend_requests_requester_id_fkey(id, full_name, username, display_name, email, avatar_url, status), receiver:users!friend_requests_receiver_id_fkey(id, full_name, username, display_name, email, avatar_url, status)")
        .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false }),
      supabase.from("notifications").select("id, user_id, actor_id, type, title, body, entity_type, entity_id, read_at, created_at, actor:users!notifications_actor_id_fkey(id, full_name, username, display_name, email, avatar_url, status)").eq("user_id", currentUserId).order("created_at", { ascending: false }).limit(100),
      supabase.from("favorites").select("user_id, target_user_id, conversation_id, created_at").eq("user_id", currentUserId),
      supabase.from("conversation_members").select("conversation_id, conversations(id, type, name, image_url, created_by, created_at, updated_at)").eq("user_id", currentUserId),
    ]);

    if (profileResult.error) setNotice(profileResult.error.message);
    if (usersResult.error) setNotice(usersResult.error.message);
    if (friendshipsResult.error) setNotice(friendshipsResult.error.message);
    if (requestsResult.error) setNotice(requestsResult.error.message);
    if (notificationsResult.error) setNotice(notificationsResult.error.message);
    if (favoritesResult.error) setNotice(favoritesResult.error.message);
    if (membershipsResult.error) setNotice(membershipsResult.error.message);

    const nextProfile = profileResult.data;
    const allUsers = usersResult.data ?? [];
    const nextFriendships = friendshipsResult.data ?? [];
    const nextFavorites = favoritesResult.data ?? [];
    const conversationRows = membershipsResult.data ?? [];
    const conversationIds = conversationRows.map((row) => row.conversation_id);

    let memberRows = [];
    let latestRows = [];
    let unreadRows = [];
    if (conversationIds.length) {
      const [membersResult, latestResult, unreadResult] = await Promise.all([
        supabase.from("conversation_members").select("conversation_id, user_id, users(id, full_name, username, email, display_name, avatar_url, status)").in("conversation_id", conversationIds),
        supabase.from("messages").select("id, conversation_id, body, message_type, file_name, created_at, sender_id").in("conversation_id", conversationIds).order("created_at", { ascending: false }).limit(200),
        supabase.from("messages").select("id, conversation_id").in("conversation_id", conversationIds).neq("sender_id", currentUserId).is("read_at", null).limit(1000),
      ]);
      if (membersResult.error) setNotice(membersResult.error.message);
      if (latestResult.error) setNotice(latestResult.error.message);
      if (unreadResult.error) setNotice(unreadResult.error.message);
      memberRows = membersResult.data ?? [];
      latestRows = latestResult.data ?? [];
      unreadRows = unreadResult.data ?? [];
    }

    const nextConversations = conversationRows
      .map((row) => {
        const conversation = row.conversations;
        const members = memberRows.filter((member) => member.conversation_id === row.conversation_id).map((member) => member.users).filter(Boolean);
        const latest = latestRows.find((message) => message.conversation_id === row.conversation_id);
        const other = members.find((member) => member.id !== currentUserId);
        return {
          ...conversation,
          members,
          other,
          latest,
          unreadCount: unreadRows.filter((message) => message.conversation_id === row.conversation_id).length,
          sortAt: latest?.created_at ?? conversation?.updated_at ?? conversation?.created_at,
          title: conversation?.type === "group" ? conversation?.name : displayName(other),
          subtitle: conversation?.type === "group" ? `${members.length} members` : userHandle(other),
        };
      })
      .filter((conversation) => conversation.id)
      .sort((a, b) => new Date(b.sortAt ?? 0) - new Date(a.sortAt ?? 0));

    setProfile(nextProfile);
    setSettingsForm({
      username: nextProfile?.username ?? "",
      fullName: nextProfile?.full_name ?? nextProfile?.display_name ?? "",
      bio: nextProfile?.bio ?? "",
    });
    setUsers(allUsers);
    setFriendships(nextFriendships);
    setRequests(requestsResult.data ?? []);
    setNotifications(notificationsResult.data ?? []);
    setFavorites(nextFavorites);
    setConversations(nextConversations);
  }, [currentUserId, supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (!data.session) router.replace("/login");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) router.replace(redirectHomeAfterSignOut.current ? "/" : "/login");
    });

    return () => listener.subscription.unsubscribe();
  }, [router, supabase]);

  useEffect(() => {
    if (!currentUserId) return;
    loadData();

    const channel = supabase
      .channel(`social:${currentUserId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "friend_requests" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversation_members" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "message_receipts" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${currentUserId}` }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "favorites", filter: `user_id=eq.${currentUserId}` }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadData, supabase]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      const { data, error } = await supabase
        .from("messages")
        .select("id, body, message_type, delivered_at, read_at, media_url, media_type, file_name, file_size, voice_url, voice_duration, created_at, sender_id, conversation_id, sender:users!messages_sender_id_fkey(id, full_name, username, display_name, email, avatar_url, status), attachments(id, storage_path, file_name, mime_type, size_bytes), message_reactions(id, emoji, user_id, created_at, user:users!message_reactions_user_id_fkey(id, username, display_name, full_name, avatar_url)), message_receipts(message_id, user_id, delivered_at, read_at)")
        .eq("conversation_id", activeConversationId)
        .order("created_at", { ascending: true })
        .limit(150);

      if (error) {
        setNotice(error.message);
        return;
      }
      const rows = data ?? [];
      const messagesWithUrls = await Promise.all(rows.map(async (message) => {
        const attachments = await Promise.all((message.attachments ?? []).map(async (attachment) => {
          const { data: signed } = await supabase.storage.from("chat-attachments").createSignedUrl(attachment.storage_path, 60 * 60);
          return { ...attachment, signedUrl: signed?.signedUrl ?? "" };
        }));
        let signedVoiceUrl = "";
        if (message.voice_url) {
          const { data: signedVoice } = await supabase.storage.from("voice-messages").createSignedUrl(message.voice_url, 60 * 60);
          signedVoiceUrl = signedVoice?.signedUrl ?? "";
        }
        return { ...message, attachments, signedVoiceUrl };
      }));

      setMessages(messagesWithUrls);

      const unreadIds = rows.filter((message) => message.sender_id !== currentUserId && !message.read_at).map((message) => message.id);
      if (unreadIds.length) {
        const now = new Date().toISOString();
        await supabase.from("message_receipts").upsert(unreadIds.map((id) => ({ message_id: id, user_id: currentUserId, delivered_at: now, read_at: now })), { onConflict: "message_id,user_id" });
        await supabase.from("messages").update({ delivered_at: now, read_at: now }).in("id", unreadIds);
      }
    }

    loadMessages();

    const channel = supabase
      .channel(`conversation:${activeConversationId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConversationId}` }, loadMessages)
      .on("postgres_changes", { event: "*", schema: "public", table: "attachments" }, loadMessages)
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, loadMessages)
      .on("postgres_changes", { event: "*", schema: "public", table: "message_receipts" }, loadMessages)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, currentUserId, supabase]);

  useEffect(() => {
    if (!activeConversationId || !currentUserId) {
      setTypingUsers([]);
      return;
    }

    const channel = supabase.channel(`typing:${activeConversationId}`, {
      config: { presence: { key: currentUserId } },
    });
    typingChannelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const typing = Object.values(state)
          .flat()
          .filter((entry) => entry.user_id !== currentUserId && entry.typing)
          .map((entry) => entry.username || entry.name);
        setTypingUsers([...new Set(typing)]);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: currentUserId, name: displayName(profile), username: profile?.username || userHandle(profile), typing: false });
        }
      });

    return () => {
      typingChannelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, currentUserId, profile, supabase]);

  useEffect(() => {
    if (!currentUserId || !conversations.length) return;
    const conversationIds = new Set(conversations.map((conversation) => conversation.id));

    async function markDelivered(message) {
      if (!conversationIds.has(message.conversation_id) || message.sender_id === currentUserId || message.conversation_id === activeConversationId) return;
      const now = new Date().toISOString();
      await supabase.from("message_receipts").upsert({ message_id: message.id, user_id: currentUserId, delivered_at: now }, { onConflict: "message_id,user_id" });
      await supabase.from("messages").update({ delivered_at: now }).eq("id", message.id).is("delivered_at", null);
    }

    const channel = supabase
      .channel(`delivery:${currentUserId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => markDelivered(payload.new))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, conversations, currentUserId, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, typingUsers.length]);

  const friendIds = useMemo(() => friendships.map((friendship) => (friendship.user_low_id === currentUserId ? friendship.user_high_id : friendship.user_low_id)), [friendships, currentUserId]);
  const pendingByUser = useMemo(() => {
    const map = new Map();
    requests.filter((request) => request.status === "pending").forEach((request) => {
      map.set(request.requester_id === currentUserId ? request.receiver_id : request.requester_id, request);
    });
    return map;
  }, [requests, currentUserId]);

  const friendProfiles = users.filter((user) => friendIds.includes(user.id));

  const filteredUsers = users.filter((user) => {
    const query = search.toLowerCase();
    const matches = `${user.username ?? ""} ${user.full_name ?? ""} ${user.display_name ?? ""}`.toLowerCase().includes(query);
    if (!matches) return false;
    if (activeFilter === "Favorites") return favorites.some((favorite) => favorite.target_user_id === user.id);
    return true;
  });

  const filteredConversations = conversations.filter((conversation) => {
    const query = search.toLowerCase();
    const matches = `${conversation.title ?? ""} ${conversation.subtitle ?? ""} ${conversation.latest?.body ?? ""}`.toLowerCase().includes(query);
    if (!matches) return false;
    if (activeFilter === "Groups") return conversation.type === "group";
    if (activeFilter === "Favorites") return conversation.type === "direct" && favorites.some((favorite) => favorite.target_user_id === conversation.other?.id);
    if (activeFilter === "Unread") return conversation.unreadCount > 0;
    return true;
  });

  const incomingRequests = requests.filter((request) => request.receiver_id === currentUserId && request.status === "pending");
  const outgoingRequests = requests.filter((request) => request.requester_id === currentUserId && request.status === "pending");
  const unreadNotifications = notifications.filter((notification) => !notification.read_at).length;
  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId);

  async function sendRequest(user) {
    setNotice("");
    const { data, error } = await supabase
      .from("friend_requests")
      .insert({ requester_id: currentUserId, receiver_id: user.id })
      .select("id")
      .single();

    if (error) {
      setNotice(error.message);
      return;
    }

    await supabase.from("notifications").insert({
      user_id: user.id,
      actor_id: currentUserId,
      type: "request_received",
      title: "New chat request",
      body: `${displayName(profile)} wants to chat with you.`,
      entity_type: "friend_request",
      entity_id: data.id,
    });
    loadData();
  }

  async function acceptRequest(request) {
    const { error } = await supabase.rpc("accept_friend_request", { request_uuid: request.id });
    if (error) {
      setNotice(error.message);
      return;
    }
    loadData();
  }

  async function rejectRequest(request) {
    const { error } = await supabase.from("friend_requests").update({ status: "rejected", responded_at: new Date().toISOString() }).eq("id", request.id);
    if (error) {
      setNotice(error.message);
      return;
    }
    await supabase.from("notifications").insert({
      user_id: request.requester_id,
      actor_id: currentUserId,
      type: "request_rejected",
      title: "Chat request declined",
      body: `${displayName(profile)} declined your chat request.`,
      entity_type: "friend_request",
      entity_id: request.id,
    });
    loadData();
  }

  async function toggleFavoriteUser(user) {
    const existing = favorites.find((favorite) => favorite.target_user_id === user.id);
    if (existing) {
      const { error } = await supabase.from("favorites").delete().eq("user_id", currentUserId).eq("target_user_id", user.id);
      if (error) setNotice(error.message);
    } else {
      const { error } = await supabase.from("favorites").insert({
        user_id: currentUserId,
        target_user_id: user.id,
      });
      if (error) setNotice(error.message);
    }
    loadData();
  }

  function messageTypeForFile(file) {
    if (!file) return "text";
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    return "file";
  }

  function handleDraftChange(value) {
    setDraft(value);
    if (!typingChannelRef.current || !currentUserId) return;
    const typingName = profile?.username || userHandle(profile);
    typingChannelRef.current.track({ user_id: currentUserId, name: displayName(profile), username: typingName, typing: value.trim().length > 0 });
    window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      typingChannelRef.current?.track({ user_id: currentUserId, name: displayName(profile), username: typingName, typing: false });
    }, 2400);
  }

  async function sendMessage(event) {
    event.preventDefault();
    const body = draft.trim();
    if ((!body && !attachmentFile) || !activeConversationId) return;

    if (attachmentFile && attachmentFile.size > maxUploadSize) {
      showToast("error", "Upload too large", "Attachments must be 5MB or smaller.");
      return;
    }

    setDraft("");
    setEmojiOpen(false);
    setUploadProgress(attachmentFile ? 18 : 0);
    typingChannelRef.current?.track({ user_id: currentUserId, name: displayName(profile), username: profile?.username || userHandle(profile), typing: false });

    let storagePath = "";
    let signedUrl = "";
    const file = attachmentFile;
    const messageType = messageTypeForFile(file);
    setAttachmentFile(null);

    if (file) {
      storagePath = `${currentUserId}/${activeConversationId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage.from("chat-attachments").upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
      setUploadProgress(70);

      if (uploadError) {
        showToast("error", "Upload failed", uploadError.message);
        setUploadProgress(0);
        return;
      }

      const { data: signed } = await supabase.storage.from("chat-attachments").createSignedUrl(storagePath, 60 * 60);
      signedUrl = signed?.signedUrl ?? "";
    }

    const tempId = `temp-${Date.now()}`;
    setMessages((current) => [...current, {
      id: tempId,
      body: body || file?.name || "",
      message_type: messageType,
      media_type: file?.type ?? null,
      file_name: file?.name ?? null,
      file_size: file?.size ?? null,
      created_at: new Date().toISOString(),
      sender_id: currentUserId,
      sender: profile,
      attachments: file ? [{ id: `${tempId}-att`, file_name: file.name, mime_type: file.type, size_bytes: file.size, signedUrl }] : [],
      message_reactions: [],
      pending: true,
    }]);

    const { data, error } = await supabase.from("messages").insert({
      conversation_id: activeConversationId,
      sender_id: currentUserId,
      body: body || file?.name || "",
      message_type: messageType,
      media_type: file?.type ?? null,
      file_name: file?.name ?? null,
      file_size: file?.size ?? null,
      media_url: storagePath || null,
    }).select("id").single();

    if (error) {
      showToast("error", "Message failed", error.message);
      setDraft(body);
      setMessages((current) => current.filter((message) => message.id !== tempId));
      setUploadProgress(0);
      return;
    }

    if (file && data?.id) {
      const { error: attachmentError } = await supabase.from("attachments").insert({
        message_id: data.id,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      });
      if (attachmentError) showToast("error", "Attachment saved late", attachmentError.message);
    }

    setUploadProgress(file ? 100 : 0);
    window.setTimeout(() => setUploadProgress(0), 700);
  }

  async function toggleReaction(message, emoji) {
    const existing = (message.message_reactions ?? []).find((reaction) => reaction.user_id === currentUserId && reaction.emoji === emoji);
    if (existing) {
      const { error } = await supabase.from("message_reactions").delete().eq("id", existing.id);
      if (error) showToast("error", "Reaction failed", error.message);
    } else {
      const { error } = await supabase.from("message_reactions").insert({ message_id: message.id, user_id: currentUserId, emoji });
      if (error) showToast("error", "Reaction failed", error.message);
    }
    setReactionFor("");
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
      showToast("error", "Voice unavailable", "This browser does not support voice recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];
      mediaRecorderRef.current = recorder;
      setVoicePreview(null);
      setRecordingSeconds(0);
      setRecording(true);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        window.clearInterval(recordingTimerRef.current);
      };

      recorder.start();
      recordingTimerRef.current = window.setInterval(() => setRecordingSeconds((value) => value + 1), 1000);
    } catch (error) {
      showToast("error", "Microphone blocked", error.message);
    }
  }

  function cancelRecording() {
    const recorder = mediaRecorderRef.current;
    audioChunksRef.current = [];
    setRecording(false);
    setRecordingSeconds(0);
    setVoicePreview(null);
    window.clearInterval(recordingTimerRef.current);
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
      recorder.stream.getTracks().forEach((track) => track.stop());
      window.clearInterval(recordingTimerRef.current);
      setRecording(false);
      setVoicePreview({
        blob,
        url: URL.createObjectURL(blob),
        duration: recordingSeconds || 1,
        mimeType: blob.type || "audio/webm",
      });
    };
    recorder.stop();
  }

  async function sendVoiceMessage() {
    if (!voicePreview || !activeConversationId) return;
    if (voicePreview.blob.size > maxUploadSize) {
      showToast("error", "Voice note too large", "Voice messages must be 5MB or smaller.");
      return;
    }

    const path = `${currentUserId}/${activeConversationId}/voice-${Date.now()}.webm`;
    const { error: uploadError } = await supabase.storage.from("voice-messages").upload(path, voicePreview.blob, {
      contentType: voicePreview.mimeType,
      upsert: false,
    });

    if (uploadError) {
      showToast("error", "Voice upload failed", uploadError.message);
      return;
    }

    const { data: signed } = await supabase.storage.from("voice-messages").createSignedUrl(path, 60 * 60);
    const tempId = `voice-temp-${Date.now()}`;
    setMessages((current) => [...current, {
      id: tempId,
      body: "Voice message",
      message_type: "voice",
      voice_url: path,
      voice_duration: voicePreview.duration,
      signedVoiceUrl: signed?.signedUrl ?? voicePreview.url,
      created_at: new Date().toISOString(),
      sender_id: currentUserId,
      sender: profile,
      attachments: [],
      message_reactions: [],
      pending: true,
    }]);

    const { error } = await supabase.from("messages").insert({
      conversation_id: activeConversationId,
      sender_id: currentUserId,
      body: "Voice message",
      message_type: "voice",
      voice_url: path,
      voice_duration: voicePreview.duration,
      media_type: voicePreview.mimeType,
      file_size: voicePreview.blob.size,
    });

    if (error) {
      showToast("error", "Voice message failed", error.message);
      setMessages((current) => current.filter((message) => message.id !== tempId));
      return;
    }

    URL.revokeObjectURL(voicePreview.url);
    setVoicePreview(null);
  }

  function toggleVoicePlayback(message) {
    const audio = audioRefs.current[message.id];
    if (!audio) return;
    if (playingVoiceId === message.id) {
      audio.pause();
      setPlayingVoiceId("");
      return;
    }
    Object.values(audioRefs.current).forEach((item) => item?.pause());
    audio.play();
    setPlayingVoiceId(message.id);
  }

  async function createGroup(event) {
    event.preventDefault();
    if (!groupName.trim()) return;
    if (groupImageFile && groupImageFile.size > maxUploadSize) {
      showToast("error", "Group image too large", "Group images must be 5MB or smaller.");
      return;
    }
    const selectedFriendIds = groupMembers.filter((id) => friendIds.includes(id));
    if (!selectedFriendIds.length) {
      setNotice("Choose at least one accepted friend.");
      return;
    }

    let groupImageUrl = "";
    if (groupImageFile) {
      const path = `${currentUserId}/group-${Date.now()}-${groupImageFile.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage.from("group-images").upload(path, groupImageFile, { upsert: false });
      if (uploadError) {
        showToast("error", "Group image failed", uploadError.message);
        return;
      }
      const { data } = supabase.storage.from("group-images").getPublicUrl(path);
      groupImageUrl = data.publicUrl;
    }

    const { data: conversationId, error: conversationError } = await supabase.rpc("create_group_conversation", {
      group_name: groupName.trim(),
      group_description: groupDescription.trim(),
      group_image_url: groupImageUrl || null,
      member_ids: selectedFriendIds,
    });

    if (conversationError) {
      showToast("error", "Group not created", conversationError.message);
      return;
    }

    setGroupName("");
    setGroupDescription("");
    setGroupImageFile(null);
    setGroupMembers([]);
    setGroupOpen(false);
    showToast("success", "Group created", `${groupName.trim()} is ready.`);
    setActiveConversationId(conversationId);
    setView("chats");
    loadData();
  }

  async function markNotification(notification) {
    if (!notification.read_at) {
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", notification.id);
      loadData();
    }
    if (notification.entity_type === "conversation" && notification.entity_id) {
      setActiveConversationId(notification.entity_id);
      setView("chats");
    }
    if (notification.entity_type === "friend_request") setView("requests");
  }

  async function saveProfile(event) {
    event.preventDefault();
    const { error } = await supabase
      .from("users")
      .update({
        username: settingsForm.username.trim(),
        full_name: settingsForm.fullName.trim(),
        display_name: settingsForm.fullName.trim(),
        bio: settingsForm.bio.trim(),
      })
      .eq("id", currentUserId);
    if (error) {
      setNotice(error.message);
      showToast("error", "Profile not saved", error.message);
    }
    else {
      setNotice("Profile updated.");
      showToast("success", "Profile saved", "Your Nexcord identity has been updated.");
      loadData();
    }
  }

  async function uploadAvatar(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `${currentUserId}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      setNotice(error.message);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("users").update({ avatar_url: data.publicUrl }).eq("id", currentUserId);
    loadData();
  }

  async function unlockSecurity(event) {
    event.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email: session.user.email, password: currentPassword });
    if (error) {
      setNotice(error.message);
      return;
    }
    setSecurityUnlocked(true);
    setNotice("Security settings unlocked.");
  }

  async function changePassword() {
    if (!newPassword.trim()) return;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setNotice(error.message);
    else {
      setNewPassword("");
      setNotice("Password updated.");
    }
  }

  async function deleteAccount() {
    if (!securityUnlocked || !currentPassword) {
      setNotice("Confirm your password before deleting your account.");
      return;
    }

    const confirmed = window.confirm("Delete your Nexcord account permanently?");
    if (!confirmed) return;

    const response = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.user.email, password: currentPassword, userId: currentUserId }),
    });
    const data = await response.json();

    if (!response.ok) {
      setNotice(data.message ?? "Could not delete account.");
      return;
    }

    await supabase.auth.signOut();
    router.replace("/signup");
  }

  async function signOut() {
    redirectHomeAfterSignOut.current = true;
    await supabase.auth.signOut();
    setActiveConversationId("");
    router.replace("/");
  }

  function openView(nextView) {
    setView(nextView);
    setDrawerOpen(false);
    if (nextView !== "chats") setActiveConversationId("");
  }

  if (loading) {
    return (
      <main className="nex-dashboard-loading">
        <Image src="/nexcord_logo.png" alt="" width={72} height={72} priority />
        <span>Opening Nexcord...</span>
      </main>
    );
  }

  const controlPanel = (
    <div className="nex-control-content">
      <div className="nex-community-switcher">
        <div className="nex-community-mark">
          <Crown size={17} />
        </div>
        <div>
          <strong>{view[0].toUpperCase() + view.slice(1)}</strong>
          <span>{view === "chats" ? "Accepted friends and groups" : "Real-time Nexcord"}</span>
        </div>
      </div>

      <label className="nex-search">
        <Search size={18} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Nexcord..." />
      </label>

      <div className="nex-filters" aria-label="Filters">
        {filters.map((filter) => (
          <button key={filter} type="button" className={activeFilter === filter ? "active" : ""} onClick={() => setActiveFilter(filter)}>
            {activeFilter === filter ? <motion.span layoutId="filterGlow" className="nex-filter-glow" /> : null}
            <span>{filter}</span>
          </button>
        ))}
      </div>

      <div className="nex-list-scroll">
        {view === "chats" ? (
          <section className="nex-list-section">
            <div className="nex-section-title">
              <span>{activeFilter === "Favorites" ? "Favorite Chats" : "Chats"}</span>
              {activeFilter === "Favorites" ? null : (
                <button className="nex-mini-icon" type="button" title="Create group" onClick={() => setGroupOpen(true)}>
                  <Plus size={15} />
                </button>
              )}
            </div>
            {activeFilter === "Favorites" ? (
              <FavoriteManager friends={friendProfiles} favorites={favorites} onToggle={toggleFavoriteUser} />
            ) : null}
            {filteredConversations.map((conversation) => {
              return (
                <button key={conversation.id} className="nex-list-item" data-active={conversation.id === activeConversationId} type="button" onClick={() => setActiveConversationId(conversation.id)}>
                  {conversation.type === "group" ? <GroupAvatar conversation={conversation} /> : <Avatar profile={conversation.other} />}
                  <span className="min-w-0">
                    <strong>{conversation.title}</strong>
                    <small>{conversation.latest?.body ?? conversation.subtitle}</small>
                  </span>
                  {conversation.unreadCount ? <em className="nex-unread-count">{conversation.unreadCount}</em> : null}
                </button>
              );
            })}
            {!filteredConversations.length ? <p className="nex-empty-copy">{activeFilter === "Favorites" ? "Choose friends above to add them to favorites." : "Accepted friends and groups will appear here."}</p> : null}
          </section>
        ) : null}

        {view === "explore" ? <ExploreList users={filteredUsers} friendIds={friendIds} pendingByUser={pendingByUser} onRequest={sendRequest} /> : null}
        {view === "requests" ? <RequestsList incoming={incomingRequests} outgoing={outgoingRequests} onAccept={acceptRequest} onReject={rejectRequest} /> : null}
        {view === "notifications" ? <NotificationsList notifications={notifications} onOpen={markNotification} /> : null}
        {view === "settings" ? <SettingsSummary profile={profile} /> : null}
      </div>

      <div className="nex-profile-strip">
        <Avatar profile={profile} />
        <div>
          <strong>{displayName(profile)}</strong>
          <small>{userHandle(profile)}</small>
        </div>
        <button type="button" title="Sign out" onClick={signOut}>
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <main className="nex-dashboard">
      <AnimatePresence>
        {toast ? (
          <motion.div className={`nex-toast ${toast.type}`} initial={{ opacity: 0, y: -18, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -18, scale: 0.96 }}>
            <strong>{toast.title}</strong>
            {toast.body ? <span>{toast.body}</span> : null}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <aside className="nex-shadow-sidebar" aria-label="Primary navigation">
        <Image className="nex-logo-tile" src="/nexcord_logo.png" alt="Nexcord" width={48} height={48} priority />
        <nav>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={view === id ? "active" : ""} type="button" title={label} onClick={() => openView(id)}>
              <Icon size={22} />
              {id === "requests" && incomingRequests.length ? <span className="nex-nav-badge">{incomingRequests.length}</span> : null}
              {id === "notifications" && unreadNotifications ? <span className="nex-nav-badge">{unreadNotifications}</span> : null}
            </button>
          ))}
        </nav>
      </aside>

      <aside className="nex-control-panel">{controlPanel}</aside>

      <AnimatePresence>
        {drawerOpen ? (
          <motion.div className="nex-mobile-drawer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="nex-drawer-backdrop" type="button" aria-label="Close drawer" onClick={() => setDrawerOpen(false)} />
            <motion.aside initial={{ x: -330 }} animate={{ x: 0 }} exit={{ x: -330 }} transition={{ type: "spring", stiffness: 260, damping: 28 }}>
              <button className="nex-drawer-close" type="button" title="Close menu" onClick={() => setDrawerOpen(false)}>
                <X size={18} />
              </button>
              {controlPanel}
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="nex-chat-window">
        <header className="nex-chat-header">
          <div className="nex-chat-title">
            <button className="nex-mobile-menu" type="button" title="Open chats" onClick={() => setDrawerOpen(true)}>
              <Menu size={20} />
            </button>
            {activeConversation?.type === "group" ? <Hash size={25} /> : <AtSign size={23} />}
            <div>
              <h1>{activeConversation ? activeConversation.title : view[0].toUpperCase() + view.slice(1)}</h1>
              <p>{activeConversation ? activeConversation.subtitle : "Nexcord command center"}</p>
            </div>
          </div>
          <div className="nex-header-actions">
            <button type="button" title="Create group" onClick={() => setGroupOpen(true)}>
              <Plus size={19} />
            </button>
            <button type="button" title="Security" onClick={() => openView("settings")}>
              <Shield size={19} />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {view === "chats" ? (
            activeConversation ? (
              <ChatConversation
                key={activeConversation.id}
                conversation={activeConversation}
                messages={messages}
                draft={draft}
                onDraftChange={handleDraftChange}
                onSend={sendMessage}
                notice={notice}
                currentUserId={currentUserId}
                typingUsers={typingUsers}
                emojiOpen={emojiOpen}
                setEmojiOpen={setEmojiOpen}
                reactionFor={reactionFor}
                setReactionFor={setReactionFor}
                onReact={toggleReaction}
                attachmentFile={attachmentFile}
                setAttachmentFile={setAttachmentFile}
                uploadProgress={uploadProgress}
                messagesEndRef={messagesEndRef}
                recording={recording}
                recordingSeconds={recordingSeconds}
                voicePreview={voicePreview}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onCancelRecording={cancelRecording}
                onSendVoice={sendVoiceMessage}
                playingVoiceId={playingVoiceId}
                audioRefs={audioRefs}
                onToggleVoice={toggleVoicePlayback}
                setPlayingVoiceId={setPlayingVoiceId}
              />
            ) : (
              <EmptyChat key="empty-chat" />
            )
          ) : (
            <MainView
              key={view}
              view={view}
              users={filteredUsers}
              friendIds={friendIds}
              pendingByUser={pendingByUser}
              incoming={incomingRequests}
              outgoing={outgoingRequests}
              notifications={notifications}
              profile={profile}
              settingsForm={settingsForm}
              setSettingsForm={setSettingsForm}
              securityUnlocked={securityUnlocked}
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              onRequest={sendRequest}
              onAccept={acceptRequest}
              onReject={rejectRequest}
              onNotification={markNotification}
              onSaveProfile={saveProfile}
              onUploadAvatar={uploadAvatar}
              onUnlockSecurity={unlockSecurity}
              onChangePassword={changePassword}
              onDeleteAccount={deleteAccount}
              onSignOut={signOut}
              notice={notice}
            />
          )}
        </AnimatePresence>
      </section>

      <aside className="nex-info-rail">
        <div className="nex-info-card">
          <UsersRound size={22} />
          <strong>{friendIds.length} Friends</strong>
          <span>Accepted chat connections</span>
        </div>
        <div className="nex-info-card">
          <Bell size={22} />
          <strong>{unreadNotifications} Unread</strong>
          <span>Live notification stream</span>
        </div>
      </aside>

      <AnimatePresence>
        {groupOpen ? (
          <motion.div className="nex-modal-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="nex-drawer-backdrop" type="button" aria-label="Close modal" onClick={() => setGroupOpen(false)} />
            <motion.form className="nex-modal-card" onSubmit={createGroup} initial={{ scale: 0.94, y: 18 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 18 }}>
              <h2>Create Group</h2>
              <p>Only accepted friends can be added.</p>
              <label className="nex-group-image-picker">
                <span>{groupImageFile ? groupImageFile.name : "Add group picture"}</span>
                <Upload size={16} />
                <input type="file" accept="image/*" onChange={(event) => setGroupImageFile(event.target.files?.[0] ?? null)} />
              </label>
              <label className="nex-settings-field">
                <span>Group name</span>
                <input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Project Alpha" />
              </label>
              <label className="nex-settings-field">
                <span>Description</span>
                <textarea value={groupDescription} onChange={(event) => setGroupDescription(event.target.value)} placeholder="What is this group about?" />
              </label>
              <div className="nex-member-grid">
                {friendProfiles.map((friend) => (
                  <button key={friend.id} type="button" className={groupMembers.includes(friend.id) ? "active" : ""} onClick={() => setGroupMembers((current) => current.includes(friend.id) ? current.filter((id) => id !== friend.id) : [...current, friend.id])}>
                    <Avatar profile={friend} />
                    <span>{displayName(friend)}</span>
                  </button>
                ))}
              </div>
              <button className="nex-action-primary" type="submit">Create Group</button>
            </motion.form>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function ExploreList({ users, friendIds, pendingByUser, onRequest }) {
  return (
    <section className="nex-list-section">
      <div className="nex-section-title"><span>Explore Users</span><UserPlus size={15} /></div>
      {users.map((user) => {
        const pending = pendingByUser.get(user.id);
        const friend = friendIds.includes(user.id);
        return (
          <button key={user.id} className="nex-list-item" type="button">
            <Avatar profile={user} />
            <span className="min-w-0"><strong>{displayName(user)}</strong><small>{userHandle(user)}</small></span>
            <span className="nex-request-chip" onClick={(event) => { event.stopPropagation(); if (!friend && !pending) onRequest(user); }}>
              {friend ? "Friend" : pending ? "Pending" : "Request"}
            </span>
          </button>
        );
      })}
      {!users.length ? <p className="nex-empty-copy">No users found.</p> : null}
    </section>
  );
}

function FavoriteManager({ friends, favorites, onToggle }) {
  return (
    <div className="nex-favorite-manager">
      <div className="nex-section-title">
        <span>Add From Friends</span>
      </div>
      {friends.map((friend) => {
        const active = favorites.some((favorite) => favorite.target_user_id === friend.id);
        return (
          <button key={friend.id} className="nex-favorite-row" data-active={active} type="button" onClick={() => onToggle(friend)}>
            <Avatar profile={friend} />
            <span>
              <strong>{displayName(friend)}</strong>
              <small>{active ? "Favorite" : "Tap to add"}</small>
            </span>
            <em>{active ? "Remove" : "Add"}</em>
          </button>
        );
      })}
      {!friends.length ? <p className="nex-empty-copy">Accepted friends will appear here.</p> : null}
    </div>
  );
}

function RequestsList({ incoming, outgoing, onAccept, onReject }) {
  return (
    <section className="nex-list-section">
      <div className="nex-section-title"><span>Incoming Requests</span><UsersRound size={15} /></div>
      {incoming.map((request) => <RequestCard key={request.id} request={request} user={request.requester} incoming onAccept={onAccept} onReject={onReject} />)}
      {!incoming.length ? <p className="nex-empty-copy">No incoming requests.</p> : null}
      <div className="nex-section-title"><span>Outgoing Requests</span><Send size={15} /></div>
      {outgoing.map((request) => <RequestCard key={request.id} request={request} user={request.receiver} />)}
      {!outgoing.length ? <p className="nex-empty-copy">No outgoing requests.</p> : null}
    </section>
  );
}

function RequestCard({ request, user, incoming, onAccept, onReject }) {
  return (
    <div className="nex-list-item nex-request-card">
      <Avatar profile={user} />
      <span className="min-w-0"><strong>{displayName(user)}</strong><small>{userHandle(user)}</small></span>
      {incoming ? (
        <span className="nex-request-actions">
          <button type="button" title="Accept" onClick={() => onAccept(request)}><Check size={15} /></button>
          <button type="button" title="Reject" onClick={() => onReject(request)}><X size={15} /></button>
        </span>
      ) : <em>Pending</em>}
    </div>
  );
}

function NotificationsList({ notifications, onOpen }) {
  return (
    <section className="nex-list-section">
      <div className="nex-section-title"><span>Notifications</span><Bell size={15} /></div>
      {notifications.map((notification) => (
        <button key={notification.id} className="nex-list-item" data-active={!notification.read_at} type="button" onClick={() => onOpen(notification)}>
          <Avatar profile={notification.actor} />
          <span className="min-w-0"><strong>{notification.title}</strong><small>{notification.body ?? new Date(notification.created_at).toLocaleString()}</small></span>
        </button>
      ))}
      {!notifications.length ? <p className="nex-empty-copy">No notifications yet.</p> : null}
    </section>
  );
}

function SettingsSummary({ profile }) {
  return (
    <section className="nex-list-section">
      <div className="nex-section-title"><span>Settings</span><Settings size={15} /></div>
      <div className="nex-settings-mini"><Avatar profile={profile} size="lg" /><strong>{displayName(profile)}</strong><small>{userHandle(profile)}</small></div>
    </section>
  );
}

function MainView(props) {
  if (props.view === "explore") return <motion.div className="nex-main-view" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}><ExploreGrid {...props} /></motion.div>;
  if (props.view === "requests") return <motion.div className="nex-main-view" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}><RequestsGrid {...props} /></motion.div>;
  if (props.view === "notifications") return <motion.div className="nex-main-view" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}><NotificationsGrid {...props} /></motion.div>;
  return <motion.div className="nex-main-view" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}><SettingsPanel {...props} /></motion.div>;
}

function ExploreGrid({ users, friendIds, pendingByUser, onRequest }) {
  return (
    <div className="nex-page-grid">
      {users.map((user) => {
        const friend = friendIds.includes(user.id);
        const pending = pendingByUser.get(user.id);
        return (
          <article className="nex-user-card" key={user.id}>
            <Avatar profile={user} size="lg" />
            <h2>{displayName(user)}</h2>
            <p>{userHandle(user)}</p>
            <button className="nex-action-primary" type="button" disabled={friend || pending} onClick={() => onRequest(user)}>
              {friend ? "Already Friends" : pending ? "Request Pending" : "Request Chat"}
            </button>
          </article>
        );
      })}
      {!users.length ? <EmptyPanel title="No users found" body="When other real users join Nexcord, they will appear here." /> : null}
    </div>
  );
}

function RequestsGrid({ incoming, outgoing, onAccept, onReject }) {
  return (
    <div className="nex-page-stack">
      <h2>Incoming Requests</h2>
      {incoming.map((request) => <RequestCard key={request.id} request={request} user={request.requester} incoming onAccept={onAccept} onReject={onReject} />)}
      {!incoming.length ? <EmptyPanel title="No incoming requests" body="New chat requests will arrive here in real time." /> : null}
      <h2>Outgoing Requests</h2>
      {outgoing.map((request) => <RequestCard key={request.id} request={request} user={request.receiver} />)}
    </div>
  );
}

function NotificationsGrid({ notifications, onNotification }) {
  return (
    <div className="nex-page-stack">
      {notifications.map((notification) => (
        <button className="nex-notification-row" key={notification.id} data-unread={!notification.read_at} type="button" onClick={() => onNotification(notification)}>
          <Avatar profile={notification.actor} />
          <span><strong>{notification.title}</strong><small>{notification.body}</small></span>
          <time>{new Date(notification.created_at).toLocaleString()}</time>
        </button>
      ))}
      {!notifications.length ? <EmptyPanel title="No notifications" body="Requests, accepts, groups, and system updates will appear here." /> : null}
    </div>
  );
}

function SettingsPanel({ profile, settingsForm, setSettingsForm, securityUnlocked, currentPassword, setCurrentPassword, newPassword, setNewPassword, onSaveProfile, onUploadAvatar, onUnlockSecurity, onChangePassword, onDeleteAccount, onSignOut, notice }) {
  return (
    <div className="nex-settings-panel">
      <form className="nex-settings-card" onSubmit={onSaveProfile}>
        <h2>Profile</h2>
        <div className="nex-avatar-edit">
          <Avatar profile={profile} size="lg" />
          <label className="nex-action-secondary"><Upload size={16} /> Change Picture<input type="file" accept="image/*" onChange={onUploadAvatar} /></label>
        </div>
        <label className="nex-settings-field"><span>Username</span><input value={settingsForm.username} onChange={(event) => setSettingsForm((current) => ({ ...current, username: event.target.value }))} /></label>
        <label className="nex-settings-field"><span>Full name</span><input value={settingsForm.fullName} onChange={(event) => setSettingsForm((current) => ({ ...current, fullName: event.target.value }))} /></label>
        <label className="nex-settings-field"><span>Bio</span><textarea value={settingsForm.bio} onChange={(event) => setSettingsForm((current) => ({ ...current, bio: event.target.value }))} /></label>
        <button className="nex-action-primary" type="submit">Save Profile</button>
      </form>

      <div className="nex-settings-card">
        <h2>Security</h2>
        {!securityUnlocked ? (
          <form className="nex-settings-field" onSubmit={onUnlockSecurity}>
            <span>Confirm password to unlock sensitive settings</span>
            <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Current password" />
            <button className="nex-action-primary" type="submit">Unlock Security</button>
          </form>
        ) : (
          <div className="nex-settings-field">
            <span>New password</span>
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" />
            <button className="nex-action-primary" type="button" onClick={onChangePassword}>Change Password</button>
            <button className="nex-danger-button" type="button" onClick={onDeleteAccount}><Trash2 size={16} /> Delete Account</button>
          </div>
        )}
      </div>

      <div className="nex-settings-card">
        <h2>Account</h2>
        <button className="nex-action-secondary" type="button" onClick={onSignOut}>Logout</button>
        {notice ? <p className="nex-notice">{notice}</p> : null}
      </div>
    </div>
  );
}

function ChatConversation({
  conversation,
  messages,
  draft,
  onDraftChange,
  onSend,
  notice,
  currentUserId,
  typingUsers,
  emojiOpen,
  setEmojiOpen,
  reactionFor,
  setReactionFor,
  onReact,
  attachmentFile,
  setAttachmentFile,
  uploadProgress,
  messagesEndRef,
  recording,
  recordingSeconds,
  voicePreview,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  onSendVoice,
  playingVoiceId,
  audioRefs,
  onToggleVoice,
  setPlayingVoiceId,
}) {
  function groupedReactions(message) {
    return (message.message_reactions ?? []).reduce((acc, reaction) => {
      acc[reaction.emoji] = acc[reaction.emoji] ?? { emoji: reaction.emoji, count: 0, names: [] };
      acc[reaction.emoji].count += 1;
      acc[reaction.emoji].names.push(displayName(reaction.user));
      return acc;
    }, {});
  }

  return (
    <>
      <div className="nex-message-area">
        <div className="nex-watermark"><Image src="/nexcord_logo.png" alt="" width={340} height={340} priority /><span>NEXCORD</span></div>
        <div className="nex-date-chip">Live Conversation</div>
        <div className="nex-messages">
          {messages.map((message, index) => {
            const mine = message.sender_id === currentUserId;
            const reactions = Object.values(groupedReactions(message));
            return (
              <motion.article className={`nex-message ${mine ? "mine" : "theirs"}`} key={message.id} initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: Math.min(index * 0.025, 0.18) }}>
                {!mine ? <Avatar profile={message.sender} /> : null}
                <div className="nex-message-bubble">
                  <div className="nex-message-meta">
                    <strong className={mine ? "text-cyan-200" : "text-purple-200"}>{mine ? "You" : displayName(message.sender)}</strong>
                    <span>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {mine ? <MessageTicks message={message} /> : null}
                  </div>
                  {message.body ? <p>{message.body}</p> : null}
                  {message.message_type === "voice" ? (
                    <VoiceMessage
                      message={message}
                      playing={playingVoiceId === message.id}
                      audioRefs={audioRefs}
                      onToggle={onToggleVoice}
                      onEnded={() => setPlayingVoiceId("")}
                    />
                  ) : null}
                  {(message.attachments ?? []).map((attachment) => <AttachmentPreview key={attachment.id} attachment={attachment} />)}
                  {reactions.length ? (
                    <div className="nex-reactions">
                      {reactions.map((reaction) => (
                        <span key={reaction.emoji} title={reaction.names.join(", ")}>{reaction.emoji} {reaction.count}</span>
                      ))}
                    </div>
                  ) : null}
                  <div className="nex-message-tools">
                    <button type="button" title="React" onClick={() => setReactionFor(reactionFor === message.id ? "" : message.id)}><SmilePlus size={15} /></button>
                  </div>
                  <AnimatePresence>
                    {reactionFor === message.id ? (
                      <motion.div className="nex-reaction-popover" initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}>
                        {reactionOptions.map((emoji) => <button key={emoji} type="button" onClick={() => onReact(message, emoji)}>{emoji}</button>)}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </motion.article>
            );
          })}
          <AnimatePresence>
            {typingUsers.length ? (
              <motion.div className="nex-typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
              </motion.div>
            ) : null}
          </AnimatePresence>
          {!messages.length ? <EmptyPanel title="No messages yet" body={`Start the conversation with ${conversation.title}.`} /> : null}
          {notice ? <p className="nex-notice">{notice}</p> : null}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form className="nex-composer" onSubmit={onSend}>
        <AnimatePresence>
          {recording ? (
            <motion.div className="nex-recording-bar" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
              <span className="nex-record-dot" />
              <strong>{formatDuration(recordingSeconds)}</strong>
              <button type="button" onClick={onCancelRecording}><X size={16} /></button>
              <button type="button" onClick={onStopRecording}><Square size={15} /></button>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <AnimatePresence>
          {voicePreview ? (
            <motion.div className="nex-voice-preview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
              <audio src={voicePreview.url} controls />
              <span>{formatDuration(voicePreview.duration)}</span>
              <button type="button" onClick={onCancelRecording}><X size={16} /></button>
              <button type="button" onClick={onSendVoice}><Send size={16} /></button>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <label title="Attach file"><Paperclip size={20} /><input type="file" onChange={(event) => setAttachmentFile(event.target.files?.[0] ?? null)} /></label>
        <label title="Add media"><ImagePlus size={20} /><input type="file" accept="image/*,video/*" onChange={(event) => setAttachmentFile(event.target.files?.[0] ?? null)} /></label>
        <textarea
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend(event);
            }
          }}
          rows={1}
          placeholder={`Message ${conversation.title}`}
        />
        <button type="button" title="Emoji" onClick={() => setEmojiOpen((value) => !value)}><Laugh size={20} /></button>
        <button type="button" title="Record voice message" onClick={recording ? onStopRecording : onStartRecording}><Mic size={19} /></button>
        <button className="send" type="submit" title="Send message"><Send size={19} /></button>
        <AnimatePresence>
          {emojiOpen ? (
            <motion.div className="nex-emoji-panel" initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.96 }}>
              <strong>Emoji</strong>
              <div>
                {emojiOptions.map((emoji) => <button key={emoji} type="button" onClick={() => onDraftChange(`${draft}${emoji}`)}>{emoji}</button>)}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        {attachmentFile ? (
          <div className="nex-attachment-chip">
            <span>{attachmentFile.name} · {formatBytes(attachmentFile.size)}</span>
            <button type="button" onClick={() => setAttachmentFile(null)}><X size={14} /></button>
          </div>
        ) : null}
        {uploadProgress ? <span className="nex-upload-progress" style={{ width: `${uploadProgress}%` }} /> : null}
      </form>
    </>
  );
}

function MessageTicks({ message }) {
  if (message.pending) return <span className="nex-ticks sent"><Check size={14} /></span>;
  if (message.read_at) return <span className="nex-ticks read"><CheckCheck size={15} /></span>;
  if (message.delivered_at) return <span className="nex-ticks delivered"><CheckCheck size={15} /></span>;
  return <span className="nex-ticks sent"><Check size={14} /></span>;
}

function VoiceMessage({ message, playing, audioRefs, onToggle, onEnded }) {
  return (
    <div className="nex-voice-message">
      <button type="button" onClick={() => onToggle(message)}>
        {playing ? <Pause size={17} /> : <Play size={17} />}
      </button>
      <div className={playing ? "nex-wave playing" : "nex-wave"}>
        {Array.from({ length: 18 }).map((_, index) => <span key={index} style={{ "--i": index }} />)}
      </div>
      <strong>{formatDuration(message.voice_duration ?? 0)}</strong>
      <audio
        ref={(node) => {
          if (node) audioRefs.current[message.id] = node;
        }}
        src={message.signedVoiceUrl}
        onEnded={onEnded}
      />
    </div>
  );
}

function AttachmentPreview({ attachment }) {
  const mime = attachment.mime_type ?? "";
  if (mime.startsWith("image/")) {
    return <a className="nex-media-preview" href={attachment.signedUrl} target="_blank" rel="noreferrer"><img src={attachment.signedUrl} alt={attachment.file_name} /></a>;
  }
  if (mime.startsWith("video/")) {
    return <video className="nex-video-preview" src={attachment.signedUrl} controls />;
  }
  return (
    <a className="nex-file-preview" href={attachment.signedUrl} target="_blank" rel="noreferrer">
      <FileText size={19} />
      <span><strong>{attachment.file_name}</strong><small>{formatBytes(attachment.size_bytes)}</small></span>
      <Download size={17} />
    </a>
  );
}

function EmptyChat() {
  return <EmptyPanel title="Select a conversation to start chatting" body="Your chat window opens only after you choose an accepted friend or group, just like a focused messenger should." large />;
}

function EmptyPanel({ title, body, large }) {
  return (
    <div className={large ? "nex-empty-state large" : "nex-empty-state"}>
      <div className="nex-empty-orbit"><Image src="/nexcord_logo.png" alt="" width={120} height={120} priority /></div>
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}
