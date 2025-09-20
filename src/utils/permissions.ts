// src/utils/permissions.ts
// Utility functions for checking browser permissions on mobile

export const checkWebRTCSupport = (): boolean => {
  try {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  } catch (e) {
    return false;
  }
};

export const checkSecureContext = (): boolean => {
  return window.isSecureContext;
};

export const checkPermissions = async (): Promise<{
  webrtc: boolean;
  microphone: "granted" | "denied" | "prompt" | "unsupported";
  secure: boolean;
  issues: string[];
}> => {
  const issues: string[] = [];

  // Check WebRTC support
  const webrtc = checkWebRTCSupport();
  if (!webrtc) {
    issues.push("WebRTC is not supported in this browser");
  }

  // Check secure context (HTTPS)
  const secure = checkSecureContext();
  if (!secure) {
    issues.push("HTTPS is required for voice calls on mobile devices");
  }

  // Check microphone permission
  let microphone: "granted" | "denied" | "prompt" | "unsupported" =
    "unsupported";

  try {
    if (navigator.permissions) {
      const permission = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      microphone = permission.state;
    } else {
      microphone = "prompt"; // Assume prompt if permissions API not available
    }
  } catch (e) {
    microphone = "prompt";
  }

  if (microphone === "denied") {
    issues.push(
      "Microphone permission is denied. Please enable it in browser settings."
    );
  }

  return {
    webrtc,
    microphone,
    secure,
    issues,
  };
};

export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately, we just needed to check permission
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (e) {
    console.error("Microphone permission denied:", e);
    return false;
  }
};
