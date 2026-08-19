import { authFetch } from './api';

export interface WhatsappStatusResponse {
  instance?: {
    state?: 'open' | 'connecting' | 'close';
  };
}

export interface QrCodeResponse {
  pairingCode?: string;
  code?: string;
  base64?: string;
  qrcode?: {
    pairingCode?: string;
    code?: string;
    base64?: string;
  };
  instance?: {
    instanceName?: string;
    state?: 'open' | 'connecting' | 'close';
  };
}

export const whatsappApi = {
  /**
   * Creates a WhatsApp instance in backend
   */
  async createInstance(instanceName: string) {
    const res = await authFetch('/whatsapp/instance/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ instanceName }),
    });
    return res.json();
  },

  /**
   * Fetches QR code Base64 / Pairing Code for connecting WhatsApp
   */
  async getQrCode(instanceName: string): Promise<QrCodeResponse> {
    const res = await authFetch(`/whatsapp/instance/connect/${instanceName}`);
    return res.json();
  },

  /**
   * Checks status of WhatsApp connection
   */
  async getStatus(instanceName: string): Promise<WhatsappStatusResponse> {
    const res = await authFetch(`/whatsapp/instance/status/${instanceName}`);
    return res.json();
  },

  /**
   * Disconnects / Logouts WhatsApp instance
   */
  async logout(instanceName: string) {
    const res = await authFetch(`/whatsapp/instance/logout/${instanceName}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  /**
   * Sends a test text message via WhatsApp
   */
  async sendTestMessage(instanceName: string, to: string, text: string) {
    const res = await authFetch('/whatsapp/send-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ instanceName, to, text }),
    });
    return res.json();
  },

};
