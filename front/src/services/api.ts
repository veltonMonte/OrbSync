export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function authFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('fluxionai_access_token');
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Só define Content-Type para JSON se o body NÃO for FormData.
  // FormData precisa que o browser auto-defina o boundary no Content-Type.
  const isFormData = options.body instanceof FormData;
  if (!headers.has('Content-Type') && !isFormData) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
  }


  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const refreshToken = localStorage.getItem('fluxionai_refresh_token');
    
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem('fluxionai_access_token', data.accessToken);
          
          // Refazer a requisição original com o novo token
          headers.set('Authorization', `Bearer ${data.accessToken}`);
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
          
          // Retornar o retry response diretamente — se não for ok,
          // deixar o handler de erro abaixo tratar normalmente.
          if (retryResponse.ok) {
            return retryResponse;
          }
          
          // Retry falhou com status não-ok: tratar erro usando o retryResponse (não o original)
          const retryError = await retryResponse.json().catch(() => ({ message: retryResponse.statusText }));
          throw new Error(retryError.message || 'Erro na requisição após renovação de token');
        }
      } catch (e) {
        // Se o erro já é nosso throw de cima, re-lançar
        if (e instanceof Error && e.message !== 'Erro ao renovar o token') {
          throw e;
        }
        console.error("Erro ao renovar o token", e);
      }
    }
    
    // Se não tiver refresh token ou se a renovação falhar, desloga o usuário
    localStorage.removeItem('fluxionai_user');
    localStorage.removeItem('fluxionai_access_token');
    localStorage.removeItem('fluxionai_refresh_token');
    window.location.href = '/login';
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Erro na requisição');
  }

  return response;
}
