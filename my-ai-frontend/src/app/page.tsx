// app/page.tsx or pages/index.js
"use client";
import { useState, useRef, useEffect } from "react";
import "./chatui.css";

type Message = { role: string; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input) return;
    setMessages((msgs) => [...msgs, { role: "user", content: input }]);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((msgs) => [...msgs, { role: "assistant", content: data.reply }]);
      } else {
        setError(data.reply || "No reply from backend.");
      }
    } catch (err) {
      setError("Network or server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="chat-main">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-row ${msg.role === "user" ? "chat-row-user" : "chat-row-assistant"}`}
            style={{ alignItems: "flex-end" }}
          >
            {msg.role === "assistant" && (
              <div className="chat-avatar chat-avatar-assistant">🤖</div>
            )}
            <div className={`chat-bubble ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}`}>{
              msg.content.replace(/\*\*(.*?)\*\*/g, "$1")
                .split(/\n|\r|\r\n|\n\n|\r\r|\n\s*\n/)
                .filter(line => line.trim() !== "")
                .map((line, idx) => (
                  <div key={idx} style={{ marginBottom: 8 }}>{line}</div>
                ))
            }</div>
            {msg.role === "user" && (
              <div className="chat-avatar chat-avatar-user">🧑</div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
        {loading && <div className="chat-loading"><i>Loading...</i></div>}
        {error && <div className="chat-error"><b>Error:</b> {error}</div>}
      </div>
      <form className="chat-form" onSubmit={e => { e.preventDefault(); sendMessage(); }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type your message..."
          disabled={loading}
          className="chat-input"
        />
        <button
          type="submit"
          disabled={loading || !input}
          className="chat-send-btn"
        >
          Send
        </button>
      </form>
    </main>
  );
}