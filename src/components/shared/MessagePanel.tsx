import { Paperclip, Search, Send, Smile } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { conversations as seed, type ChatMessage, type Conversation } from "@/data/mockData";
import type { Role } from "@/lib/auth";
import { initials } from "@/lib/risk";
import { cn } from "@/lib/utils";

export function MessagePanel({ role }: { role: Role }) {
  const initial = useMemo(
    () => seed.filter((c) => c.audience.includes(role)).map((c) => ({ ...c, messages: [...c.messages] })),
    [role],
  );
  const [threads, setThreads] = useState<Conversation[]>(initial);
  const [activeId, setActiveId] = useState(initial[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");

  const visible = threads.filter(
    (c) => !query.trim() || c.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const active = threads.find((c) => c.id === activeId) ?? threads[0];

  function send() {
    if (!draft.trim() || !active) return;
    const msg: ChatMessage = {
      id: `m${Date.now()}`,
      from: "me",
      text: draft.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setThreads((prev) =>
      prev.map((c) => (c.id === active.id ? { ...c, messages: [...c.messages, msg], lastTime: msg.time, unread: 0 } : c)),
    );
    setDraft("");
  }

  return (
    <div className="surface grid h-[calc(100vh-13rem)] min-h-[520px] grid-cols-1 overflow-hidden md:grid-cols-[300px_minmax(0,1fr)]">
      {/* Conversation list */}
      <div className={cn("flex flex-col border-border md:border-r", active && "hidden md:flex")}>
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations…"
              className="rounded-xl bg-muted/50 pl-9"
            />
          </div>
        </div>
        <div className="scrollbar-slim flex-1 overflow-y-auto">
          {visible.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveId(c.id);
                setThreads((prev) => prev.map((t) => (t.id === c.id ? { ...t, unread: 0 } : t)));
              }}
              className={cn(
                "flex w-full items-start gap-3 border-b border-border/60 px-3 py-3 text-left transition-colors hover:bg-muted/60",
                c.id === active?.id && "bg-primary-soft/50",
              )}
            >
              <span className="relative shrink-0">
                <span className="grid size-10 place-items-center rounded-full bg-primary/12 text-xs font-bold text-primary">
                  {initials(c.name)}
                </span>
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card",
                    c.online ? "bg-success" : "bg-muted-foreground",
                  )}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-foreground">{c.name}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{c.lastTime}</span>
                </span>
                <span className="block truncate text-xs text-muted-foreground">{c.role}</span>
                <span className="mt-1 flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                    {c.messages[c.messages.length - 1]?.text}
                  </span>
                  {c.unread > 0 && (
                    <span className="grid size-4.5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {c.unread}
                    </span>
                  )}
                </span>
              </span>
            </button>
          ))}
          {visible.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">No conversations found.</p>
          )}
        </div>
      </div>

      {/* Chat window */}
      {active && (
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <button
              onClick={() => setActiveId("")}
              className="text-xs font-medium text-primary md:hidden"
            >
              Back
            </button>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/12 text-[11px] font-bold text-primary">
              {initials(active.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{active.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                <span className={cn("mr-1 inline-block size-2 rounded-full", active.online ? "bg-success" : "bg-muted-foreground")} />
                {active.online ? "Online" : "Offline"} · {active.meta}
              </p>
            </div>
          </div>

          <div className="scrollbar-slim flex-1 space-y-3 overflow-y-auto bg-muted/25 p-4">
            {active.messages.map((m) => (
              <div key={m.id} className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm shadow-card animate-in fade-in slide-in-from-bottom-1",
                    m.from === "me"
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-card text-card-foreground",
                  )}
                >
                  <p className="leading-relaxed">{m.text}</p>
                  <p className={cn("mt-1 text-[10px]", m.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {m.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted">
                  <Paperclip className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Attach file</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setDraft((d) => `${d}🙂`)}
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <Smile className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Emoji</TooltipContent>
            </Tooltip>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Message ${active.name.split(" ")[0]}…`}
              className="rounded-xl bg-muted/50"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
