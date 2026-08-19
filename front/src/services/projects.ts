import { authFetch } from './api';
import type { Card } from './cards';

export interface Project {
  id: string;
  name: string;
  color?: string;
  isArchived: boolean;
  localPath?: string;
  githubRepo?: string;
  workspaceId: string;
  boards?: Board[];
  createdAt?: string | Date;
}

export interface Board {
  id: string;
  name: string;
  projectId: string;
  columns?: Column[];
}

export interface Column {
  id: string;
  name: string;
  position: number;
  boardId: string;
  color?: string;
  cards?: Card[];
}

export const projectsApi = {
  getAll: async (workspaceId: string): Promise<Project[]> => {
    const res = await authFetch(`/projects?workspaceId=${workspaceId}`);
    return res.json();
  },
  getById: async (id: string): Promise<Project> => {
    const res = await authFetch(`/projects/${id}`);
    return res.json();
  },
  create: async (workspaceId: string, name: string, localPath?: string, githubRepo?: string): Promise<Project> => {
    const res = await authFetch('/projects', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, name, localPath, githubRepo }),
    });
    return res.json();
  },
  delete: async (id: string): Promise<void> => {
    await authFetch(`/projects/${id}`, {
      method: 'DELETE',
    });
  }
};

export const boardsApi = {
  create: async (projectId: string, name: string): Promise<Board> => {
    const res = await authFetch('/boards', {
      method: 'POST',
      body: JSON.stringify({ projectId, name }),
    });
    return res.json();
  }
};

export const columnsApi = {
  create: async (boardId: string, name: string, position: number, color?: string): Promise<Column> => {
    const res = await authFetch('/columns', {
      method: 'POST',
      body: JSON.stringify({ boardId, name, position, color }),
    });
    return res.json();
  },
  getByBoard: async (boardId: string): Promise<Column[]> => {
    const res = await authFetch(`/columns?boardId=${boardId}`);
    return res.json();
  }
};
