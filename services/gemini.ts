import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Configuration
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
if (!API_KEY) {
    console.error('Gemini API Key is missing! Check your .env file.');
}
const genAI = new GoogleGenerativeAI(API_KEY);

// ---------------------------------------------------------------------------
// Model Fallback Chains
//
// Listed cheapest → most capable. The system tries each model in order and
// only falls through to the next if the current one fails (discontinued,
// rate-limited, quota exceeded, etc.).
//
// TEXT_MODELS: Text-only tasks (no image/audio input)
//   1. gemini-2.0-flash-lite — cheapest, primary model
//   2. gemini-3.1-flash-lite-preview — reliable fallback
//
// VISION_MODELS: Multimodal tasks (image, audio, PDF input)
//   1. gemini-2.0-flash-lite — primary, supports vision
//   2. gemini-3.1-flash-lite-preview — reliable fallback
// ---------------------------------------------------------------------------
const TEXT_MODELS = [
    'gemini-2.0-flash-lite',
    'gemini-3.1-flash-lite-preview',
];

const VISION_MODELS = [
    'gemini-2.0-flash-lite',
    'gemini-3.1-flash-lite-preview',
];

export interface Flashcard {
    front: string;
    back: string;
}

export interface TechnicalNote {
    title: string;
    summary: string;
    keyTakeaways: string[];
    glossary: { term: string; definition: string }[];
}

const FLASHCARD_SYSTEM_INSTRUCTIONS = `
You are an expert educational assistant for viszmo. Your goal is to help students learn by generating high-quality flashcards.

CRITICAL: You must ALWAYS output raw JSON only. Do NOT include markdown code fences like \`\`\`json. Do NOT include any text before or after the JSON array.

Output a JSON array of objects, each with exactly two string keys: "front" and "back".
Keep concepts concise. Aim for 8-15 cards unless the content clearly warrants more or fewer.
Example: [{"front":"What is photosynthesis?","back":"The process plants use to convert sunlight into glucose using CO2 and water."}]
`;

const TECHNICAL_NOTE_SYSTEM_INSTRUCTIONS = `
You are an expert educational assistant for viszmo. Your goal is to help students learn by generating technical lecture notes.

CRITICAL: You must ALWAYS output raw JSON only. Do NOT include markdown code fences like \`\`\`json. Do NOT include any text before or after the JSON object.

Output a JSON object with:
- "title": A descriptive title string
- "summary": A clear 2-3 paragraph high-level summary string
- "keyTakeaways": An array of concise bullet point strings (Atomic Notes)
- "glossary": An array of { "term": string, "definition": string } objects for technical concepts found.
`;

/**
 * Strips markdown code fences before JSON.parse.
 * Gemini sometimes wraps JSON in ```json...``` even when told not to.
 */
const parseJsonResponse = <T>(text: string): T => {
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }
    return JSON.parse(cleaned) as T;
};

/**
 * Core fallback engine.
 * Tries each model in `modelList` in order. If a model throws for any reason
 * (discontinued, rate-limited, quota, parse error), it logs a warning and
 * automatically tries the next one. Only throws a final error if every model
 * in the chain fails.
 *
 * @param modelList  Ordered array of Gemini model IDs to try
 * @param taskFn     Function that receives a GenerativeModel and returns a Promise<T>
 */
const withModelFallback = async <T>(
    modelList: string[],
    systemInstruction: string | undefined,
    taskFn: (model: GenerativeModel) => Promise<T>
): Promise<T> => {
    let lastError: unknown;

    for (const modelId of modelList) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelId,
                ...(systemInstruction ? { systemInstruction } : {}),
            });
            const result = await taskFn(model);
            // Log which model was actually used (helps debug if fallback triggered)
            if (modelId !== modelList[0]) {
                console.log(`[Gemini] Fallback succeeded using model: ${modelId}`);
            }
            return result;
        } catch (error) {
            lastError = error;
            console.warn(`[Gemini] Model "${modelId}" failed, trying next fallback...`, error);
        }
    }

    // All models exhausted
    console.error('[Gemini] All models in fallback chain failed. Last error:', lastError);
    throw lastError;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const generateFlashcards = async (prompt: string): Promise<Flashcard[]> => {
    return withModelFallback(
        TEXT_MODELS,
        FLASHCARD_SYSTEM_INSTRUCTIONS,
        async (model) => {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            return parseJsonResponse<Flashcard[]>(text);
        }
    );
};

export const generateFlashcardsFromImage = async (base64Data: string, mimeType: string): Promise<Flashcard[]> => {
    const imagePart = {
        inlineData: { data: base64Data, mimeType },
    };
    const prompt = "Please analyze this image and generate a list of flashcards based on any educational content, notes, or diagrams found within it.";

    return withModelFallback(
        VISION_MODELS,
        FLASHCARD_SYSTEM_INSTRUCTIONS,
        async (model) => {
            const result = await model.generateContent([prompt, imagePart]);
            const text = result.response.text();
            return parseJsonResponse<Flashcard[]>(text);
        }
    );
};

export const generateTechnicalNoteFromAudio = async (base64Data: string): Promise<TechnicalNote> => {
    const audioPart = {
        inlineData: { data: base64Data, mimeType: 'audio/mp4' },
    };
    const prompt = "Please transcribe this lecture audio and provide a detailed technical note including summary, key takeaways, and a technical glossary.";

    return withModelFallback(
        VISION_MODELS,
        TECHNICAL_NOTE_SYSTEM_INSTRUCTIONS,
        async (model) => {
            const result = await model.generateContent([prompt, audioPart]);
            const text = result.response.text();
            return parseJsonResponse<TechnicalNote>(text);
        }
    );
};

export const generateTechnicalNote = async (content: string): Promise<TechnicalNote> => {
    const prompt = `Convert the following lecture/content into a detailed technical note:\n\n${content}`;

    return withModelFallback(
        TEXT_MODELS,
        TECHNICAL_NOTE_SYSTEM_INSTRUCTIONS,
        async (model) => {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            return parseJsonResponse<TechnicalNote>(text);
        }
    );
};

export const transcribeAudio = async (base64Data: string): Promise<string> => {
    const audioPart = {
        inlineData: { data: base64Data, mimeType: 'audio/mp4' },
    };
    const prompt = "Please transcribe this audio exactly as it is spoken. Do not add any extra commentary, greetings, formatting, or prefixes. Just the raw transcript.";

    return withModelFallback(
        VISION_MODELS,
        undefined, // No JSON system instruction needed for plain text transcription
        async (model) => {
            const result = await model.generateContent([prompt, audioPart]);
            return result.response.text().trim();
        }
    );
};

