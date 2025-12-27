const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '/api';

export const apiClient = {
  async register(username: string, password: string, manifesto: string, stats: any, originStory: string) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, manifesto, stats, originStory })
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  async login(username: string, password: string) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!response.ok) throw new Error('Invalid credentials');
    return response.json();
  },

  async getProfile(id: string) {
    const response = await fetch(`${API_URL}/profile/${id}`);
    if (!response.ok) throw new Error('Profile not found');
    return response.json();
  },

  async updateProfile(id: string, data: any) {
    const response = await fetch(`${API_URL}/profile/${id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Update failed');
    return response.json();
  },

  async generateMysteriousName() {
    const response = await fetch(`${API_URL}/ai/mysterious-name`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to generate name');
    const data = await response.json();
    return data.name;
  }
};
