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

import { getDb } from "./config";
import type { UserRole } from "./users";

const CONVERSATIONS = "conversations";

// =========================================================
// TYPES
// =========================================================

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

// =========================================================
// CREATE CONSISTENT CONVERSATION ID
// =========================================================

export function conversationIdFor(
  uidA: string,
  uidB: string,
): string {
  return [uidA, uidB].sort().join("_");
}

// =========================================================
// FIRESTORE TIMESTAMP -> NUMBER
// =========================================================

function toMillis(value: unknown): number {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof value.toMillis === "function"
  ) {
    return value.toMillis() as number;
  }

  if (typeof value === "number") {
    return value;
  }

  return Date.now();
}

// =========================================================
// MAP FIRESTORE CONVERSATION
// =========================================================

function mapConversation(
  id: string,
  data: Record<string, unknown>,
): InboxConversation {
  const participantIds = data["participantIds"];
  const participants = data["participants"];
  const lastMessage = data["lastMessage"];
  const lastMessageAt = data["lastMessageAt"];
  const lastSenderId = data["lastSenderId"];
  const unread = data["unread"];

  return {
    id,

    participantIds: Array.isArray(participantIds)
      ? (participantIds as string[])
      : [],

    participants:
      participants &&
      typeof participants === "object"
        ? (participants as Record<
            string,
            ConversationParticipant
          >)
        : {},

    lastMessage:
      typeof lastMessage === "string"
        ? lastMessage
        : "",

    lastMessageAt: toMillis(lastMessageAt),

    lastSenderId:
      typeof lastSenderId === "string"
        ? lastSenderId
        : "",

    unread:
      unread &&
      typeof unread === "object"
        ? (unread as Record<string, number>)
        : {},
  };
}

// =========================================================
// GET OTHER PERSON IN CONVERSATION
// =========================================================

export function otherParticipant(
  conversation: InboxConversation,
  uid: string,
): ConversationParticipant | undefined {
  return Object.values(
    conversation.participants,
  ).find((person) => person.uid !== uid);
}

// =========================================================
// SUBSCRIBE TO USER CONVERSATIONS
// =========================================================

export function subscribeConversations(
  uid: string,
  onChange: (
    threads: InboxConversation[],
  ) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const threadsQuery = query(
    collection(
      getDb(),
      CONVERSATIONS,
    ),
    where(
      "participantIds",
      "array-contains",
      uid,
    ),
  );

  return onSnapshot(
    threadsQuery,

    (snapshot) => {
      const threads = snapshot.docs
        .map((entry) =>
          mapConversation(
            entry.id,
            entry.data() as Record<
              string,
              unknown
            >,
          ),
        )
        .sort(
          (a, b) =>
            b.lastMessageAt -
            a.lastMessageAt,
        );

      onChange(threads);
    },

    (error) => {
      onChange([]);
      onError?.(error);
    },
  );
}

// =========================================================
// SUBSCRIBE TO MESSAGES
// =========================================================

export function subscribeMessages(
  conversationId: string,
  onChange: (
    messages: InboxMessage[],
  ) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const messagesQuery = query(
    collection(
      getDb(),
      CONVERSATIONS,
      conversationId,
      "messages",
    ),
    orderBy(
      "createdAt",
      "asc",
    ),
  );

  return onSnapshot(
    messagesQuery,

    (snapshot) => {
      const messages: InboxMessage[] =
        snapshot.docs.map((entry) => {
          const data =
            entry.data() as Record<
              string,
              unknown
            >;

          const senderId =
            data["senderId"];

          const text =
            data["text"];

          const createdAt =
            data["createdAt"];

          return {
            id: entry.id,

            senderId:
              typeof senderId === "string"
                ? senderId
                : "",

            text:
              typeof text === "string"
                ? text
                : "",

            createdAt:
              toMillis(createdAt),
          };
        });

      onChange(messages);
    },

    (error) => {
      onChange([]);
      onError?.(error);
    },
  );
}

// =========================================================
// SEND MESSAGE
// =========================================================

export async function sendInboxMessage(
  input: {
    from: ConversationParticipant;
    to: ConversationParticipant;
    text: string;
  },
): Promise<string> {
  const text = input.text.trim();

  if (!text) {
    throw new Error(
      "Message cannot be empty.",
    );
  }

  // Prevent messaging yourself
  if (input.from.uid === input.to.uid) {
    throw new Error(
      "You cannot send a message to yourself.",
    );
  }

  const conversationId =
    conversationIdFor(
      input.from.uid,
      input.to.uid,
    );

  const conversationRef = doc(
    getDb(),
    CONVERSATIONS,
    conversationId,
  );

  const now = Timestamp.now();

  const existing =
    await getDoc(conversationRef);

  // =======================================================
  // NEW CONVERSATION
  // =======================================================

  if (!existing.exists()) {
    await setDoc(
      conversationRef,
      {
        participantIds: [
          input.from.uid,
          input.to.uid,
        ],

        participants: {
          [input.from.uid]:
            input.from,

          [input.to.uid]:
            input.to,
        },

        lastMessage: text,

        lastMessageAt: now,

        lastSenderId:
          input.from.uid,

        unread: {
          [input.from.uid]: 0,
          [input.to.uid]: 1,
        },
      },
    );
  }

  // =======================================================
  // EXISTING CONVERSATION
  // =======================================================

  else {
    await updateDoc(
      conversationRef,
      {
        [`participants.${input.from.uid}`]:
          input.from,

        [`participants.${input.to.uid}`]:
          input.to,

        lastMessage: text,

        lastMessageAt: now,

        lastSenderId:
          input.from.uid,

        [`unread.${input.from.uid}`]:
          0,

        [`unread.${input.to.uid}`]:
          increment(1),
      },
    );
  }

  // =======================================================
  // ADD MESSAGE TO SUBCOLLECTION
  // =======================================================

  await addDoc(
    collection(
      conversationRef,
      "messages",
    ),
    {
      senderId:
        input.from.uid,

      text,

      createdAt: now,
    },
  );

  return conversationId;
}

// =========================================================
// MARK CONVERSATION AS READ
// =========================================================

export async function markConversationRead(
  conversationId: string,
  uid: string,
): Promise<void> {
  const conversationRef = doc(
    getDb(),
    CONVERSATIONS,
    conversationId,
  );

  await updateDoc(
    conversationRef,
    {
      [`unread.${uid}`]: 0,
    },
  );
}

// =========================================================
// CONVERT AUTH USER -> CONVERSATION PARTICIPANT
// =========================================================

export function toParticipant(
  user: {
    uid: string;
    name: string;
    email: string;
    role: UserRole;
    title: string;
    department: string;
  },
): ConversationParticipant {
  return {
    uid: user.uid,
    name: user.name,
    email: user.email,
    role: user.role,
    title: user.title,
    department: user.department,
  };
}