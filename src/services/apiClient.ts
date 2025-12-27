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
  },

  async generateQuest(stats: any) {
    try {
      const response = await fetch(`${API_URL}/ai/quest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats })
      });
      return handleResponse(response);
    } catch (error: any) {
      console.error('Generate quest error:', error);
      throw error;
    }
  },

  async calculateFeat(feat: string) {
    try {
      const response = await fetch(`${API_URL}/ai/feat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feat })
      });
      return handleResponse(response);
    } catch (error: any) {
      console.error('Calculate feat error:', error);
      throw error;
    }
  },

  async analyzeIdentity(manifesto: string) {
    try {
      const response = await fetch(`${API_URL}/ai/identity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifesto })
      });
      return handleResponse(response);
    } catch (error: any) {
      console.error('Identity analysis error:', error);
      throw error;
    }
  },

  async getDailyWisdom() {
    try {
      const response = await fetch(`${API_URL}/ai/wisdom`);
      return handleResponse(response);
    } catch (error: any) {
      console.error('Daily wisdom error:', error);
      throw error;
    }
  },

  async askAdvisor(type: string, message: string, userId: string) {
    try {
      const response = await fetch(`${API_URL}/ai/advisor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message, userId })
      });
      return handleResponse(response);
    } catch (error: any) {
      console.error('Advisor error:', error);
      throw error;
    }
  },

  async getQuests(userId: string) {
    try {
      const response = await fetch(`${API_URL}/quests/${userId}`);
      return handleResponse(response);
    } catch (error: any) {
      console.error('Get quests error:', error);
      throw error;
    }
  },

  async generateQuests(userId: string, stats: any, recentAchievements?: string) {
    try {
      const response = await fetch(`${API_URL}/ai/quest/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, stats, recentAchievements })
      });
      return handleResponse(response);
    } catch (error: any) {
      console.error('Generate quests error:', error);
      throw error;
    }
  },

  async completeQuest(id: number) {
    try {
      const response = await fetch(`${API_URL}/quests/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return handleResponse(response);
    } catch (error: any) {
      console.error('Complete quest error:', error);
      throw error;
    }
  },

  async generateMirrorScenario(stats: any) {
    try {
      const response = await fetch(`${API_URL}/ai/mirror/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats })
      });
      return handleResponse(response);
    } catch (error: any) {
      console.error('Mirror scenario error:', error);
      throw error;
    }
  },

  async evaluateMirrorChoice(situation: string, choice: string) {
    try {
      const response = await fetch(`${API_URL}/ai/mirror/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation, choice })
      });
      return handleResponse(response);
    } catch (error: any) {
      console.error('Mirror evaluation error:', error);
      throw error;
    }
  },

  async generateArtifactImage(name: string, description: string) {
    try {
      const response = await fetch(`${API_URL}/ai/image/artifact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      });
      return handleResponse(response);
    } catch (error: any) {
      console.error('Artifact image error:', error);
      throw error;
    }
  },

  async getPosts() {
    try {
      const response = await fetch(`${API_URL}/posts`);
      return handleResponse(response);
    } catch (error: any) {
      console.error('Get posts error:', error);
      throw error;
    }
  },

  async createPost(author_id: string, content: string) {
    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_id, content })
      });
      return handleResponse(response);
    } catch (error: any) {
      console.error('Create post error:', error);
      throw error;
    }
  },

  async toggleLikePost(post_id: number, user_id: string) {
    try {
      const response = await fetch(`${API_URL}/posts/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id, user_id })
      });
      return handleResponse(response);
    } catch (error: any) {
      console.error('Like post error:', error);
      throw error;
    }
  }
};
