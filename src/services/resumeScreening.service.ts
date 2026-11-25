import { GoogleGenAI, Type } from "@google/genai";
import pdfParse from "pdf-parse";
import { IJobPost } from "../models/jobPost.model";

export interface ScreeningResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  feedback: string[];
}

const FALLBACK_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.8-flash",
];

export async function extractResumeText(resumeUrl: string): Promise<string> {
  const response = await fetch(resumeUrl);
  if (!response.ok) throw new Error("Failed to fetch resume PDF from Cloudinary.");
  const parsed = await pdfParse(Buffer.from(await response.arrayBuffer()));
  const text = parsed.text.trim();
  if (!text) throw new Error("Could not extract text from the resume PDF.");
  return text;
}

export const screenResumeAgainstJob = async (
  resumeText: string,
  job: IJobPost,
): Promise<ScreeningResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  // 3. Build the prompt
  const prompt = `
You are an expert technical recruiter and ATS (Applicant Tracking System).
Compare the following candidate resume against the job posting and evaluate compatibility.

--- JOB POSTING ---
Title: ${job.title}
Description: ${job.description}
Requirements: ${job.requirements}
Required skills: ${job.skills_required.join(", ")}

--- CANDIDATE RESUME ---
${resumeText}

Provide:
1. A compatibility score from 0 to 100.
2. A list of matched skills found in the resume.
3. A list of important missing skills or qualifications from the job posting.
4. Specific, actionable feedback on what the candidate should update or add to their resume to improve their chances.
`;

  // 4. Call Gemini API with automatic fallback across available models
  let lastError: unknown;

  for (const model of FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: {
                type: Type.INTEGER,
                description: "Compatibility score out of 100",
              },
              matchedSkills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              missingSkills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              feedback: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Actionable tips to update the resume",
              },
            },
            required: ["score", "matchedSkills", "missingSkills", "feedback"],
          },
        },
      });

      if (!response.text) {
        throw new Error(`Empty response received from ${model}.`);
      }

      return JSON.parse(response.text) as ScreeningResult;
    } catch (error: any) {
      lastError = error;
      const msg = String(error?.message || "");
      const status = error?.status;

      const shouldFallback =
        status === 503 ||
        status === 429 ||
        status === 404 ||
        msg.includes("503") ||
        msg.includes("429") ||
        msg.includes("404") ||
        msg.includes("UNAVAILABLE") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("NOT_FOUND");

      if (shouldFallback) {
        console.warn(`${model} failed (${status ?? "error"}), trying next model...`);
        continue;
      }

      throw error;
    }
  }

  throw lastError ?? new Error("All Gemini models are currently unavailable.");
};