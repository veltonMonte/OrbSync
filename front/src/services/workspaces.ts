import { authFetch } from './api';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
}

export const workspacesApi = {
  getAll: async (): Promise<Workspace[]> => {
    const res = await authFetch('/workspaces');
    return res.json();
  },
  create: async (name: string): Promise<Workspace> => {
    const randomSuffix = Math.floor(Math.random() * 10000);
    const slug = `${name.toLowerCase().replace(/\s+/g, '-')}-${randomSuffix}`;
    const res = await authFetch('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name, slug }),
    });
    return res.json();
  },
  getStats: async (workspaceId: string): Promise<{ 
    projects: number, 
    inProgress: number, 
    done: number,
    activityData: { name: string, tasks: number }[],
    projectDistributionData: { name: string, value: number, color: string }[]
  }> => {
    const res = await authFetch(`/workspaces/${workspaceId}/stats`);
    return res.json();
  }
};
