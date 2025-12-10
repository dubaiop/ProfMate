import { GoogleGenAI, Type, Schema, LiveServerMessage, Modality, Chat } from "@google/genai";
import { DifficultyLevel, LessonContent, Quiz } from "../types";

// --- Config ---
const MODEL_TEXT = "gemini-2.5-flash";
const MODEL_VIDEO = "veo-3.1-fast-generate-preview";
const MODEL_LIVE = "gemini-2.5-flash-native-audio-preview-09-2025";

// --- Helpers ---
const getAI = (apiKey?: string) => new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });

// --- Text Generation ---

export const generateLesson = async (
  fileData: string,
  mimeType: string,
  difficulty: DifficultyLevel
): Promise<LessonContent> => {
  const ai = getAI();
  
  let promptPrefix = "";
  switch (difficulty) {
    case DifficultyLevel.ELI5:
      promptPrefix = "Explain this like I am 5 years old. Use simple analogies.";
      break;
    case DifficultyLevel.DEEP_DIVE:
      promptPrefix = "Provide a PhD-level deep dive analysis. Focus on nuance, theoretical frameworks, and advanced implications.";
      break;
    default:
      promptPrefix = "Act as a university professor. Be clear, structured, and academic.";
      break;
  }

  const prompt = `
    ${promptPrefix}
    Analyze the attached document. Create a structured lesson plan.
    Ensure each section includes detailed explanations and at least one real-world example to illustrate the concept.
    Return JSON format adhering to this schema.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_TEXT,
    contents: {
      parts: [
        { inlineData: { mimeType, data: fileData } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                heading: { type: Type.STRING },
                content: { type: Type.STRING },
                keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["heading", "content", "keyPoints"]
            }
          }
        },
        required: ["title", "summary", "sections"]
      }
    }
  });

  if (!response.text) throw new Error("No response generated");
  return JSON.parse(response.text) as LessonContent;
};

export const generateQuiz = async (lessonContext: string): Promise<Quiz> => {
  const ai = getAI();
  const prompt = "Generate a quiz based on the following lesson content. Create 5 multiple choice questions.";
  
  const response = await ai.models.generateContent({
    model: MODEL_TEXT,
    contents: {
      parts: [{ text: lessonContext }, { text: prompt }]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.INTEGER, description: "Index of the correct option (0-based)" },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctAnswer", "explanation"]
            }
          }
        },
        required: ["title", "questions"]
      }
    }
  });

  if (!response.text) throw new Error("No quiz generated");
  return JSON.parse(response.text) as Quiz;
};

// --- Chat Service ---

export const createChatSession = (lesson: LessonContent): Chat => {
  const ai = getAI();
  const context = `
    You are ProfMate, an intelligent AI professor.
    You are teaching a lesson titled: "${lesson.title}".
    Summary: ${lesson.summary}
    
    Content Reference:
    ${lesson.sections.map(s => `Section: ${s.heading}\n${s.content}\nKey Points: ${s.keyPoints.join(', ')}`).join('\n\n')}
    
    Instructions:
    - Answer the student's questions based on the content above.
    - If the answer is not in the text, use your general knowledge but mention it's outside the provided document.
    - Be helpful, encouraging, and concise.
  `;

  return ai.chats.create({
    model: MODEL_TEXT,
    config: {
      systemInstruction: context,
    }
  });
};

// --- Video Generation (Veo) ---

export const generateEducationalVideo = async (topic: string): Promise<string> => {
  // Ensure Key Selection for Veo
  // @ts-ignore
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
     // @ts-ignore
     const hasKey = await window.aistudio.hasSelectedApiKey();
     if (!hasKey) {
       // @ts-ignore
        await window.aistudio.openSelectKey();
        // Assume success or throw error if user cancels (not handled here for simplicity)
     }
  }

  // Create new instance to pick up the potentially selected key
  const ai = getAI();

  let operation = await ai.models.generateVideos({
    model: MODEL_VIDEO,
    prompt: `Educational video explaining: ${topic}. Clear visuals, academic style, smooth motion.`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!uri) throw new Error("Failed to generate video URI");
  
  return `${uri}&key=${process.env.API_KEY}`;
};


// --- Live API (Audio/Voice) ---

export class LiveTutorClient {
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  
  // Callbacks
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (err: any) => void;
  onVolumeLevel?: (level: number) => void; // For visualization

  constructor() {}

  async connect(systemInstruction: string) {
    const ai = getAI();
    
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    this.sessionPromise = ai.live.connect({
      model: MODEL_LIVE,
      callbacks: {
        onopen: () => {
          this.onConnect?.();
          this.startAudioInput(stream);
        },
        onmessage: (msg: LiveServerMessage) => this.handleMessage(msg),
        onclose: () => this.onDisconnect?.(),
        onerror: (err) => this.onError?.(err),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
        },
        systemInstruction: systemInstruction,
      },
    });
  }

  private startAudioInput(stream: MediaStream) {
    if (!this.inputAudioContext) return;
    
    const source = this.inputAudioContext.createMediaStreamSource(stream);
    const processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Simple volume meter for visual feedback
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
      const rms = Math.sqrt(sum / inputData.length);
      this.onVolumeLevel?.(rms);

      const pcmBlob = this.createBlob(inputData);
      this.sessionPromise?.then(session => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    source.connect(processor);
    processor.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    const audioStr = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioStr && this.outputAudioContext) {
      this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
      
      const audioBuffer = await this.decodeAudioData(
        this.decode(audioStr),
        this.outputAudioContext,
        24000,
        1
      );
      
      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioContext.destination);
      source.addEventListener('ended', () => this.sources.delete(source));
      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.sources.add(source);
    }
  }

  async disconnect() {
    this.sources.forEach(s => s.stop());
    this.sources.clear();
    await this.inputAudioContext?.close();
    await this.outputAudioContext?.close();
    // No explicit close method on sessionPromise result in SDK, usually closing websocket/context is enough or session.close() if exposed
    // Assuming standard cleanup
    this.sessionPromise?.then((session: any) => {
       if(session.close) session.close();
    });
    this.sessionPromise = null;
  }

  // --- Utils from Guide ---
  private createBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    return {
      data: this.encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  private encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  private decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let c = 0; c < numChannels; c++) {
      const chData = buffer.getChannelData(c);
      for (let i = 0; i < frameCount; i++) chData[i] = dataInt16[i * numChannels + c] / 32768.0;
    }
    return buffer;
  }
}