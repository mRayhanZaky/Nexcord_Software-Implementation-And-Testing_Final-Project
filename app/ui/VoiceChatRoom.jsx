"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function VoiceChatRoom({ supabase, conversation, currentUserId, profile }) {
  const [roomId, setRoomId] = useState(null);
  const [inRoom, setInRoom] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});

  const peerConnections = useRef({});
  const audioRefs = useRef({});

  // Hubungkan audio stream ke elemen <audio> setiap kali remoteStreams berubah
  useEffect(() => {
    Object.entries(remoteStreams).forEach(([userId, stream]) => {
      const audio = audioRefs.current[userId];
      if (audio && audio.srcObject !== stream) {
        audio.srcObject = stream;
        audio.play().catch(() => {});
      }
    });
  }, [remoteStreams]);

  // Dengarkan sinyal masuk dari user lain
  useEffect(() => {
    if (!roomId || !currentUserId) return;

    const channel = supabase
      .channel(`signaling:${roomId}:${currentUserId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "signaling_messages",
        filter: `to_user_id=eq.${currentUserId}`,
      }, async ({ new: msg }) => {
        const { from_user_id: fromId, type, payload } = msg;

        if (type === "offer") {
          const pc = createPeerConnection(fromId);
          if (localStream) {
            localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
          }
          await pc.setRemoteDescription(new RTCSessionDescription(payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignal(fromId, "answer", answer);
        }

        if (type === "answer") {
          const pc = peerConnections.current[fromId];
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(payload));
        }

        if (type === "ice-candidate") {
          const pc = peerConnections.current[fromId];
          if (pc && payload.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          }
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [roomId, currentUserId, localStream]);

  function createPeerConnection(targetUserId) {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) sendSignal(targetUserId, "ice-candidate", { candidate });
    };

    pc.ontrack = (event) => {
      setRemoteStreams((prev) => ({ ...prev, [targetUserId]: event.streams[0] }));
    };

    peerConnections.current[targetUserId] = pc;
    return pc;
  }

  async function sendSignal(toUserId, type, payload) {
    await supabase.from("signaling_messages").insert({
      room_id: roomId,
      from_user_id: currentUserId,
      to_user_id: toUserId,
      type,
      payload,
    });
  }

  async function startVoice() {
    // Cari room aktif atau buat baru
    let { data: room } = await supabase
      .from("voice_rooms")
      .select("id")
      .eq("conversation_id", conversation.id)
      .is("ended_at", null)
      .maybeSingle();

    if (!room) {
      const { data } = await supabase
        .from("voice_rooms")
        .insert({ conversation_id: conversation.id, created_by: currentUserId })
        .select("id")
        .single();
      room = data;
    }

    setRoomId(room.id);

    // Ambil peserta aktif yang sudah ada di room
    const { data: active } = await supabase
      .from("voice_participants")
      .select("user_id")
      .eq("room_id", room.id)
      .is("left_at", null);

    const activeParticipants = active ?? [];
    setParticipants(activeParticipants);

    // Minta izin mikrofon
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      alert("Izin mikrofon ditolak. Aktifkan mikrofon di browser kamu.");
      return;
    }

    setLocalStream(stream);
    setInRoom(true);

    // Daftarkan diri ke room
    await supabase.from("voice_participants").upsert({
      room_id: room.id,
      user_id: currentUserId,
      left_at: null,
    }, { onConflict: "room_id,user_id" });

    // Kirim offer ke setiap peserta yang sudah ada
    for (const participant of activeParticipants) {
      if (participant.user_id === currentUserId) continue;
      const pc = createPeerConnection(participant.user_id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await supabase.from("signaling_messages").insert({
        room_id: room.id,
        from_user_id: currentUserId,
        to_user_id: participant.user_id,
        type: "offer",
        payload: offer,
      });
    }
  }

  async function leaveRoom() {
    localStream?.getTracks().forEach((t) => t.stop());
    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};

    if (roomId) {
      await supabase
        .from("voice_participants")
        .update({ left_at: new Date().toISOString() })
        .eq("room_id", roomId)
        .eq("user_id", currentUserId);
    }

    setLocalStream(null);
    setRemoteStreams({});
    setInRoom(false);
    setRoomId(null);
    setParticipants([]);
  }

  function toggleMute() {
    if (!localStream) return;
    const newMuted = !isMuted;
    localStream.getAudioTracks().forEach((t) => { t.enabled = !newMuted; });
    setIsMuted(newMuted);
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 16px",
      borderBottom: "1px solid var(--nex-line)",
      background: inRoom ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.02)",
      minHeight: 48,
    }}>
      {/* Elemen audio tersembunyi untuk setiap remote stream */}
      {Object.keys(remoteStreams).map((userId) => (
        <audio
          key={userId}
          ref={(el) => { if (el) audioRefs.current[userId] = el; }}
          autoPlay
          playsInline
        />
      ))}

      {!inRoom ? (
        <button
          onClick={startVoice}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 999,
            background: "linear-gradient(90deg, #9333ea, #0ea5e9)",
            color: "#fff",
            border: 0,
            fontWeight: 900,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <Phone size={15} />
          Mulai Voice Chat
        </button>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#34d399", fontSize: 13, fontWeight: 900 }}>
            ● Voice aktif
          </span>
          <span style={{ color: "#94a3b8", fontSize: 12 }}>
            {Object.keys(remoteStreams).length + 1} peserta
          </span>

          <button
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              border: 0,
              background: isMuted ? "rgba(244,63,94,0.2)" : "rgba(255,255,255,0.1)",
              color: isMuted ? "#fca5a5" : "#fff",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}
          >
            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          <button
            onClick={leaveRoom}
            title="Keluar dari voice chat"
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              border: 0,
              background: "rgba(244,63,94,0.2)",
              color: "#fca5a5",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}
          >
            <PhoneOff size={16} />
          </button>
        </div>
      )}
    </div>
  );
}