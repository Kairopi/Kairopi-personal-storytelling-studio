import { GoogleGenAI, Modality, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const getMuseBrainstormSuggestions = async (recipient: string, memory: string, vibe: string): Promise<string[]> => {
  try {
    const fullPrompt = `You are "Muse," a creative co-pilot for a card-making app. Your voice is human, authentic, and slightly imperfect—NEVER sound like a corporate marketing email. A user needs help writing a card.

    Here's the recipe for the message:
    - **Recipient:** ${recipient}
    - **Core Memory/Story:** ${memory}
    - **Desired Vibe:** ${vibe}

    Generate 3 distinct message options based on this recipe.
    1.  **Short & Punchy:** A concise, impactful message.
    2.  **Medium Length:** A balanced, thoughtful message.
    3.  **Longer Story:** A more detailed, narrative-driven message that weaves in the core memory.
    
    Maintain the "un-robotic" philosophy. Write with heart.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.STRING,
                    description: 'A single card message suggestion.'
                },
                description: 'A list of 3 card message suggestions, from short to long.'
            }
        }
    });

    const text = response.text.trim();
    const suggestions = JSON.parse(text);

    if (Array.isArray(suggestions) && suggestions.length > 0) {
        return suggestions;
    }
    throw new Error("Invalid response format from AI.");

  } catch (error) {
    console.error("Error getting Muse brainstorm suggestions:", error);
    return [
        "Thinking of you...",
        "Remember when we...? Good times.",
        "Just wanted to send a little note to say hello and that I was thinking about that one time..."
    ];
  }
};

export const polishMessage = async (message: string, polishType: 'grammar' | 'warmer' | 'funnier'): Promise<string> => {
    let polishInstruction = '';
    switch (polishType) {
        case 'grammar':
            polishInstruction = 'Fix spelling and grammar mistakes. Be subtle.';
            break;
        case 'warmer':
            polishInstruction = 'Make the tone slightly warmer and more affectionate. Add empathy.';
            break;
        case 'funnier':
            polishInstruction = 'Inject a bit of lighthearted wit and humor based on the existing text.';
            break;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: message,
            config: {
                systemInstruction: `You are a thoughtful editor, not a rewriter. Your goal is to help a user polish their message for a greeting card.
                CRITICAL RULE: Preserve the user's original slang, sentence structure, and unique voice. Only fix genuine errors or slightly enhance based on the user's request. Do NOT sanitize their personality or make it sound generic.
                
                User's Request: "${polishInstruction}"`
            }
        });

        return response.text;
    } catch (error) {
        console.error(`Error polishing message (type: ${polishType}):`, error);
        return message; // Return original message on error
    }
};


export const generateSticker = async (prompt: string, style: string, backgroundContext: string): Promise<string | null> => {
    try {
        const fullPrompt = `You are an expert sticker designer. Your task is to generate a single, isolated sticker based on the user's request.

**User Request:** A sticker of a "${prompt}" in a "${style}" style.

**Critical Instructions:**
1.  **TRANSPARENCY IS MANDATORY:** The output **MUST** be a PNG with a fully transparent background (alpha channel). There should be absolutely no background color, no semi-transparent halos, and no drop shadows. The object must be cleanly cut out.
2.  **CONTEXTUAL AWARENESS:** The sticker will be placed on a specific background. Use this information to inform the sticker's lighting, color palette, and style so it looks harmonious, but **DO NOT** include the background in the final image. The sticker itself must remain isolated.
    - **Background Context:** ${backgroundContext}

The final image should be a high-quality, simple, bold sticker, like a premium vinyl decal.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: fullPrompt }] },
            config: { responseModalities: [Modality.IMAGE] },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Error generating sticker:", error);
        return null;
    }
};

export const generateBackgrounds = async (prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'): Promise<string[]> => {
    try {
        const fullPrompt = `A beautiful, subtle, high-quality background for a greeting card. The style should be artistic and minimalist, suitable for text overlay. The mood should be ${prompt}. Avoid text or distinct objects unless specifically asked.`;
        
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: fullPrompt,
            config: {
                numberOfImages: 4,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio,
            },
        });

        return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);

    } catch (error) {
        console.error("Error generating backgrounds:", error);
        return ['#E6E6FA', '#FFF0F5', '#F0F8FF', '#F5FFFA'];
    }
};

export const enhanceDoodle = async (base64ImageData: string, prompt: string): Promise<string | null> => {
    try {
        const base64Data = base64ImageData.split(',')[1];

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: 'image/png',
            },
        };

        const textPart = {
            text: `You are an expert digital artist. A user has provided a simple doodle. Your task is to creatively redraw and enhance this doodle based on their style request, while preserving the original's core shape and composition.

**Style Request:** "${prompt}"

**Critical Instructions:**
1.  **Preserve Shape:** The final image must be clearly recognizable as the original doodle. Do not change the subject matter.
2.  **TRANSPARENCY IS MANDATORY:** The output **MUST** be a PNG with a fully transparent background. No shadows, no borders, no new background elements.
`,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: { responseModalities: [Modality.IMAGE] },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
        }
        return null;

    } catch (error) {
        console.error("Error enhancing doodle:", error);
        return null;
    }
};