import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Dynamic initialization of GoogleGenAI per key
function getGeminiClient(userKey?: string): GoogleGenAI {
  const key = userKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is missing. Please configure your API key in the settings.");
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const DEFAULT_MODELS_FALLBACK = ["gemini-3-flash-preview", "gemini-3-pro-preview", "gemini-2.5-flash"];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API endpoint for evaluating user speech
  app.post("/api/evaluate", async (req, res) => {
    try {
      const { transcript, questionText, part, level, username, model } = req.body;
      
      if (!transcript || !transcript.trim()) {
        return res.status(400).json({ error: "Transcript text cannot be empty." });
      }
      if (!questionText || !questionText.trim()) {
        return res.status(400).json({ error: "Question text is required." });
      }

      const userKey = req.headers["x-gemini-key"] as string | undefined;

      // Check if Vietnamese content is submitted to handle appropriately
      const hasVietnamese = /[\u00C0-\u1EF9]/gi.test(transcript);

      const prompt = `
        User Name: ${username || "Learner"}
        User Current CEFR Level: ${level || "B1"}
        IELTS Part: Part ${part || 1}
        Practice Question: "${questionText}"
        User Spoken Response Transcript: "${transcript}"
        Contains Vietnamese Characters: ${hasVietnamese ? "Yes" : "No"}

        Evaluate this speaking response. Apply strict, high IELTS grading standards.
      `;

      const systemInstruction = `You are the IELTS Speaking Excellence Coach, an elite IELTS examiner and senior tutor.
Your core objectives are to:
1. Accurately assess the user's transcripted spoken responses based on CEFR levels and the 4 official IDP/British Council criteria: Fluency and Coherence (FC), Lexical Resource (LR), Grammatical Range and Accuracy (GRA), and Pronunciation (P).
2. Upgrade the user's language by offering ideas, collocations, and natural academic sentences.
3. Personalize assessment based on the user's level (A1 to C1).
4. Always address the user directly by their name ("${username || "Learner"}") when providing comments, feedback, or corrections (e.g., "Excellent start, ${username || "Learner"}!", "${username || "Learner"}, you should focus on...").
5. Operate entirely in English (100% standard English). Never use Vietnamese in the evaluation response. If the transcript is in Vietnamese or mostly contains Vietnamese text, you must still output English but give a 1.0 score and politely remind them in English (within the criterion comments) that this is a 100% English speaking environment and they must speak in English to be evaluated.

Strict Scoring Guidelines:
- Band scores must strictly fall between 1.0 and 9.0 (increments of 0.5: e.g., 5.0, 5.5, 6.0, 6.5, etc.) for each of the 4 criteria and overall.
- Point out specific errors from the transcript. For each error, provide the incorrect phrase, the correction, and a brief grammar/vocabulary explanation. If no errors are found, return an empty errorsIdentified array.

Strict Level-Appropriate Suggestions (No Over-grading):
- Tailor the suggested improvements (Better Way) to be slightly higher, but NOT too far from their current level (aim for +0.5 to +1.0 band increase):
  * If current level is A1 or A2 (Basic): Suggest improvements aiming for B1/B2 level. Focus on fixing basic verb tenses, simple subject-verb agreements, and clear connectors (e.g., "but", "because", "and", "so"). Do NOT suggest high-level academic idioms or complex clauses.
  * If current level is B1 or B2 (Independent): Suggest improvements aiming for B2/C1 level. Focus on typical academic connectors (e.g., "however", "consequently", "moreover"), vocabulary variety, and complex sentence structures.
  * If current level is C1 (Proficient): Suggest improvements aiming for C1/C2 level. Focus on precise idiomatic usage, native-like phrasing, and subtle rhetorical styling.

- Suggest 2-3 sentence improvements showing how they can "upgrade" their expression (Original vs Better Way).
- Provide 3-5 relevant high-scoring key collocations with meanings and sample usage sentences.
- Provide a full high-scoring (Band 8.5+) sample response matching the question being practiced.
- Provide a todayLearningPoint takeaway representing what the user should focus on next.
- Give 2-3 Self-Reflection questions tailored to their performance (e.g., "${username || "Learner"}, how did you feel about your fluency in this session?", "Which new collocation will you commit to memory today?") for their worksheet.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          overallBandScore: { type: Type.NUMBER, description: "Overall band score between 1.0 and 9.0" },
          fluencyAndCoherence: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER, description: "Fluency & Coherence score out of 9.0" },
              comment: { type: Type.STRING, description: "Feedback on pacing, hesitations, connectors" }
            },
            required: ["score", "comment"]
          },
          lexicalResource: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER, description: "Lexical Resource score out of 9.0" },
              comment: { type: Type.STRING, description: "Feedback on vocabulary range, appropriateness, collocations" }
            },
            required: ["score", "comment"]
          },
          grammaticalRangeAccuracy: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER, description: "Grammar score out of 9.0" },
              comment: { type: Type.STRING, description: "Feedback on sentence complexity, errors, structural variety" }
            },
            required: ["score", "comment"]
          },
          pronunciation: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER, description: "Pronunciation proxy score out of 9.0" },
              comment: { type: Type.STRING, description: "Feedback on intonation, flow, syllable stress derived from transcription indicators" }
            },
            required: ["score", "comment"]
          },
          errorsIdentified: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                error: { type: Type.STRING, description: "Specific mistake from transcript" },
                correction: { type: Type.STRING, description: "Corrected version" },
                explanation: { type: Type.STRING, description: "Simple explanation of the error" }
              },
              required: ["error", "correction", "explanation"]
            }
          },
          suggestedImprovements: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                original: { type: Type.STRING, description: "Original phrasing from user" },
                betterWay: { type: Type.STRING, description: "An upgraded academic/natural version" }
              },
              required: ["original", "betterWay"]
            }
          },
          keyCollocations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                phrase: { type: Type.STRING, description: "Key academic collocation or idiom" },
                explanation: { type: Type.STRING, description: "What the collocation means" },
                example: { type: Type.STRING, description: "A natural sample sentence" }
              },
              required: ["phrase", "explanation", "example"]
            }
          },
          sampleAnswer: { type: Type.STRING, description: "High-quality model Band 8.5+ answer for the user to learn from" },
          todayLearningPoint: { type: Type.STRING, description: "The single most critical takeaway for progress" },
          selfReflectionQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "2-3 self-reflection questions for worksheet"
          }
        },
        required: [
          "overallBandScore",
          "fluencyAndCoherence",
          "lexicalResource",
          "grammaticalRangeAccuracy",
          "pronunciation",
          "errorsIdentified",
          "suggestedImprovements",
          "keyCollocations",
          "sampleAnswer",
          "todayLearningPoint",
          "selfReflectionQuestions"
        ]
      };

      const requestedModel = model || "gemini-3-flash-preview";
      // Try requested model first, then fallbacks
      const modelsToTry = [requestedModel, ...DEFAULT_MODELS_FALLBACK.filter(m => m !== requestedModel)];
      
      let ai;
      try {
        ai = getGeminiClient(userKey);
      } catch (err) {
        return res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
      }

      let lastError: any = null;
      let responseText = "";
      let activeModelUsed = "";

      for (const currentModel of modelsToTry) {
        try {
          console.log(`Running evaluation with: ${currentModel}`);
          const response = await ai.models.generateContent({
            model: currentModel,
            contents: prompt,
            config: {
              systemInstruction: systemInstruction,
              responseMimeType: "application/json",
              responseSchema: responseSchema,
            }
          });
          if (response.text) {
            responseText = response.text;
            activeModelUsed = currentModel;
            break; // Success!
          }
        } catch (err: any) {
          console.warn(`Model ${currentModel} failed:`, err.message || err);
          lastError = err;
        }
      }

      if (!responseText) {
        const errMsg = lastError?.message || lastError || "Failed to contact Gemini API.";
        const statusText = lastError?.status || "API_ERROR";
        throw new Error(`[${statusText}] All models exhausted. Last error: ${errMsg}`);
      }

      const parsedJson = JSON.parse(responseText.trim());
      res.json({ ...parsedJson, modelUsed: activeModelUsed });
    } catch (error) {
      console.error("Gemini Evaluation Error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });
    } catch (error) {
      console.error("Gemini Evaluation Error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Vite middleware for development or Static handling for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
