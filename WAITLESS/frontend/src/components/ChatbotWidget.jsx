import { useCallback, useRef, useState } from "react";
import { Bot, Building2, Send, Ticket, X } from "lucide-react";
import { sendChatbotMessage } from "@/services/queueApi";
import { DEPARTMENTS } from "@/services/queueMeta";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hello! I'm the WaitLess assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [ticketCode, setTicketCode] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const result = await sendChatbotMessage(text, {
        ticketCode: ticketCode.trim() || undefined,
        department: department || undefined,
      });
      setMessages((prev) => [...prev, { role: "bot", text: result.response }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: err?.message || "Sorry, I couldn't process your request right now. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [department, input, loading, ticketCode]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full gradient-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
        aria-label="Open chatbot"
      >
        <Bot className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[560px] max-h-[calc(100vh-3rem)] w-[min(380px,calc(100vw-2rem))] flex-col rounded-2xl border border-border bg-card shadow-xl">
      <div className="flex items-center justify-between rounded-t-2xl gradient-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="font-display text-sm font-bold">WaitLess Assistant</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 transition-colors hover:bg-white/20"
          aria-label="Close chatbot"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ${
                msg.role === "user"
                  ? "gradient-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
              Typing...
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-border p-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="relative block">
            <Ticket className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={ticketCode}
              onChange={(event) => setTicketCode(event.target.value.toUpperCase())}
              placeholder="Ticket code"
              aria-label="Ticket code"
              maxLength={80}
              className="w-full rounded-lg border border-border bg-background py-2 pl-8 pr-2 text-xs uppercase outline-none focus:border-primary"
              disabled={loading}
            />
          </label>
          <label className="relative block">
            <Building2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              aria-label="Department"
              className="w-full appearance-none rounded-lg border border-border bg-background py-2 pl-8 pr-2 text-xs outline-none focus:border-primary"
              disabled={loading}
            >
              <option value="">Any department</option>
              {DEPARTMENTS.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about wait times, tickets, prescriptions..."
            maxLength={500}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            disabled={loading}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg gradient-primary text-primary-foreground transition-opacity disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
