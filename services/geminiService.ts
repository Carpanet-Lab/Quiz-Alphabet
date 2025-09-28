
import { GoogleGenAI, Type } from "@google/genai";
import type { ExampleWord } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const getExampleWord = async (letter: string): Promise<ExampleWord | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Pour la lettre française '${letter}', donne-moi un mot simple qui commence par cette lettre et une phrase d'exemple très courte pour un débutant. Formate la réponse en JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mot: {
              type: Type.STRING,
              description: "Un mot français simple commençant par la lettre donnée."
            },
            phrase: {
              type: Type.STRING,
              description: "Une phrase d'exemple très courte utilisant le mot."
            },
          },
          required: ["mot", "phrase"],
        },
      },
    });

    const jsonString = response.text.trim();
    const parsedJson = JSON.parse(jsonString);
    return parsedJson as ExampleWord;

  } catch (error) {
    console.error("Error fetching example word from Gemini API:", error);
    return null;
  }
};
