import { authFetch } from './api';

export interface Project {
  id: string;
  name: string;
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
}

export const projectsApi = {
  getAll: async (workspaceId: string): Promise<Project[]> => {
    const res = await authFetch(`/projects?workspaceId=${workspaceId}`);
    return res.json();
  },
  create: async (workspaceId: string, name: string): Promise<Project> => {
    const res = await authFetch('/projects', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, name }),
    });
    return res.json();
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
