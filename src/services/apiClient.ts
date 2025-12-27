const API_URL = '/api';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    } catch (e) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
  return response.json();
};

export const apiClient = {
  async register(username: string, password: string, manifesto: string, stats: any, originStory: string) {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, manifesto, stats, originStory })
      });
      return handleResponse(response);
    } catch (error: any) {
      console.error('Register error:', error);
      throw error;
    }
  },

  async login(username: string, password: string) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      return handleResponse(response);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error('Invalid credentials');
    }
  },

  async getProfile(id: string) {
    try {
      const response = await fetch(`${API_URL}/profile/${id}`);
      return handleResponse(response);
    } catch (error: any) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  async updateProfile(id: string, data: any) {
    try {
      const response = await fetch(`${API_URL}/profile/${id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return handleResponse(response);
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  async generateMysteriousName() {
    try {
      const response = await fetch(`${API_URL}/ai/mysterious-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await handleResponse(response);
      return data.name;
    } catch (error: any) {
      console.error('Generate name error:', error);
      throw error;
    }
  }
};
