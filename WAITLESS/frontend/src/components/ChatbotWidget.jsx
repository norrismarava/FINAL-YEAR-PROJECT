import { useCallback, useRef, useState } from "react";
import { Building2, PhoneCall, Send, Ticket, X } from "lucide-react";
import robotIcon from "@/assets/robot.png";
import { sendChatbotMessage } from "@/services/queueApi";
import { DEPARTMENTS } from "@/services/queueMeta";

const CALL_OPTIONS = [
  { label: "Emergency, open 24/7", number: "+263 77 000 0000" },
  { label: "Reception", number: "+263 77 123 4567" },
];

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
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
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {callOpen ? (
          <div className="w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#04141f]/90 shadow-[0_24px_60px_-20px_rgba(2,8,20,0.7)] backdrop-blur-xl">
            <div className="border-b border-white/10 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-100/70">
              Call us directly
            </div>
            {CALL_OPTIONS.map((option) => (
              <a
                key={option.number}
                href={`tel:${option.number.replaceAll(" ", "")}`}
                className="flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.06]"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-500/15 text-teal-300">
                  <PhoneCall className="h-3.5 w-3.5" />
                </span>
                <span>
                  <span className="block text-[11px] font-medium text-slate-400">{option.label}</span>
                  <span className="block text-sm font-semibold text-white">{option.number}</span>
                </span>
              </a>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid h-14 w-14 place-items-center rounded-full gradient-primary p-2.5 text-primary-foreground shadow-lg transition-transform hover:scale-105"
          aria-label="Open chatbot"
        >
          <img src={robotIcon} alt="" className="h-full w-full object-contain" />
        </button>
        <button
          type="button"
          onClick={() => setCallOpen((current) => !current)}
          aria-expanded={callOpen}
          aria-label="Show call options"
          title="Call us"
          className="grid h-14 w-14 place-items-center rounded-full bg-[#2563eb] p-3.5 text-white shadow-lg transition-transform hover:scale-105"
        >
          <PhoneCall className="h-full w-full" />
        </button>
        <a
          href="https://wa.me/263771234567"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          title="Chat with us on WhatsApp"
          className="grid h-14 w-14 place-items-center rounded-full bg-[#25D366] p-3.5 text-white shadow-lg transition-transform hover:scale-105"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[560px] max-h-[calc(100vh-3rem)] w-[min(380px,calc(100vw-2rem))] flex-col rounded-2xl border border-border bg-card shadow-xl">
      <div className="flex items-center justify-between rounded-t-2xl gradient-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-2">
          <img src={robotIcon} alt="" className="h-7 w-7 rounded-full bg-white/85 object-contain p-0.5" />
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
