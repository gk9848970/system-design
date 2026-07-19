import { useEffect, useRef, useState } from "react";

type ChatMessage = { id: string; text: string; at: number };

export function BroadcastChannelDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    channelRef.current = new BroadcastChannel("chat");

    const onMessageReceive = (event: MessageEvent<ChatMessage>) => {
      const message = event.data;
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    channelRef.current.onmessage = onMessageReceive;

    return () => {
      const currentChannel = channelRef.current;
      if (currentChannel) {
        currentChannel.close();
      }
    };
  }, []);

  function send() {
    if (!draft.trim()) return;
    const msg: ChatMessage = {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      text: draft,
      at: Date.now(),
    };

    const channel = channelRef.current;
    if (channel) {
      channel.postMessage(msg);
    }

    setMessages((prevMessages) => [...prevMessages, msg]);

    setDraft("");
  }

  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 400 }}>
      <h2>Broadcast Chat</h2>
      <div
        style={{
          border: "1px solid #ccc",
          padding: 8,
          minHeight: 120,
          marginBottom: 8,
        }}
      >
        {messages.map((m) => (
          <div key={m.id}>{m.text}</div>
        ))}
      </div>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && send()}
        placeholder="type and hit enter"
      />
      <button onClick={send}>Send</button>
    </div>
  );
}
