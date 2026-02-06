import type { ChatSession } from "@amfion/shared";

export interface ChatSessionStore {
  create(tenantId: string): Promise<ChatSession>;
  get(sessionId: string): Promise<ChatSession | null>;
  touch(sessionId: string): Promise<void>;
}

export class MemoryChatSessionStore implements ChatSessionStore {
  private readonly store = new Map<string, ChatSession>();

  async create(tenantId: string): Promise<ChatSession> {
    const now = new Date().toISOString();
    const session: ChatSession = {
      id: crypto.randomUUID(),
      tenantId,
      createdAt: now,
      lastActiveAt: now
    };
    this.store.set(session.id, session);
    return session;
  }

  async get(sessionId: string): Promise<ChatSession | null> {
    return this.store.get(sessionId) ?? null;
  }

  async touch(sessionId: string): Promise<void> {
    const session = this.store.get(sessionId);
    if (session) {
      session.lastActiveAt = new Date().toISOString();
      this.store.set(sessionId, session);
    }
  }
}
