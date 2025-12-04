import { GoogleGenAI, Type } from "@google/genai";
import { Task } from "../types";

// Initialize Gemini Client
// Note: API Key is injected via process.env.API_KEY as per instructions
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Breaks down a complex task into smaller, actionable subtasks using Gemini.
 */
export const generateSubtasks = async (taskTitle: string, taskDescription?: string): Promise<string[]> => {
  try {
    const prompt = `
      I am a college student. I have a task: "${taskTitle}".
      ${taskDescription ? `Description: "${taskDescription}"` : ''}
      
      Please break this task down into 3 to 6 smaller, concrete, actionable steps that I can check off. 
      Keep them concise.
    `;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.STRING
      }
    };

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are an expert academic productivity coach. Your goal is to reduce student overwhelm by breaking big tasks into small, manageable wins."
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    
    const subtasks = JSON.parse(jsonText);
    return Array.isArray(subtasks) ? subtasks : [];
  } catch (error) {
    console.error("Error generating subtasks:", error);
    return [];
  }
};

/**
 * Generates a quick motivational tip or specific advice based on the current task list.
 */
export const getSmartAdvice = async (tasks: Task[]): Promise<string> => {
  try {
    // Filter to only include pending high priority tasks to save tokens and focus context
    const pendingTasks = tasks.filter(t => !t.completed).map(t => `${t.title} (Priority: ${t.priority})`).slice(0, 10);
    
    if (pendingTasks.length === 0) return "You're all caught up! Great job. Time to relax or get ahead on reading.";

    const prompt = `
      Here are my current tasks:
      ${JSON.stringify(pendingTasks)}
      
      Give me one sentence of specific, punchy advice on what to tackle first or how to start.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        maxOutputTokens: 60,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "Focus on one thing at a time. You got this.";
  } catch (error) {
    return "Keep pushing forward!";
  }
};