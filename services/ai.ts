import { GoogleGenAI } from "@google/genai";
import { Theme } from "../types";

// Helper to get API key from Env or LocalStorage
const getApiKey = () => {
  // Priority: 1. Environment Variable (Deployment) 2. LocalStorage (User Input)
  return process.env.API_KEY || localStorage.getItem('gemini_api_key') || '';
};

const getAiClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("API Key is missing.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const sendMessageToGemini = async (history: {role: string, parts: {text: string}[]}[], newMessage: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "API 키가 설정되지 않았어요. 우측 상단 설정(⚙️)에서 키를 입력해주세요.";

  try {
    const model = 'gemini-2.5-flash';
    const chat = ai.chats.create({
        model,
        history: history,
        config: {
            systemInstruction: "당신은 초등학교 4-6학년 학생들을 위한 친절한 미술 선생님 보조 AI입니다. 학생이 작품을 올리면 칭찬하고, 프롬프트를 물어보세요. 답변은 3문장 이내로 다정하게 해주세요.",
        }
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "답변을 생성하지 못했어요.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "미안해, 잠시 후에 다시 시도해줘!";
  }
};

export const analyzeImageWithGemini = async (base64Image: string, promptText: string): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "API 키가 설정되지 않았어요. 우측 상단 설정(⚙️)에서 키를 입력해주세요.";

    try {
        const cleanBase64 = base64Image.split(',')[1] || base64Image;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                    { text: promptText }
                ]
            }
        });
        return response.text || "그림을 잘 봤어!";
    } catch (error) {
        console.error("Gemini Vision Error:", error);
        throw error;
    }
};

// New function to generate theme colors based on description
export const generateThemeFromDescription = async (description: string): Promise<Theme> => {
  const ai = getAiClient();
  // Default fallback theme
  const defaultTheme: Theme = {
    id: 'custom',
    name: description,
    background: 'bg-slate-50',
    textColor: '#1e293b',
    accentColor: '#4f46e5',
    cardBg: '#ffffff'
  };

  if (!ai) return defaultTheme;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a color theme for a portfolio website based on this vibe: "${description}".
      Return ONLY a JSON object with these fields:
      - background: a valid CSS linear-gradient string (e.g., "linear-gradient(to right, #ff0000, #00ff00)") or a solid hex color. Make it light enough for text readability or provide a dark background with light text.
      - textColor: a hex color code for the main text (contrast with background).
      - accentColor: a hex color code for buttons and highlights.
      - cardBg: a hex color code for item cards (usually white or slightly transparent white/black).
      
      Do not wrap in markdown code blocks.`,
    });

    const text = response.text.replace(/```json|```/g, '').trim();
    const json = JSON.parse(text);

    return {
      id: `custom-${Date.now()}`,
      name: description,
      background: json.background,
      textColor: json.textColor,
      accentColor: json.accentColor,
      cardBg: json.cardBg
    };
  } catch (error) {
    console.error("Theme Gen Error:", error);
    return defaultTheme;
  }
};