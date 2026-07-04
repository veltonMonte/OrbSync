import { authFetch } from './api';

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
  }
};
