import { authFetch } from './api';

export interface Card {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  position: number;
  priority: string;
  status: string;
  createdAt?: string | Date;
}

export const cardsApi = {
  getByColumn: async (columnId: string): Promise<Card[]> => {
    const res = await authFetch(`/cards?columnId=${columnId}`);
    return res.json();
  },
  create: async (columnId: string, title: string, creatorId: string): Promise<Card> => {
    const res = await authFetch('/cards', {
      method: 'POST',
      body: JSON.stringify({ columnId, title, creatorId }),
    });
    return res.json();
  },
  update: async (id: string, updates: Partial<Card>): Promise<Card> => {
    const res = await authFetch(`/cards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res.json();
  },
  move: async (id: string, targetColumnId: string, newPosition: number): Promise<Card> => {
    const res = await authFetch(`/cards/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ targetColumnId, newPosition }),
    });
    return res.json();
  },
  delete: async (id: string): Promise<void> => {
    await authFetch(`/cards/${id}`, { method: 'DELETE' });
  }
};
