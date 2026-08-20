import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import type { UserRole } from "./users";
import { getDb } from "./config";

const CONVERSATIONS = "conversations";

export interface ConversationParticipant {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  department: string;
}

export interface InboxConversation {
  id: string;
  participantIds: string[];
  participants: Record<string, ConversationParticipant>;
  lastMessage: string;
  lastMessageAt: number;
  lastSenderId: string;
  unread: Record<string, number>;
}

export interface InboxMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
}

export function conversationIdFor(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join("_");
}

function toMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
    return value.toMillis() as number;
  }
  if (typeof value === "number") return value;
  return Date.now();
}

function mapConversation(id: string, data: Record<string, unknown>): InboxConversation {
  return {
    id,
    participantIds: Array.isArray(data.participantIds) ? (data.participantIds as string[]) : [],
    participants: (data.participants as Record<string, ConversationParticipant>) ?? {},
    lastMessage: typeof data.lastMessage === "string" ? data.lastMessage : "",
    lastMessageAt: toMillis(data.lastMessageAt),
    lastSenderId: typeof data.lastSenderId === "string" ? data.lastSenderId : "",
    unread: (data.unread as Record<string, number>) ?? {},
  };
}

export function otherParticipant(conversation: InboxConversation, uid: string): ConversationParticipant | undefined {
  return Object.values(conversation.participants).find((person) => person.uid !== uid);
}

export function subscribeConversations(
  uid: string,
  onChange: (threads: InboxConversation[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const threadsQuery = query(
    collection(getDb(), CONVERSATIONS),
    where("participantIds", "array-contains", uid),
  );

  return onSnapshot(
    threadsQuery,
    (snapshot) => {
      const threads = snapshot.docs
        .map((entry) => mapConversation(entry.id, entry.data() as Record<string, unknown>))
        .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
      onChange(threads);
    },
    (error) => {
      onChange([]);
      onError?.(error);
    },
  );
}

export function subscribeMessages(conversationId: string, onChange: (messages: InboxMessage[]) => void): Unsubscribe {
  const messagesQuery = query(
    collection(getDb(), CONVERSATIONS, conversationId, "messages"),
    orderBy("createdAt", "asc"),
  );

  return onSnapshot(messagesQuery, (snapshot) => {
    onChange(
      snapshot.docs.map((entry) => {
        const data = entry.data();
        return {
          id: entry.id,
          senderId: String(data.senderId ?? ""),
          text: String(data.text ?? ""),
          createdAt: toMillis(data.createdAt),
        };
      }),
    );
  });
}

export async function sendInboxMessage(input: {
  from: ConversationParticipant;
  to: ConversationParticipant;
  text: string;
}): Promise<string> {
  const text = input.text.trim();
  if (!text) throw new Error("Message cannot be empty.");

  const conversationId = conversationIdFor(input.from.uid, input.to.uid);
  const conversationRef = doc(getDb(), CONVERSATIONS, conversationId);
  const now = Timestamp.now();
  const existing = await getDoc(conversationRef);

  if (!existing.exists()) {
    await setDoc(conversationRef, {
      participantIds: [input.from.uid, input.to.uid],
      participants: {
        [input.from.uid]: input.from,
        [input.to.uid]: input.to,
      },
      lastMessage: text,
      lastMessageAt: now,
      lastSenderId: input.from.uid,
      unread: {
        [input.from.uid]: 0,
        [input.to.uid]: 1,
      },
    });
  } else {
    await updateDoc(conversationRef, {
      participants: {
        [input.from.uid]: input.from,
        [input.to.uid]: input.to,
      },
      lastMessage: text,
      lastMessageAt: now,
      lastSenderId: input.from.uid,
      [`unread.${input.from.uid}`]: 0,
      [`unread.${input.to.uid}`]: increment(1),
    });
  }

  await addDoc(collection(conversationRef, "messages"), {
    senderId: input.from.uid,
    text,
    createdAt: now,
  });

  return conversationId;
}

export async function markConversationRead(conversationId: string, uid: string): Promise<void> {
  await updateDoc(doc(getDb(), CONVERSATIONS, conversationId), {
    [`unread.${uid}`]: 0,
  });
}

export function toParticipant(user: {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  department: string;
}): ConversationParticipant {
  return {
    uid: user.uid,
    name: user.name,
    email: user.email,
    role: user.role,
    title: user.title,
    department: user.department,
  };
}
