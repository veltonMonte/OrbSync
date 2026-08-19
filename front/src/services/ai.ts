import { authFetch } from './api';

export type AiProvider = 'gemini' | 'openai' | 'anthropic';

export interface AiConfig {
  provider: AiProvider;
  model: string;
  apiKeyMasked: string;
}

export const AI_PROVIDER_MODELS: Record<AiProvider, { label: string; models: string[] }> = {
  gemini: {
    label: 'Google Gemini',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-pro'],
  },
  openai: {
    label: 'OpenAI / ChatGPT',
    models: ['gpt-4o', 'gpt-4o-mini', 'o1-mini', 'gpt-4-turbo'],
  },
  anthropic: {
    label: 'Anthropic / Claude',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  },
};

export interface AIMessage {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
}

export interface AIChat {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages: AIMessage[];
}

export const aiService = {
  createChat: async (title?: string): Promise<AIChat> => {
    const res = await authFetch('/ai/chats', {
      method: 'POST',
      body: JSON.stringify({ title })
    });
    return res.json();
  },

  getChats: async (): Promise<AIChat[]> => {
    const res = await authFetch('/ai/chats');
    return res.json();
  },

  getChat: async (id: string): Promise<AIChat> => {
    const res = await authFetch(`/ai/chats/${id}`);
    return res.json();
  },

  sendMessage: async (chatId: string, content: string): Promise<{ userMessage: AIMessage; assistantMessage: AIMessage }> => {
    const res = await authFetch(`/ai/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    return res.json();
  },

  deleteChat: async (id: string): Promise<void> => {
    await authFetch(`/ai/chats/${id}`, {
      method: 'DELETE'
    });
  },

  generateDoc: async (prompt: string): Promise<{ html: string }> => {
    const res = await authFetch('/ai/generate-doc', {
      method: 'POST',
      body: JSON.stringify({ prompt })
    });
    return res.json();
  },

  generateTerminalCommand: async (prompt: string): Promise<{ command: string }> => {
    const res = await authFetch('/ai/generate-command', {
      method: 'POST',
      body: JSON.stringify({ prompt })
    });
    return res.json();
  },

  // ─── AI Provider Config ───────────────────────────────────────────────────

  getConfig: async (): Promise<AiConfig | null> => {
    const res = await authFetch('/ai/config');
    if (res.status === 404 || res.status === 204) return null;
    const data = await res.json();
    return data ?? null;
  },

  saveConfig: async (provider: AiProvider, model: string, apiKey: string): Promise<void> => {
    await authFetch('/ai/config', {
      method: 'POST',
      body: JSON.stringify({ provider, model, apiKey }),
    });
  },

  deleteConfig: async (): Promise<void> => {
    await authFetch('/ai/config', { method: 'DELETE' });
  },
};
