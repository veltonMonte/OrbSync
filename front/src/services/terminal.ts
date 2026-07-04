import { authFetch } from './api';

export const terminalService = {
  getInfo: async (): Promise<{ username: string; hostname: string; cwd: string }> => {
    const response = await authFetch('/terminal/info');
    return response.json();
  },

  executeCommand: async (command: string): Promise<{ stdout: string; stderr: string; error?: string; cwd?: string }> => {
    const response = await authFetch('/terminal/execute', {
      method: 'POST',
      body: JSON.stringify({ command })
    });
    return response.json();
  }
};
