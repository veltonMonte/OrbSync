import { authFetch } from './api';

export interface Automation {
  id: string;
  name: string;
  description?: string;
  trigger: 'CARD_MOVED' | 'CARD_CREATED' | 'DUE_DATE_REACHED' | 'STATUS_CHANGED';
  actionRules: any;
  isActive: boolean;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export const automationsApi = {
  getAll: async (workspaceId: string): Promise<Automation[]> => {
    const res = await authFetch(`/automations?workspaceId=${workspaceId}`);
    return res.json();
  },
  create: async (workspaceId: string, name: string, trigger: string, actionRules: any): Promise<Automation> => {
    const res = await authFetch('/automations', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, name, trigger, actionRules }),
    });
    return res.json();
  },
  update: async (id: string, name: string, trigger: string, actionRules: any): Promise<Automation> => {
    const res = await authFetch(`/automations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, trigger, actionRules }),
    });
    return res.json();
  },
  toggle: async (id: string, isActive: boolean): Promise<Automation> => {
    const res = await authFetch(`/automations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
    return res.json();
  },
  delete: async (id: string): Promise<void> => {
    await authFetch(`/automations/${id}`, { method: 'DELETE' });
  }
};
