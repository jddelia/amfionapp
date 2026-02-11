"use client";

import { useMemo, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export const ChatWidget = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hi there! Tell me what service you’re looking for and your preferred time."
    }
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const sessionRef = useRef<string | null>(null);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL ?? "", []);

  const resolveBaseUrl = () => {
    if (apiBase) return apiBase;
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  };

  const ensureSession = async () => {
    if (sessionRef.current) return sessionRef.current;
    const response = await fetch(`${resolveBaseUrl()}/v1/chat/session`, { method: "POST" });
    const data = (await response.json()) as { sessionId: string };
    sessionRef.current = data.sessionId;
    return data.sessionId;
  };

  const handleSend = async () => {
    const message = input.trim();
    if (!message || isSending) return;
    setInput("");
    setIsSending(true);
    setMessages((prev) => [...prev, { role: "user", text: message }]);

    const sessionId = await ensureSession();
    const response = await fetch(`${resolveBaseUrl()}/v1/chat/stream`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId, message })
    });

    if (!response.body) {
      setIsSending(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let separatorIndex = buffer.indexOf("\n\n");
      while (separatorIndex !== -1) {
        const chunk = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        separatorIndex = buffer.indexOf("\n\n");

        const lines = chunk.split("\n");
        let eventName = "message";
        let dataLine = "";
        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventName = line.replace("event:", "").trim();
          }
          if (line.startsWith("data:")) {
            dataLine += line.replace("data:", "").trim();
          }
        }

        if (!dataLine) continue;
        if (eventName === "message") {
          try {
            const payload = JSON.parse(dataLine) as { text?: string };
            const text = payload.text;
            if (typeof text === "string" && text.length > 0) {
              setMessages((prev) => [...prev, { role: "assistant", text }]);
            }
          } catch {
            setMessages((prev) => [...prev, { role: "assistant", text: dataLine }]);
          }
        }
      }
    }

    setIsSending(false);
  };

  return (
    <div className="chat-shell">
      <div style={{ display: "grid", gap: "12px" }}>
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`chat-bubble ${message.role === "assistant" ? "bot" : "user"}`}
          >
            {message.text}
          </div>
        ))}
      </div>
      <div className="input-row">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about availability, pricing, or policies..."
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSend();
          }}
        />
        <button className="button" onClick={handleSend} disabled={isSending}>
          {isSending ? "Sending" : "Send"}
        </button>
      </div>
    </div>
  );
};
