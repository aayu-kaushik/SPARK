import { Loader2, Paperclip, Plus, Search, Send, Smile } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getFirebaseAuthErrorMessage } from "@/firebase/auth";
import {
  conversationIdFor,
  markConversationRead,
  otherParticipant,
  sendInboxMessage,
  subscribeConversations,
  subscribeMessages,
  toParticipant,
  type ConversationParticipant,
  type InboxConversation,
  type InboxMessage,
} from "@/firebase/messages";
import { canMessageRole, findUserByEmail, listUserProfiles, subscribeUserProfiles, type UserProfile } from "@/firebase/users";
import { ROLE_LABEL, useAuth } from "@/lib/auth";
import { initials } from "@/lib/risk";
import { cn } from "@/lib/utils";

function formatClock(ms: number) {
  const date = new Date(ms);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function counterpartCopy(role: string) {
  if (role === "student") return "a practitioner or admin";
  if (role === "practitioner") return "a student or admin";
  return "a student or practitioner";
}

export function MessagePanel() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<InboxConversation[]>([]);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [activeId, setActiveId] = useState("");
  const [pending, setPending] = useState<ConversationParticipant | null>(null);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [contactQuery, setContactQuery] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [lookingUp, setLookingUp] = useState(false);

  const me = user ? toParticipant(user) : null;

  useEffect(() => {
    if (!user?.uid) {
      setThreads([]);
      setLoadingThreads(false);
      return;
    }

    setLoadingThreads(true);
    try {
      const unsubscribe = subscribeConversations(
        user.uid,
        (next) => {
          setThreads(next);
          setLoadingThreads(false);
        },
        (error) => {
          setLoadingThreads(false);
          toast.error("Could not load inbox", { description: getFirebaseAuthErrorMessage(error) });
        },
      );
      return unsubscribe;
    } catch (error) {
      setLoadingThreads(false);
      toast.error("Could not load inbox", { description: getFirebaseAuthErrorMessage(error) });
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setContacts([]);
      setLoadingContacts(false);
      return;
    }
    setLoadingContacts(true);
    void listUserProfiles()
      .then((profiles) => {
        setContacts(profiles);
        setLoadingContacts(false);
      })
      .catch((error) => {
        setLoadingContacts(false);
        toast.error("Could not load contacts", { description: getFirebaseAuthErrorMessage(error) });
      });
    try {
      return subscribeUserProfiles(
        (profiles) => {
          setContacts(profiles);
          setLoadingContacts(false);
        },
        (error) => {
          setLoadingContacts(false);
          toast.error("Could not load contacts", { description: getFirebaseAuthErrorMessage(error) });
        },
      );
    } catch (error) {
      setLoadingContacts(false);
      toast.error("Could not load contacts", { description: getFirebaseAuthErrorMessage(error) });
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    const unsubscribe = subscribeMessages(activeId, setMessages);
    return unsubscribe;
  }, [activeId]);

  useEffect(() => {
    if (!user?.uid || !activeId) return;
    const thread = threads.find((item) => item.id === activeId);
    if (!thread || !(thread.unread[user.uid] > 0)) return;
    void markConversationRead(activeId, user.uid).catch(() => undefined);
  }, [activeId, user?.uid, messages.length, threads]);

  const visible = threads.filter((thread) => {
    if (!query.trim() || !user) return true;
    const other = otherParticipant(thread, user.uid);
    return other?.name.toLowerCase().includes(query.trim().toLowerCase());
  });

  const activeThread = threads.find((thread) => thread.id === activeId);
  const peer = pending ?? (user && activeThread ? otherParticipant(activeThread, user.uid) : undefined);

  const eligibleContacts = useMemo(() => {
    if (!user) return [];
    return contacts
      .filter((contact) => contact.uid && contact.uid !== user.uid && contact.role && canMessageRole(user.role, contact.role))
      .filter(
        (contact) =>
          !contactQuery.trim() ||
          contact.name.toLowerCase().includes(contactQuery.trim().toLowerCase()) ||
          contact.email.toLowerCase().includes(contactQuery.trim().toLowerCase()),
      );
  }, [contacts, contactQuery, user]);

  function openPicker() {
    setPickerOpen(true);
  }

  async function lookupByEmail() {
    if (!user) return;
    const email = contactQuery.trim();
    if (!email.includes("@")) {
      toast.error("Enter the person’s full email address to find them.");
      return;
    }
    setLookingUp(true);
    try {
      const found = await findUserByEmail(email);
      if (!found) {
        toast.error("No SPARK account uses that email.");
        return;
      }
      if (!canMessageRole(user.role, found.role)) {
        toast.error("You can only message a different role.");
        return;
      }
      startConversation(found);
    } catch (error) {
      toast.error("Could not find that account", { description: getFirebaseAuthErrorMessage(error) });
    } finally {
      setLookingUp(false);
    }
  }

  function startConversation(contact: UserProfile) {
    if (!user) return;
    const id = conversationIdFor(user.uid, contact.uid);
    const existing = threads.find((thread) => thread.id === id);
    setDraft("");
    setPickerOpen(false);
    setContactQuery("");
    if (existing) {
      setPending(null);
      setActiveId(existing.id);
      return;
    }
    setActiveId("");
    setMessages([]);
    setPending(toParticipant(contact));
  }

  async function send() {
    if (!me || !peer || !draft.trim() || sending) return;
    setSending(true);
    try {
      const conversationId = await sendInboxMessage({ from: me, to: peer, text: draft });
      setDraft("");
      setActiveId(conversationId);
    } catch (error) {
      toast.error("Message not sent", { description: getFirebaseAuthErrorMessage(error) });
    } finally {
      setSending(false);
    }
  }

  if (!user) return null;

  return (
    <div className="surface grid h-[calc(100vh-13rem)] min-h-[520px] grid-cols-1 overflow-hidden md:grid-cols-[300px_minmax(0,1fr)]">
      <div className={cn("flex flex-col border-border md:border-r", (activeId || pending) && "hidden md:flex")}>
        <div className="space-y-2 border-b border-border p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations…"
              className="rounded-xl bg-muted/50 pl-9"
            />
          </div>
          <Button type="button" variant="outline" className="w-full rounded-xl" onClick={openPicker}>
            <Plus className="size-4" /> New message
          </Button>
        </div>
        <div className="scrollbar-slim flex-1 overflow-y-auto">
          {loadingThreads && (
            <p className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading inbox…
            </p>
          )}
          {!loadingThreads &&
            visible.map((thread) => {
              const other = otherParticipant(thread, user.uid);
              if (!other) return null;
              const unread = thread.unread[user.uid] ?? 0;
              return (
                <button
                  key={thread.id}
                  onClick={() => {
                    setPending(null);
                    setActiveId(thread.id);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-border/60 px-3 py-3 text-left transition-colors hover:bg-muted/60",
                    thread.id === activeId && "bg-primary-soft/50",
                  )}
                >
                  <span className="relative shrink-0">
                    <span className="grid size-10 place-items-center rounded-full bg-primary/12 text-xs font-bold text-primary">
                      {initials(other.name)}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">{other.name}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{formatClock(thread.lastMessageAt)}</span>
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {ROLE_LABEL[other.role]}
                      {other.department ? ` · ${other.department}` : ""}
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{thread.lastMessage}</span>
                      {unread > 0 && (
                        <span className="grid size-4.5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          {unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          {!loadingThreads && visible.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No conversations yet. Message {counterpartCopy(user.role)} to start one.
            </p>
          )}
        </div>
      </div>

      {peer ? (
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <button
              onClick={() => {
                setActiveId("");
                setPending(null);
              }}
              className="text-xs font-medium text-primary md:hidden"
            >
              Back
            </button>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/12 text-[11px] font-bold text-primary">
              {initials(peer.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{peer.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {ROLE_LABEL[peer.role]}
                {peer.department ? ` · ${peer.department}` : ""} · {peer.email}
              </p>
            </div>
          </div>

          <div className="scrollbar-slim flex-1 space-y-3 overflow-y-auto bg-muted/25 p-4">
            {messages.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Messages you send here appear in {peer.name.split(" ")[0]}’s inbox.
              </p>
            )}
            {messages.map((message) => {
              const mine = message.senderId === user.uid;
              return (
                <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm shadow-card animate-in fade-in slide-in-from-bottom-1",
                      mine
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md bg-card text-card-foreground",
                    )}
                  >
                    <p className="leading-relaxed">{message.text}</p>
                    <p className={cn("mt-1 text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {formatClock(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
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
              placeholder={`Message ${peer.name.split(" ")[0]}…`}
              className="rounded-xl bg-muted/50"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
              aria-label="Send message"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </form>
        </div>
      ) : (
        <div className="hidden place-items-center p-8 text-center md:grid">
          <div>
            <p className="font-display text-lg font-semibold">Inbox</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Choose a conversation or start a new one. Students, practitioners and admins all see the same thread.
            </p>
          </div>
        </div>
      )}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New message</DialogTitle>
            <DialogDescription>Messages are delivered to the other person’s inbox in real time.</DialogDescription>
          </DialogHeader>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void lookupByEmail();
            }}
          >
            <Input
              value={contactQuery}
              onChange={(e) => setContactQuery(e.target.value)}
              placeholder="Search name or enter email…"
              className="rounded-xl"
            />
            <Button type="submit" variant="outline" disabled={lookingUp}>
              {lookingUp ? <Loader2 className="size-4 animate-spin" /> : "Find"}
            </Button>
          </form>
          <div className="scrollbar-slim max-h-72 overflow-y-auto rounded-xl border border-border">
            {loadingContacts && (
              <p className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading people…
              </p>
            )}
            {!loadingContacts &&
              eligibleContacts.map((contact) => (
                <button
                  key={contact.uid}
                  type="button"
                  onClick={() => startConversation(contact)}
                  className="flex w-full items-center gap-3 border-b border-border/60 px-3 py-3 text-left last:border-b-0 hover:bg-muted/60"
                >
                  <span className="grid size-9 place-items-center rounded-full bg-primary/12 text-[11px] font-bold text-primary">
                    {initials(contact.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{contact.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {ROLE_LABEL[contact.role]} · {contact.email}
                    </span>
                  </span>
                </button>
              ))}
            {!loadingContacts && eligibleContacts.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No matching accounts. Create another SPARK login as a different role, or Find them by email.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
