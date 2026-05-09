"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Hash, LogOut, Send, Sparkles, UserRound, UsersRound } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { BrandMark, NebulaShell } from "./motion-shell";

export default function ChatApp() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [session, setSession] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

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
      setActiveRoomId((current) => current ?? data?.[0]?.id ?? null);
    }

    loadRooms();
  }, [session, supabase]);

  useEffect(() => {
    if (!activeRoomId || !session) return;

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
  }, [activeRoomId, session, supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    setMessages([]);
    setRooms([]);
    setActiveRoomId(null);
  }

  async function sendMessage(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !activeRoomId || !session) return;

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
  }

  if (loading) {
    return (
      <NebulaShell>
        <main className="grid min-h-screen place-items-center text-slate-300">Opening NEXCORD...</main>
      </NebulaShell>
    );
  }

  const activeRoom = rooms.find((room) => room.id === activeRoomId);

  return (
    <NebulaShell>
      <main className="chat-shell">
        <aside className="chat-sidebar p-4">
          <div className="mb-6 flex items-center justify-between">
            <BrandMark />
            <span className="h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
          </div>
          <div className="mb-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="m-0 text-xs uppercase tracking-[0.2em] text-slate-500">Connected as</p>
            <p className="m-0 mt-2 truncate font-bold">{session?.user?.email}</p>
          </div>
          <nav className="space-y-2" aria-label="Rooms">
            {rooms.map((room) => (
              <button className="chat-room-button" key={room.id} type="button" aria-current={room.id === activeRoomId} onClick={() => setActiveRoomId(room.id)}>
                <Hash size={16} />
                {room.name}
              </button>
            ))}
            {!rooms.length ? <p className="px-2 text-sm text-slate-400">No rooms yet. Apply the Supabase migration to create Lobby.</p> : null}
          </nav>
        </aside>

        <section className="chat-panel grid min-h-screen min-w-0 grid-rows-[auto_minmax(0,1fr)_auto]">
          <header className="flex items-center justify-between border-b border-white/10 p-5">
            <div>
              <h1 className="m-0 text-2xl font-black">{activeRoom?.name ?? "No room selected"}</h1>
              <p className="m-0 mt-1 text-sm text-slate-400">Realtime channel powered by Supabase</p>
            </div>
            <button className="ghost-button min-h-10 px-4" type="button" onClick={signOut}>
              <LogOut size={16} /> Sign out
            </button>
          </header>

          <div className="min-h-0 space-y-3 overflow-auto p-5">
            {messages.map((message, index) => (
              <motion.article className="message-card" key={message.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.02, 0.25) }}>
                <div className="mb-2 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-violet-400 to-pink-400">
                    <UserRound size={18} />
                  </div>
                  <div>
                    <strong>{message.sender?.display_name ?? message.sender?.username ?? "Unknown"}</strong>
                    <p className="m-0 text-xs text-slate-500">{new Date(message.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <p className="m-0 leading-7 text-slate-200">{message.body}</p>
              </motion.article>
            ))}
            {notice ? <p className="form-error">{notice}</p> : null}
          </div>

          <form className="border-t border-white/10 p-5" onSubmit={sendMessage}>
            <div className="flex gap-3 rounded-3xl border border-white/10 bg-white/[0.05] p-2">
              <input
                className="min-h-12 min-w-0 flex-1 rounded-2xl border-0 bg-transparent px-4 text-white outline-none"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={activeRoom ? `Message #${activeRoom.name}` : "Join a room to chat"}
                disabled={!activeRoom}
              />
              <button className="neon-button min-h-12 px-5" type="submit" title="Send message" disabled={!activeRoom}>
                <Send size={18} />
              </button>
            </div>
          </form>
        </section>

        <aside className="chat-members p-4">
          <div className="glass-panel mb-4 p-4">
            <Sparkles className="mb-3 text-pink-200" />
            <h2 className="m-0 text-lg font-black">NEXCORD Pulse</h2>
            <p className="text-sm leading-6 text-slate-400">Presence, AI summaries, reactions, and media controls are ready for the next iteration.</p>
          </div>
          <div className="glass-panel p-4">
            <UsersRound className="mb-3 text-cyan-200" />
            <h2 className="m-0 text-lg font-black">Community</h2>
            <p className="text-sm text-slate-400">Room members appear here once membership queries are expanded.</p>
            <Link className="ghost-button mt-4 w-full" href="/">Landing</Link>
          </div>
        </aside>
      </main>
    </NebulaShell>
  );
}
