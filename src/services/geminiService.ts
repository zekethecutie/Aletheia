
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { UserStats, FeatResponse, SearchResult, MirrorScenario, MirrorResult, Artifact, DailyTask } from "../types";

const TEXT_MODEL = 'gemini-1.5-flash';
const IMAGE_MODEL = 'gemini-1.5-flash';

// Lazy initialization - get API key at runtime, not module load time
let cachedAI: GoogleGenAI | null = null;

const getAI = () => {
  if (cachedAI) return cachedAI;
  
  const apiKey = import.meta.env.VITE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || "dummy";
  
  cachedAI = new GoogleGenAI({ apiKey });
  return cachedAI;
};

// Add missing generateMysteriousName function
export const generateMysteriousName = async (): Promise<string> => {
  try {
    const aiInstance = getAI();
    const response = await aiInstance.models.generateContent({
      model: TEXT_MODEL,
      contents: "Generate a single mysterious RPG-style name (e.g., Kaelen, Vyr, Sylas). Just the name.",
    });
    return response.text?.trim() || "Initiate";
  } catch (e) {
    console.warn("AI Name Generation failed:", e);
    return "Initiate";
  }
};

export const generateMirrorScenario = async (stats: UserStats): Promise<MirrorScenario> => {
  try {
    const aiInstance = getAI();
    const response = await aiInstance.models.generateContent({
      model: TEXT_MODEL,
      contents: `Create a psychological dilemma for a user with these stats: ${JSON.stringify(stats)}.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            situation: { type: Type.STRING },
            choiceA: { type: Type.STRING },
            choiceB: { type: Type.STRING },
            context: { type: Type.STRING },
            testedStat: { type: Type.STRING }
          },
          required: ["situation", "choiceA", "choiceB", "context", "testedStat"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { situation: "A fork in the road.", choiceA: "Left", choiceB: "Right", context: "Void", testedStat: "spirit" };
  }
};

export const generateArtifactImage = async (name: string, description: string): Promise<string | undefined> => {
  try {
    const aiInstance = getAI();
    const response = await aiInstance.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [{ text: `Mystical pixel art RPG item, 32-bit style, sharp edges, vivid colors, solid black background, no transparency. Subject: ${name}. Context: ${description}. High contrast fantasy item.` }]
      }
    });
    if (response.candidates) {
      for (const candidate of response.candidates) {
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
    }
  } catch (e) { console.error(e); }
  return undefined;
};

export const getDailyWisdom = async (): Promise<{ text: string; author: string }> => {
  try {
    const aiInstance = getAI();
    const response = await aiInstance.models.generateContent({
      model: TEXT_MODEL,
      contents: `Generate a profound short philosophical quote. JSON format.`,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: { text: { type: Type.STRING }, author: { type: Type.STRING } },
          required: ["text", "author"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) { return { text: "Stare into the void.", author: "The Council" }; }
};

export const submitApplication = async (manifesto: string): Promise<{ approved: boolean; reason: string; initialStats: UserStats }> => {
  const prompt = `Analyze this manifesto: "${manifesto}". Assign level 1 stats and a class. Be poetic.`;
  try {
    const aiInstance = getAI();
    const response = await aiInstance.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            approved: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
            initialStats: {
              type: Type.OBJECT,
              properties: {
                level: { type: Type.NUMBER },
                xp: { type: Type.NUMBER },
                xpToNextLevel: { type: Type.NUMBER },
                intellect: { type: Type.NUMBER },
                discipline: { type: Type.NUMBER },
                spirit: { type: Type.NUMBER },
                strength: { type: Type.NUMBER },
                wealth: { type: Type.NUMBER },
                class: { type: Type.STRING }
              },
              required: ["level", "xp", "xpToNextLevel", "intellect", "discipline", "spirit", "strength", "wealth", "class"]
            }
          },
          required: ["approved", "reason", "initialStats"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { approved: true, reason: "The void accepts your silence.", initialStats: { level: 1, xp: 0, xpToNextLevel: 100, intellect: 5, discipline: 5, spirit: 5, strength: 5, wealth: 5, class: "Seeker" } };
  }
};

export const evaluateMirrorChoice = async (scenario: MirrorScenario, choice: 'A' | 'B'): Promise<MirrorResult> => {
  try {
    const aiInstance = getAI();
    const response = await aiInstance.models.generateContent({
      model: TEXT_MODEL,
      contents: `Scenario: ${scenario.situation}. Choice: ${choice}. Evaluator result.`,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            outcome: { type: Type.STRING },
            statChange: { type: Type.OBJECT, properties: { xp: { type: Type.NUMBER } }, required: ["xp"] },
            reward: {
              type: Type.OBJECT,
              properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, rarity: { type: Type.STRING }, effect: { type: Type.STRING }, icon: { type: Type.STRING } },
              required: ["name", "description", "rarity", "effect", "icon"]
            }
          },
          required: ["outcome", "statChange"]
        }
      }
    });
    const res = JSON.parse(response.text || '{}');
    if (res.reward) {
        res.reward.id = Date.now().toString();
        res.reward.imageUrl = await generateArtifactImage(res.reward.name, res.reward.description);
    }
    return res;
  } catch (e) { return { outcome: "Fate ripples.", statChange: { xp: 10 } }; }
};

export const createAdvisorSession = (type: string): Chat | null => {
  try {
    const aiInstance = getAI();
    return aiInstance.chats.create({
      model: TEXT_MODEL,
      config: { systemInstruction: `You are a ${type} advisor. Keep it short, mystical, and practical.` }
    });
  } catch (e) {
    console.warn("Could not create advisor session:", e);
    return null;
  }
};

export const askAdvisor = async (chat: Chat | null, message: string): Promise<string> => {
  if (!chat) return "The advisor is currently silent. (Check API Key)";
  try {
    const result = await chat.sendMessage({ message });
    return result.text || "...";
  } catch (e) {
    return "The transmission was lost in the void.";
  }
};

export const generateQuest = async (stats: UserStats): Promise<DailyTask> => {
  try {
    const aiInstance = getAI();
    const response = await aiInstance.models.generateContent({
      model: TEXT_MODEL,
      contents: `Quest for ${stats.class} lvl ${stats.level}.`,
      config: { responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, difficulty: { type: Type.STRING } }, required: ["text", "difficulty"] } }
    });
    const res = JSON.parse(response.text || '{}');
    return { id: Date.now().toString(), text: res.text, completed: false, type: 'DAILY', difficulty: res.difficulty };
  } catch (e) {
    return { id: Date.now().toString(), text: "Gaze into the void.", completed: false, type: 'DAILY', difficulty: 'E' };
  }
};

export const calculateFeat = async (feat: string, stats: UserStats): Promise<FeatResponse> => {
  try {
    const aiInstance = getAI();
    const response = await aiInstance.models.generateContent({
      model: TEXT_MODEL,
      contents: `Feat: ${feat}. Stats: ${JSON.stringify(stats)}. Calculate XP and stat gains.`,
      config: { 
        responseMimeType: 'application/json', 
        responseSchema: { 
          type: Type.OBJECT, 
          properties: { 
            xpGained: { type: Type.NUMBER }, 
            statsIncreased: { type: Type.OBJECT }, 
            systemMessage: { type: Type.STRING } 
          }, 
          required: ["xpGained", "statsIncreased", "systemMessage"] 
        } 
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { xpGained: 10, statsIncreased: {}, systemMessage: "The void acknowledges your effort." };
  }
};
