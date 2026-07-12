const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ff_token') : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api${endpoint}`, { ...options, headers });

  if (!res.ok) {
    if (res.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ff_token');
        localStorage.removeItem('ff_user');
        window.location.href = '/';
      }
    }
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const BASE_URL_DIRECT = BASE_URL;

export const api = {
  auth: {
    login: (body: { email: string; password: string }) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    register: (body: { username: string; email: string; password: string }) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request('/auth/me'),
    update: (body: { username?: string; oldPassword?: string; newPassword?: string }) =>
      request('/auth/update', { method: 'PUT', body: JSON.stringify(body) }),
  },
  projects: {
    list: () => request('/projects'),
    get: (id: string) => request(`/projects/${id}`),
    create: (body: { name: string; description?: string }) =>
      request('/projects', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) =>
      request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request(`/projects/${id}`, { method: 'DELETE' }),
  },
  workflows: {
    list: (projectId: string) => request(`/projects/${projectId}/workflows`),
    get: (id: string) => request(`/workflows/${id}`),
    create: (projectId: string, body: any) =>
      request(`/projects/${projectId}/workflows`, { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) =>
      request(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request(`/workflows/${id}`, { method: 'DELETE' }),
    publish: (id: string, isPublished: boolean) =>
      request(`/workflows/${id}/publish`, { method: 'POST', body: JSON.stringify({ isPublished }) }),
    gatewayConfig: (id: string) => request(`/workflows/${id}/gateway-config`),
    updateGatewayConfig: (id: string, body: any) =>
      request(`/workflows/${id}/gateway-config`, { method: 'PUT', body: JSON.stringify(body) }),
  },
  analytics: {
    get: (projectId: string, params?: { workflowId?: string; range?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request(`/projects/${projectId}/analytics${q ? '?' + q : ''}`);
    },
    logs: (projectId: string, params?: { workflowId?: string; limit?: number; page?: number; status?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request(`/projects/${projectId}/logs${q ? '?' + q : ''}`);
    },
  },
  services: {
    list: (projectId: string) => request(`/projects/${projectId}/services`),
    create: (projectId: string, body: any) =>
      request(`/projects/${projectId}/services`, { method: 'POST', body: JSON.stringify(body) }),
    update: (projectId: string, serviceId: string, body: any) =>
      request(`/projects/${projectId}/services/${serviceId}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (projectId: string, serviceId: string) =>
      request(`/projects/${projectId}/services/${serviceId}`, { method: 'DELETE' }),
    createRoute: (projectId: string, serviceId: string, body: any) =>
      request(`/projects/${projectId}/services/${serviceId}/routes`, { method: 'POST', body: JSON.stringify(body) }),
    deleteRoute: (projectId: string, serviceId: string, routeId: string) =>
      request(`/projects/${projectId}/services/${serviceId}/routes/${routeId}`, { method: 'DELETE' }),
  },
  exporter: {
    exportProject: (projectId: string, pushToGit: boolean) =>
      request(`/projects/${projectId}/export`, { method: 'POST', body: JSON.stringify({ pushToGit }) }),
    getJobStatus: (projectId: string, jobId: string) =>
      request(`/projects/${projectId}/export/status/${jobId}`),
    getDownloadUrl: (projectId: string) => `${BASE_URL}/api/projects/${projectId}/export/download`,
    getPreview: (projectId: string) => request(`/projects/${projectId}/export/preview`),
  },
  git: {
    getConfig: () => request('/git-config'),
    saveConfig: (body: any) =>
      request('/git-config', { method: 'POST', body: JSON.stringify(body) }),
  },
  ai: {
    generateWorkflow: (prompt: string) =>
      request('/ai/generate-workflow', { method: 'POST', body: JSON.stringify({ prompt }) }),
  },
};
