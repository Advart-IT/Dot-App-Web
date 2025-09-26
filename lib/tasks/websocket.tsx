import type { Message } from "@/components/tasks/chat-activityswitch/chat/types";

export function initializeWebSocket(
  taskId: number,
  userId: number,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  socketRef: React.RefObject<WebSocket | null>
): () => void {
  if (!taskId || !userId) {
    console.warn("❌ Missing taskId or userId");
    return () => {};
  }

  const socketUrl = `wss://tasks.advartit.in/api/v1/chat/chat?task_id=${taskId}&user_id=${userId}`;
  console.log("🌐 Attempting WebSocket connection:", socketUrl);

  const socket = new WebSocket(socketUrl);
  socketRef.current = socket;

  socket.onopen = () => {
    console.log("✅ WebSocket connected:", socketUrl);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      const message: Message = {
        message_id: data.message_id.toString(),
        message: data.message,
        sender_id: data.sender_id,
        sender_name: data.sender_name || "Unknown",
        timestamp: new Date(data.timestamp).toISOString(),
      };

      console.log("📩 New message received:", message);

      setMessages((prev) => {
        // Avoid duplicates by ID
        if (prev.some((m) => m.message_id === message.message_id)) return prev;
        return [...prev, message];
      });
    } catch (err) {
      console.error("❌ Error parsing WebSocket message:", err);
    }
  };

  // socket.onerror = (event) => {
  //   console.error("❌ WebSocket encountered an error:", event);
  // };

  socket.onclose = (event) => {
    console.warn("⚠️ WebSocket closed:", event.reason || "No reason");
  };

  // Cleanup function to close the socket
  return () => {
    console.log("🧹 Closing WebSocket");
    socket.close();
  };
}
