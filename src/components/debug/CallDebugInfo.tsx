import React, { useEffect, useState } from "react";
import { checkPermissions } from "../../utils/permissions";
import { socketService } from "../../socket";

interface CallDebugInfoProps {
  show: boolean;
  onClose: () => void;
}

export const CallDebugInfo: React.FC<CallDebugInfoProps> = ({
  show,
  onClose,
}) => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      setLoading(true);
      checkPermissions().then((info) => {
        const socketConnected = socketService.isConnected();
        const socketUrl =
          import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

        // Add socket-related issues
        const allIssues = [...info.issues];
        if (!socketConnected) {
          allIssues.push(
            `Socket not connected. Trying to connect to: ${socketUrl}`
          );
        }

        setDebugInfo({
          ...info,
          issues: allIssues,
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          url: window.location.href,
          protocol: window.location.protocol,
          host: window.location.host,
          socketConnected,
          socketUrl,
        });
        setLoading(false);
      });
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Call Debug Info</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {loading ? (
            <div>Loading debug info...</div>
          ) : debugInfo ? (
            <>
              <div>
                <h4 className="font-semibold text-green-600">✅ Working:</h4>
                <ul className="text-sm space-y-1 ml-4">
                  {debugInfo.webrtc && <li>• WebRTC supported</li>}
                  {debugInfo.secure && <li>• Secure context (HTTPS)</li>}
                  {debugInfo.microphone === "granted" && (
                    <li>• Microphone access granted</li>
                  )}
                  {debugInfo.socketConnected && <li>• Socket connected</li>}
                </ul>
              </div>

              {debugInfo.issues.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-600">❌ Issues:</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    {debugInfo.issues.map((issue: string, i: number) => (
                      <li key={i} className="text-red-600">
                        • {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="font-semibold">📱 Device Info:</h4>
                <div className="text-xs space-y-1 bg-gray-100 p-2 rounded">
                  <div>
                    <strong>URL:</strong> {debugInfo.url}
                  </div>
                  <div>
                    <strong>Protocol:</strong> {debugInfo.protocol}
                  </div>
                  <div>
                    <strong>Platform:</strong> {debugInfo.platform}
                  </div>
                  <div>
                    <strong>Socket URL:</strong> {debugInfo.socketUrl}
                  </div>
                  <div>
                    <strong>Socket Status:</strong>{" "}
                    {debugInfo.socketConnected
                      ? "✅ Connected"
                      : "❌ Disconnected"}
                  </div>
                  <div>
                    <strong>User Agent:</strong> {debugInfo.userAgent}
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <h4 className="font-semibold">💡 Solutions:</h4>
                <ul className="space-y-1 ml-4">
                  <li>• Make sure you're using HTTPS (ngrok with --https)</li>
                  <li>• Allow microphone permission when prompted</li>
                  <li>• Try refreshing the page</li>
                  <li>• Check if ngrok tunnel is active</li>
                </ul>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
