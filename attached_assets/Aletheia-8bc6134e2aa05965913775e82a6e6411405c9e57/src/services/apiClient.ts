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

  async calculateFeat(text: string, userId: string, stats: any) {
    try {
      const response = await fetch(`${API_URL}/achievements/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userId, stats })
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

  async generateQuests(userId: string, stats: any, goals: string[] = []) {
    try {
      const response = await fetch(`${API_URL}/ai/quest/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, stats, goals })
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
  },

  async getComments(post_id: string) {
    try {
      const response = await fetch(`${API_URL}/posts/${post_id}/comments`);
      return handleResponse(response);
    } catch (error: any) {
      console.error('Get comments error:', error);
      throw error;
    }
  },

  async createComment(post_id: string, author_id: string, content: string, parent_id?: number) {
    try {
      const response = await fetch(`${API_URL}/posts/${post_id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_id, content, parent_id })
      });
      return handleResponse(response);
    } catch (error: any) {
      console.error('Create comment error:', error);
      throw error;
    }
  },

  async getNotifications(userId: string) {
    try {
      const response = await fetch(`${API_URL}/notifications/${userId}`);
      return handleResponse(response);
    } catch (error: any) {
      console.error('Get notifications error:', error);
      throw error;
    }
  },

  async markNotificationRead(id: number) {
    try {
      const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'POST'
      });
      return handleResponse(response);
    } catch (error: any) {
      console.error('Mark notification read error:', error);
      throw error;
    }
  },

  async reportPost(reporterId: string, targetUserId: string, targetPostId: number, reason: string) {
    try {
      const response = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reporterId, targetUserId, targetPostId, reason })
      });
      return handleResponse(response);
    } catch (error: any) {
      console.error('Report post error:', error);
      throw error;
    }
  },

  async followUser(followerId: string, targetId: string) {
    try {
      const response = await fetch(`${API_URL}/profile/${targetId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId })
      });
      return handleResponse(response);
    } catch (error: any) {
      console.error('Follow user error:', error);
      throw error;
    }
  },
  async getHabits(userId: string) {
    try {
      const response = await fetch(`${API_URL}/habits/${userId}`);
      return handleResponse(response);
    } catch (error: any) {
      console.error('Get habits error:', error);
      throw error;
    }
  },
  async createHabit(userId: string, name: string) {
    try {
      const response = await fetch(`${API_URL}/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name })
      });
      return handleResponse(response);
    } catch (error: any) {
      console.error('Create habit error:', error);
      throw error;
    }
  },
  async trackHabit(userId: string, habitId: number, action: string) {
    try {
      const response = await fetch(`${API_URL}/habits/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, habitId, action })
      });
      return handleResponse(response);
    } catch (error: any) {
      console.error('Track habit error:', error);
      throw error;
    }
  }
};
