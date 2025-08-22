import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ILocalAudioTrack,
  IRemoteAudioTrack,
  IRemoteUser,
} from 'agora-rtc-sdk-ng';

const defaultAppId = (import.meta as any).env?.VITE_AGORA_APP_ID || ''; // set in .env.local
const defaultChannel = 'hola-test';

export default function AgoraVoiceCall() {
  // UI state
  const [appId, setAppId] = useState<string>(defaultAppId);
  const [channel, setChannel] = useState<string>(defaultChannel);
  const [token, setToken] = useState<string>(''); // leave empty for no-token testing (if your project allows)
  const [joined, setJoined] = useState(false);
  const [localUid, setLocalUid] = useState<string | number | null>(null);
  const [remoteUids, setRemoteUids] = useState<string[]>([]); // purely for display

  // Agora refs (don’t trigger rerenders)
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioRef = useRef<ILocalAudioTrack | null>(null);
  const remoteAudioMapRef = useRef<Map<string, IRemoteAudioTrack>>(new Map());

  // Helper to update the list of remote UIDs for display
  const refreshRemoteUidList = () => {
    setRemoteUids(Array.from(remoteAudioMapRef.current.keys()));
  };

  // Subscribe to a published remote user (audio)
  const handleUserPublished = async (user: IRemoteUser, mediaType: 'audio' | 'video') => {
    const client = clientRef.current!;
    await client.subscribe(user, mediaType);
    if (mediaType === 'audio' && user.audioTrack) {
      // Play remote audio immediately (hidden <audio> element)
      user.audioTrack.play();
      remoteAudioMapRef.current.set(String(user.uid), user.audioTrack);
      refreshRemoteUidList();
    }
  };

  // Clean up when a user unpublishes (or leaves)
  const handleUserUnpublished = (user: IRemoteUser, mediaType: 'audio' | 'video') => {
    if (mediaType === 'audio') {
      const track = remoteAudioMapRef.current.get(String(user.uid));
      if (track) {
        track.stop();
        remoteAudioMapRef.current.delete(String(user.uid));
        refreshRemoteUidList();
      }
    }
  };

  // Join: create client, wire events, join channel, create mic track, publish
  const join = async () => {
    if (!appId) {
      alert('Please set your Agora App ID.');
      return;
    }
    if (!channel) {
      alert('Please enter a channel name.');
      return;
    }

    // Create client (rtc mode, audio-only is fine)
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    // Wire event handlers for remote users
    client.on('user-published', handleUserPublished);
    client.on('user-unpublished', handleUserUnpublished);

    // Join channel (uid = null => Agora assigns one)
    const uid = await client.join(appId, channel, token || null, null);
    setLocalUid(uid);

    // Create and publish local microphone audio
    const track = await AgoraRTC.createMicrophoneAudioTrack();
    localAudioRef.current = track;
    await client.publish([track]);

    setJoined(true);
  };

  // Leave: unpublish, stop/close local, stop all remote, leave, remove listeners
  const leave = async () => {
    const client = clientRef.current;
    if (!client) return;

    // Unpublish local audio
    if (localAudioRef.current) {
      await client.unpublish([localAudioRef.current]);
      localAudioRef.current.stop();
      localAudioRef.current.close();
      localAudioRef.current = null;
    }

    // Stop any remote audio tracks
    remoteAudioMapRef.current.forEach((t) => t.stop());
    remoteAudioMapRef.current.clear();
    refreshRemoteUidList();

    await client.leave();
    client.removeAllListeners();
    clientRef.current = null;

    setJoined(false);
    setLocalUid(null);
  };

  // Cleanup if component unmounts
  useEffect(() => {
    return () => {
      // best-effort cleanup
      leave().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Agora Voice Call (Basic)</h1>

      {/* Basic connection controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          className="border rounded px-3 py-2"
          placeholder="Agora App ID"
          value={appId}
          onChange={(e) => setAppId(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Channel (e.g., hola-test)"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Token (optional)"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={join}
          disabled={joined}
          className={`px-4 py-2 rounded text-white ${joined ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
        >
          Join Call
        </button>
        <button
          onClick={leave}
          disabled={!joined}
          className={`px-4 py-2 rounded text-white ${!joined ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
        >
          Leave Call
        </button>
      </div>

      {/* Simple status */}
      <div className="text-sm text-gray-700">
        <p>Status: {joined ? 'Joined' : 'Idle'}</p>
        <p>Your UID: {localUid ?? '-'}</p>
        <p>Remote users in channel: {remoteUids.length ? remoteUids.join(', ') : 'None yet'}</p>
      </div>

      <p className="text-xs text-gray-500">
        Notes: Use two browser tabs/devices with the same channel to test. Ensure microphone permission is granted.
      </p>
    </div>
  );
}