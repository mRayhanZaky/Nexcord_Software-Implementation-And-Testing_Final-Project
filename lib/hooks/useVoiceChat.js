import { useCallback, useEffect, useRef, useState } from "react";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useVoiceChat({ supabase, roomId, currentUserId, participants }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { userId: MediaStream }
  const [isMuted, setIsMuted] = useState(false);
  const peerConnections = useRef({}); // { userId: RTCPeerConnection }

  // Kirim pesan signaling via Supabase
  const sendSignal = useCallback(async (toUserId, type, payload) => {
    await supabase.from("signaling_messages").insert({
      room_id: roomId,
      from_user_id: currentUserId,
      to_user_id: toUserId,
      type,
      payload,
    });
  }, [supabase, roomId, currentUserId]);

  // Buat peer connection ke satu user
  const createPeerConnection = useCallback((targetUserId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) sendSignal(targetUserId, "ice-candidate", { candidate });
    };

    pc.ontrack = (event) => {
      setRemoteStreams((prev) => ({ ...prev, [targetUserId]: event.streams[0] }));
    };

    peerConnections.current[targetUserId] = pc;
    return pc;
  }, [sendSignal]);

  // Mulai voice chat: minta mic, buat offer ke semua peserta lain
  const joinRoom = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setLocalStream(stream);

    // Update status di DB
    await supabase.from("voice_participants").upsert({
      room_id: roomId,
      user_id: currentUserId,
      left_at: null,
    }, { onConflict: "room_id,user_id" });

    // Buat offer ke setiap peserta yang sudah ada
    for (const participant of participants) {
      if (participant.user_id === currentUserId) continue;
      const pc = createPeerConnection(participant.user_id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal(participant.user_id, "offer", offer);
    }
  }, [supabase, roomId, currentUserId, participants, createPeerConnection, sendSignal]);

  // Tangani sinyal masuk
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
          // Tambahkan local track jika belum ada
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
  }, [roomId, currentUserId, localStream, supabase, createPeerConnection, sendSignal]);

  const toggleMute = useCallback(async () => {
    if (!localStream) return;
    const newMuted = !isMuted;
    localStream.getAudioTracks().forEach((t) => { t.enabled = !newMuted; });
    setIsMuted(newMuted);
    await supabase.from("voice_participants").update({ is_muted: newMuted })
      .eq("room_id", roomId).eq("user_id", currentUserId);
  }, [localStream, isMuted, supabase, roomId, currentUserId]);

  const leaveRoom = useCallback(async () => {
    localStream?.getTracks().forEach((t) => t.stop());
    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};
    setLocalStream(null);
    setRemoteStreams({});
    await supabase.from("voice_participants").update({ left_at: new Date().toISOString() })
      .eq("room_id", roomId).eq("user_id", currentUserId);
  }, [localStream, supabase, roomId, currentUserId]);

  return { localStream, remoteStreams, isMuted, joinRoom, toggleMute, leaveRoom };
}