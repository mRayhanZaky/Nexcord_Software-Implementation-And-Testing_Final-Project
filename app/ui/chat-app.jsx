"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AtSign,
  Bell,
  Bot,
  ChevronDown,
  Compass,
  Crown,
  Hash,
  Headphones,
  ImagePlus,
  Laugh,
  LogOut,
  Menu,
  MessageCircle,
  Mic,
  Paperclip,
  Pin,
  Plus,
  Search,
  Send,
  Settings,
  Shield,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const filters = ["All", "Unread", "Favorites", "Groups"];

const navItems = [
  { label: "Home", icon: Compass },
  { label: "Chats", icon: MessageCircle },
  { label: "AI", icon: Bot },
  { label: "Explore", icon: Sparkles },
  { label: "Security", icon: Shield },
];

const fallbackGroups = [
  { id: "general", name: "general", slug: "general", badge: "NX", unread: 12, tone: "from-purple-500 to-cyan-400" },
  { id: "design-lab", name: "design-lab", slug: "design", badge: "DL", unread: 4, tone: "from-fuchsia-500 to-indigo-400" },
  { id: "event-horizon", name: "event-horizon", slug: "events", badge: "EH", unread: 0, tone: "from-sky-500 to-violet-500" },
  { id: "project-alpha", name: "project-alpha", slug: "alpha", badge: "PA", unread: 9, tone: "from-indigo-500 to-purple-400" },
];

const people = [
  { id: "maya", name: "Maya Chen", role: "Product lead", status: "online", color: "from-cyan-300 to-blue-500", unread: 3 },
  { id: "kael", name: "Kael Morgan", role: "UI systems", status: "busy", color: "from-purple-300 to-fuchsia-500", unread: 0 },
  { id: "rin", name: "Rin Aster", role: "Voice channel", status: "online", color: "from-emerald-300 to-cyan-500", unread: 7 },
  { id: "sol", name: "Sol Vega", role: "Backend guild", status: "busy", color: "from-pink-300 to-purple-600", unread: 0 },
  { id: "noor", name: "Noor Idris", role: "Community ops", status: "online", color: "from-sky-300 to-indigo-500", unread: 2 },
];

const demoMessages = [
  { id: "m1", author: "Maya Chen", handle: "maya", time: "09:42", body: "Welcome to #general. The new Nexcord command center is live and looking dangerous in the best way.", color: "text-cyan-200" },
  { id: "m2", author: "Kael Morgan", handle: "kael", time: "09:47", body: "I pinned the launch checklist. Filters, glass panels, and the mobile drawer are all ready for review.", color: "text-purple-200" },
  { id: "m3", author: "Rin Aster", handle: "rin", time: "10:03", body: "Voice rooms are quiet right now, but presence is active. I can see online status updates glowing already.", color: "text-emerald-200" },
  { id: "m4", author: "Noor Idris", handle: "noor", time: "10:18", body: "The community crew is asking for Favorites next. This layout gives us room to grow without feeling cramped.", color: "text-sky-200" },
];

function initials(value) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function ChatApp() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [session, setSession] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [activeUserId, setActiveUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (!data.session) router.replace("/login");
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) router.replace("/login");
    });

    return () => listener.subscription.unsubscribe();
  }, [router, supabase]);

  useEffect(() => {
    if (!session) return;

    async function loadRooms() {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, name, slug, room_members!inner(user_id)")
        .order("name");

      if (error) {
        setNotice(error.message);
        return;
      }

      setRooms(data ?? []);
      setActiveRoomId((current) => current ?? data?.[0]?.id ?? "general");
    }

    loadRooms();
  }, [session, supabase]);

  useEffect(() => {
    if (!activeRoomId || !session || activeUserId) return;

    const isRealRoom = rooms.some((room) => room.id === activeRoomId);
    if (!isRealRoom) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      const { data, error } = await supabase
        .from("messages")
        .select("id, body, created_at, sender:users(username, display_name, avatar_url)")
        .eq("room_id", activeRoomId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        setNotice(error.message);
        return;
      }

      setMessages(data ?? []);
    }

    loadMessages();

    const channel = supabase
      .channel(`room:${activeRoomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${activeRoomId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("messages")
            .select("id, body, created_at, sender:users(username, display_name, avatar_url)")
            .eq("id", payload.new.id)
            .single();

          if (data) setMessages((current) => [...current, data]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRoomId, activeUserId, rooms, session, supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    setMessages([]);
    setRooms([]);
    setActiveRoomId(null);
  }

  async function sendMessage(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;

    const isRealRoom = rooms.some((room) => room.id === activeRoomId);
    if (!activeUserId && activeRoomId && isRealRoom && session) {
      setDraft("");
      const { error } = await supabase.from("messages").insert({
        room_id: activeRoomId,
        sender_id: session.user.id,
        body,
      });

      if (error) {
        setNotice(error.message);
        setDraft(body);
      }
      return;
    }

    setDraft("");
  }

  const groups = rooms.length
    ? rooms.map((room, index) => ({
        ...room,
        badge: initials(room.name || room.slug || "NX"),
        unread: [12, 4, 0, 9][index % 4],
        tone: ["from-purple-500 to-cyan-400", "from-fuchsia-500 to-indigo-400", "from-sky-500 to-violet-500", "from-indigo-500 to-purple-400"][index % 4],
      }))
    : fallbackGroups;

  const activeGroup = groups.find((group) => group.id === activeRoomId) ?? groups[0];
  const activeUser = people.find((person) => person.id === activeUserId);
  const activeName = activeUser ? activeUser.name : `#${activeGroup?.name ?? "general"}`;
  const activeSubtitle = activeUser ? activeUser.role : "Nexcord Community";
  const visibleMessages = messages.length && !activeUser ? messages : demoMessages;

  const filteredGroups = groups.filter((group) => {
    if (activeFilter === "Unread") return group.unread > 0;
    if (activeFilter === "Favorites") return ["general", "design-lab"].includes(group.slug ?? group.id);
    return true;
  });

  const showUsers = activeFilter !== "Groups";

  function selectGroup(id) {
    setActiveRoomId(id);
    setActiveUserId("");
    setDrawerOpen(false);
  }

  function selectUser(id) {
    setActiveUserId(id);
    setDrawerOpen(false);
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
          <Sparkles size={17} />
        </div>
        <div>
          <strong>Nexcord Community</strong>
          <span>{session?.user?.email ?? "Secure session"}</span>
        </div>
        <ChevronDown size={17} />
      </div>

      <label className="nex-search">
        <Search size={18} />
        <input placeholder="Search chats and contacts..." />
      </label>

      <div className="nex-filters" aria-label="Chat filters">
        {filters.map((filter) => (
          <button key={filter} type="button" className={activeFilter === filter ? "active" : ""} onClick={() => setActiveFilter(filter)}>
            {activeFilter === filter ? <motion.span layoutId="filterGlow" className="nex-filter-glow" /> : null}
            <span>{filter}</span>
          </button>
        ))}
      </div>

      <div className="nex-list-scroll">
        <AnimatePresence mode="popLayout">
          <motion.section
            key={`groups-${activeFilter}`}
            className="nex-list-section"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            <div className="nex-section-title">
              <span>Groups</span>
              <Plus size={15} />
            </div>
            {filteredGroups.map((group) => (
              <button key={group.id} className="nex-list-item" data-active={!activeUserId && group.id === activeRoomId} type="button" onClick={() => selectGroup(group.id)}>
                <span className={`nex-server-icon bg-gradient-to-br ${group.tone}`}>{group.badge}</span>
                <span className="min-w-0">
                  <strong>{group.name}</strong>
                  <small>{group.unread ? `${group.unread} unread transmissions` : "Synced and quiet"}</small>
                </span>
                {group.unread ? <em>{group.unread}</em> : null}
              </button>
            ))}
          </motion.section>
        </AnimatePresence>

        {showUsers ? (
          <motion.section className="nex-list-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.24 }}>
            <div className="nex-section-title">
              <span>Users</span>
              <UsersRound size={15} />
            </div>
            {people.map((person) => (
              <button key={person.id} className="nex-list-item" data-active={person.id === activeUserId} type="button" onClick={() => selectUser(person.id)}>
                <span className={`nex-avatar ${person.status} bg-gradient-to-br ${person.color}`}>{initials(person.name)}</span>
                <span className="min-w-0">
                  <strong>{person.name}</strong>
                  <small>{person.role}</small>
                </span>
                {person.unread ? <em>{person.unread}</em> : null}
              </button>
            ))}
          </motion.section>
        ) : null}
      </div>

      <div className="nex-profile-strip">
        <span className="nex-avatar online bg-gradient-to-br from-cyan-300 to-purple-500">{initials(session?.user?.email ?? "NX")}</span>
        <div>
          <strong>Glow Chat</strong>
          <small>Online</small>
        </div>
        <button type="button" title="Mute microphone">
          <Mic size={16} />
        </button>
        <button type="button" title="Audio settings">
          <Headphones size={16} />
        </button>
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
          {navItems.map(({ label, icon: Icon }, index) => (
            <button key={label} className={index === 1 ? "active" : ""} type="button" title={label}>
              <Icon size={22} />
            </button>
          ))}
        </nav>
        <button className="nex-nav-add" type="button" title="Create space">
          <Plus size={22} />
        </button>
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
            {activeUser ? <AtSign size={23} /> : <Hash size={25} />}
            <div>
              <h1>{activeName}</h1>
              <p>{activeSubtitle}</p>
            </div>
          </div>
          <div className="nex-header-actions">
            <button type="button" title="Notifications">
              <Bell size={19} />
            </button>
            <button type="button" title="Pinned messages">
              <Pin size={19} />
            </button>
            <button type="button" title="Members">
              <UsersRound size={19} />
            </button>
            <label>
              <Search size={17} />
              <input placeholder="Search" />
            </label>
            <button type="button" title="Settings">
              <Settings size={19} />
            </button>
          </div>
        </header>

        <div className="nex-message-area">
          <div className="nex-watermark">
            <Image src="/nexcord_logo.png" alt="" width={340} height={340} priority />
            <span>NEXCORD</span>
          </div>

          <div className="nex-date-chip">Today</div>
          <div className="nex-messages">
            {visibleMessages.map((message, index) => {
              const name = message.sender?.display_name ?? message.sender?.username ?? message.author;
              const body = message.body;
              const time = message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : message.time;

              return (
                <motion.article
                  className="nex-message"
                  key={message.id}
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: Math.min(index * 0.035, 0.22) }}
                >
                  <span className={`nex-avatar ${index % 2 ? "busy" : "online"} bg-gradient-to-br ${people[index % people.length].color}`}>
                    {initials(name ?? "NX")}
                  </span>
                  <div>
                    <div className="nex-message-meta">
                      <strong className={message.color ?? "text-purple-200"}>{name}</strong>
                      <span>{time}</span>
                    </div>
                    <p>{body}</p>
                  </div>
                </motion.article>
              );
            })}
            {notice ? <p className="nex-notice">{notice}</p> : null}
          </div>
        </div>

        <form className="nex-composer" onSubmit={sendMessage}>
          <button type="button" title="Attach file">
            <Paperclip size={20} />
          </button>
          <button type="button" title="Add image">
            <ImagePlus size={20} />
          </button>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Message ${activeName}`} />
          <button type="button" title="Emoji">
            <Laugh size={20} />
          </button>
          <button className="send" type="submit" title="Send message">
            <Send size={19} />
          </button>
        </form>
      </section>

      <aside className="nex-info-rail">
        <div className="nex-info-card">
          <Crown size={22} />
          <strong>Server Boost</strong>
          <span>Level 4 signal strength</span>
        </div>
        <div className="nex-info-card">
          <UsersRound size={22} />
          <strong>128 Online</strong>
          <span>42 active in voice</span>
        </div>
      </aside>
    </main>
  );
}
