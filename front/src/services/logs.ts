import { authFetch } from './api';

export interface SystemLog {
  id: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'USAGE';
  module: string;
  message: string;
  metadata?: any;
  userId?: string;
  createdAt: string;
}

export async function getLogs(level?: string): Promise<SystemLog[]> {
  const query = level ? `?level=${level}` : '';
  const res = await authFetch(`/logs${query}`);
  return res.json();
}

export async function getLogStats(): Promise<{ tokensToday: number, aiCallsToday: number, errorsToday: number }> {
  const res = await authFetch('/logs/stats');
  return res.json();
}
