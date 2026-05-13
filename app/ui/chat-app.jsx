"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AtSign,
  Bell,
  Check,
  Compass,
  Crown,
  Hash,
  ImagePlus,
  Laugh,
  LogOut,
  Menu,
  MessageCircle,
  Paperclip,
  Plus,
  Search,
  Send,
  Settings,
  Shield,
  Star,
  Trash2,
  Upload,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const filters = ["All", "Unread", "Favorites", "Groups"];

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

function Avatar({ profile, size = "md", className = "" }) {
  const sizeClass = size === "lg" ? "nex-avatar-lg" : "nex-avatar";
  const url = avatarUrl(profile);

  return (
    <span className={`${sizeClass} ${profile?.status === "busy" ? "busy" : "online"} ${className}`}>
      {url ? <img src={url} alt="" /> : initials(displayName(profile))}
    </span>
  );
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
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [settingsForm, setSettingsForm] = useState({ username: "", fullName: "", bio: "" });
  const [securityUnlocked, setSecurityUnlocked] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const currentUserId = session?.user?.id;

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
    if (conversationIds.length) {
      const [membersResult, latestResult] = await Promise.all([
        supabase.from("conversation_members").select("conversation_id, user_id, users(id, full_name, username, email, display_name, avatar_url, status)").in("conversation_id", conversationIds),
        supabase.from("messages").select("id, conversation_id, body, created_at, sender_id").in("conversation_id", conversationIds).order("created_at", { ascending: false }).limit(200),
      ]);
      if (membersResult.error) setNotice(membersResult.error.message);
      if (latestResult.error) setNotice(latestResult.error.message);
      memberRows = membersResult.data ?? [];
      latestRows = latestResult.data ?? [];
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
          title: conversation?.type === "group" ? conversation?.name : displayName(other),
          subtitle: conversation?.type === "group" ? `${members.length} members` : userHandle(other),
        };
      })
      .filter((conversation) => conversation.id);

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
        .select("id, body, created_at, sender_id, conversation_id, sender:users!messages_sender_id_fkey(id, full_name, username, display_name, email, avatar_url, status)")
        .eq("conversation_id", activeConversationId)
        .order("created_at", { ascending: true })
        .limit(150);

      if (error) {
        setNotice(error.message);
        return;
      }
      setMessages(data ?? []);
    }

    loadMessages();

    const channel = supabase
      .channel(`conversation:${activeConversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConversationId}` }, loadMessages)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, supabase]);

  const friendIds = useMemo(() => friendships.map((friendship) => (friendship.user_low_id === currentUserId ? friendship.user_high_id : friendship.user_low_id)), [friendships, currentUserId]);
  const pendingByUser = useMemo(() => {
    const map = new Map();
    requests.filter((request) => request.status === "pending").forEach((request) => {
      map.set(request.requester_id === currentUserId ? request.receiver_id : request.requester_id, request);
    });
    return map;
  }, [requests, currentUserId]);

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
    if (activeFilter === "Favorites") return favorites.some((favorite) => favorite.conversation_id === conversation.id || favorite.target_user_id === conversation.other?.id);
    if (activeFilter === "Unread") return false;
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

  async function toggleFavorite(conversation) {
    const existing = favorites.find((favorite) => favorite.conversation_id === conversation.id || favorite.target_user_id === conversation.other?.id);
    if (existing) {
      const query = supabase.from("favorites").delete().eq("user_id", currentUserId);
      if (existing.conversation_id) query.eq("conversation_id", existing.conversation_id);
      if (existing.target_user_id) query.eq("target_user_id", existing.target_user_id);
      const { error } = await query;
      if (error) setNotice(error.message);
    } else {
      const { error } = await supabase.from("favorites").insert({
        user_id: currentUserId,
        conversation_id: conversation.id,
        target_user_id: conversation.type === "direct" ? conversation.other?.id : null,
      });
      if (error) setNotice(error.message);
    }
    loadData();
  }

  async function sendMessage(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !activeConversationId) return;

    setDraft("");
    const { error } = await supabase.from("messages").insert({
      conversation_id: activeConversationId,
      sender_id: currentUserId,
      body,
    });
    if (error) {
      setNotice(error.message);
      setDraft(body);
    }
  }

  async function createGroup(event) {
    event.preventDefault();
    if (!groupName.trim()) return;
    const selectedFriendIds = groupMembers.filter((id) => friendIds.includes(id));
    if (!selectedFriendIds.length) {
      setNotice("Choose at least one accepted friend.");
      return;
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({ type: "group", name: groupName.trim(), created_by: currentUserId })
      .select("id")
      .single();

    if (conversationError) {
      setNotice(conversationError.message);
      return;
    }

    const memberRows = [currentUserId, ...selectedFriendIds].map((userId) => ({
      conversation_id: conversation.id,
      user_id: userId,
      role: userId === currentUserId ? "owner" : "member",
    }));

    await supabase.from("conversation_members").insert(memberRows);
    await supabase.from("groups").insert({ id: conversation.id, name: groupName.trim(), created_by: currentUserId });
    await supabase.from("group_members").insert(memberRows.map((row) => ({ group_id: conversation.id, user_id: row.user_id, role: row.role })));
    await supabase.from("notifications").insert(selectedFriendIds.map((userId) => ({
      user_id: userId,
      actor_id: currentUserId,
      type: "added_to_group",
      title: "Added to group",
      body: `${displayName(profile)} added you to ${groupName.trim()}.`,
      entity_type: "conversation",
      entity_id: conversation.id,
    })));

    setGroupName("");
    setGroupMembers([]);
    setGroupOpen(false);
    setActiveConversationId(conversation.id);
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
    if (error) setNotice(error.message);
    else {
      setNotice("Profile updated.");
      window.alert("Profile updated successfully.");
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

  const friendProfiles = users.filter((user) => friendIds.includes(user.id));

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
              <span>Chats</span>
              <button className="nex-mini-icon" type="button" title="Create group" onClick={() => setGroupOpen(true)}>
                <Plus size={15} />
              </button>
            </div>
            {filteredConversations.map((conversation) => {
              const favorite = favorites.some((item) => item.conversation_id === conversation.id || item.target_user_id === conversation.other?.id);
              return (
                <button key={conversation.id} className="nex-list-item" data-active={conversation.id === activeConversationId} type="button" onClick={() => setActiveConversationId(conversation.id)}>
                  {conversation.type === "group" ? <span className="nex-server-icon bg-gradient-to-br from-purple-500 to-cyan-400">{initials(conversation.title)}</span> : <Avatar profile={conversation.other} />}
                  <span className="min-w-0">
                    <strong>{conversation.title}</strong>
                    <small>{conversation.latest?.body ?? conversation.subtitle}</small>
                  </span>
                  <span className={`nex-star ${favorite ? "active" : ""}`} onClick={(event) => { event.stopPropagation(); toggleFavorite(conversation); }}>
                    <Star size={16} fill={favorite ? "currentColor" : "none"} />
                  </span>
                </button>
              );
            })}
            {!filteredConversations.length ? <p className="nex-empty-copy">Accepted friends and groups will appear here.</p> : null}
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
              <ChatConversation key={activeConversation.id} conversation={activeConversation} messages={messages} draft={draft} setDraft={setDraft} onSend={sendMessage} notice={notice} />
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
              <label className="nex-settings-field">
                <span>Group name</span>
                <input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Project Alpha" />
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

function ChatConversation({ conversation, messages, draft, setDraft, onSend, notice }) {
  return (
    <>
      <div className="nex-message-area">
        <div className="nex-watermark"><Image src="/nexcord_logo.png" alt="" width={340} height={340} priority /><span>NEXCORD</span></div>
        <div className="nex-date-chip">Live Conversation</div>
        <div className="nex-messages">
          {messages.map((message, index) => (
            <motion.article className="nex-message" key={message.id} initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: Math.min(index * 0.025, 0.18) }}>
              <Avatar profile={message.sender} />
              <div>
                <div className="nex-message-meta"><strong className="text-purple-200">{displayName(message.sender)}</strong><span>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>
                <p>{message.body}</p>
              </div>
            </motion.article>
          ))}
          {!messages.length ? <EmptyPanel title="No messages yet" body={`Start the conversation with ${conversation.title}.`} /> : null}
          {notice ? <p className="nex-notice">{notice}</p> : null}
        </div>
      </div>
      <form className="nex-composer" onSubmit={onSend}>
        <button type="button" title="Attach file"><Paperclip size={20} /></button>
        <button type="button" title="Add image"><ImagePlus size={20} /></button>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Message ${conversation.title}`} />
        <button type="button" title="Emoji"><Laugh size={20} /></button>
        <button className="send" type="submit" title="Send message"><Send size={19} /></button>
      </form>
    </>
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
