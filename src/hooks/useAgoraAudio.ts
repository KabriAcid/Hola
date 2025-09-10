import { useEffect, useRef, useState } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  ILocalAudioTrack,
  IRemoteAudioTrack,
  UID,
} from "agora-rtc-sdk-ng";

interface UseAgoraAudioOptions {
  appId: string;
  channel: string;
  token?: string | null;
  uid?: string | number;
}

export function useAgoraAudio({
  appId,
  channel,
  token = null,
  uid,
}: UseAgoraAudioOptions) {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const [joined, setJoined] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<UID[]>([]);
  const localAudioTrackRef = useRef<ILocalAudioTrack | null>(null);

  useEffect(() => {
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    clientRef.current = client;

    const handleUserPublished = async (
      user: any,
      mediaType: "audio" | "video"
    ) => {
      if (mediaType === "audio") {
        console.log("[DEBUG][Agora] Remote user published:", user.uid);
        await client.subscribe(user, mediaType);
        const remoteAudioTrack = user.audioTrack as IRemoteAudioTrack;
        if (remoteAudioTrack) {
          remoteAudioTrack.play();
          console.log("[DEBUG][Agora] Playing remote audio for UID:", user.uid);
        }
        setRemoteUsers((prev) => Array.from(new Set([...prev, user.uid])));
      }
    };
    const handleUserUnpublished = (user: any) => {
      console.log("[DEBUG][Agora] Remote user unpublished:", user.uid);
      setRemoteUsers((prev) => prev.filter((id) => id !== user.uid));
    };
    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);
    return () => {
      client.removeAllListeners();
    };
  }, [appId]);

  const join = async () => {
    if (!clientRef.current) return;
    console.log("[DEBUG][Agora] Joining channel:", channel, "with UID:", uid);
    await clientRef.current.join(appId, channel, token || null, uid || null);
    const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    localAudioTrackRef.current = localAudioTrack;
    await clientRef.current.publish([localAudioTrack]);
    console.log("[DEBUG][Agora] Published local audio track");
    setJoined(true);
  };

  const leave = async () => {
    if (!clientRef.current) return;
    console.log("[DEBUG][Agora] Leaving channel:", channel);
    localAudioTrackRef.current?.close();
    await clientRef.current.leave();
    setJoined(false);
    setRemoteUsers([]);
  };

  return {
    join,
    leave,
    joined,
    remoteUsers,
  };
}
