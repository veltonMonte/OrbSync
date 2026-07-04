import { authFetch } from './api';

export interface BackendDocument {
  id: string;
  title: string;
  content: string;
  type: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export const documentsApi = {
  getAll: async (): Promise<BackendDocument[]> => {
    const res = await authFetch('/documents');
    return res.json();
  },
  getById: async (id: string): Promise<BackendDocument> => {
    const res = await authFetch(`/documents/${id}`);
    return res.json();
  },
  create: async (title: string, content: string, type: string = 'CUSTOM'): Promise<BackendDocument> => {
    const res = await authFetch('/documents', {
      method: 'POST',
      body: JSON.stringify({ title, content, type }),
    });
    return res.json();
  },
  update: async (id: string, title: string, content: string): Promise<BackendDocument> => {
    const res = await authFetch(`/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title, content }),
    });
    return res.json();
  },
  delete: async (id: string): Promise<void> => {
    await authFetch(`/documents/${id}`, { method: 'DELETE' });
  }
};
