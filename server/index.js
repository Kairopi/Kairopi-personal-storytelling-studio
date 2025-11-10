const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const { PubSub } = require('@google-cloud/pubsub');
const { Firestore } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');

// --- CONFIGURATION ---
const PORT = process.env.PORT || 8080;
const API_KEY = process.env.API_KEY;

// Google Cloud Config
const GCLOUD_PROJECT = process.env.GCLOUD_PROJECT;
const PUBSUB_TOPIC_VIDEO = 'video-requests';
const FIRESTORE_COLLECTION_VIDEO = 'video-jobs';
const GCS_BUCKET_DAILY_CARD = process.env.GCS_BUCKET_DAILY_CARD; // e.g., 'kairopi-public-assets'
const GCS_OBJECT_DAILY_CARD = 'card-of-the-day.json';

// --- INITIALIZATION ---
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

if (!API_KEY) {
  console.error("Gemini API key not found. Please set the API_KEY environment variable.");
}
if (!GCLOUD_PROJECT) {
  console.error("Google Cloud Project ID not found. Please set the GCLOUD_PROJECT environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const pubsub = new PubSub({ projectId: GCLOUD_PROJECT });
const firestore = new Firestore({ projectId: GCLOUD_PROJECT });
const storage = new Storage({ projectId: GCLOUD_PROJECT });


// --- API ENDPOINTS ---

// 1. Muse Brainstorm
app.post('/api/muse-brainstorm', async (req, res) => {
  try {
    const { recipient, memory, vibe } = req.body;
    const fullPrompt = `You are "Muse," a creative co-pilot for a card-making app. Your voice is human, authentic, and slightly imperfect—NEVER sound like a corporate marketing email. A user needs help writing a card.

    Here's the recipe for the message:
    - **Recipient:** ${recipient}
    - **Core Memory/Story:** ${memory}
    - **Desired Vibe:** ${vibe}

    Generate 3 distinct message options. Maintain the "un-robotic" philosophy. Write with heart.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: 'ARRAY', items: { type: 'STRING' } }
        }
    });

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error("Error in /api/muse-brainstorm:", error);
    res.status(500).json({ error: "Failed to get brainstorm suggestions." });
  }
});

// 2. Polish Message
app.post('/api/polish-message', async (req, res) => {
    try {
        const { message, polishType } = req.body;
        let polishInstruction = '';
        switch (polishType) {
            case 'grammar': polishInstruction = 'Fix spelling and grammar mistakes. Be subtle.'; break;
            case 'warmer': polishInstruction = 'Make the tone slightly warmer and more affectionate. Add empathy.'; break;
            case 'funnier': polishInstruction = 'Inject a bit of lighthearted wit and humor based on the existing text.'; break;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: message,
            config: {
                systemInstruction: `You are a thoughtful editor. Preserve the user's original voice. Only fix genuine errors or slightly enhance based on the user's request: "${polishInstruction}"`
            }
        });
        res.json({ polishedMessage: response.text });
    } catch (error) {
        console.error("Error in /api/polish-message:", error);
        res.status(500).json({ error: "Failed to polish message." });
    }
});


// 3. Generate Sticker
app.post('/api/generate-sticker', async (req, res) => {
    try {
        const { prompt, style, backgroundContext } = req.body;
        const fullPrompt = `Expert sticker designer. Generate a single, isolated sticker of a "${prompt}" in a "${style}" style.
CRITICAL: Output **MUST** be a PNG with a fully transparent background. No background color, halos, or shadows.
CONTEXT: The sticker will be placed on this background, so inform lighting/colors, but DO NOT include the background: ${backgroundContext}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: fullPrompt }] },
            config: { responseModalities: ['IMAGE'] },
        });

        const part = response.candidates[0].content.parts.find(p => p.inlineData);
        if (part) {
            res.json({ imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` });
        } else {
            throw new Error("No image data found in response.");
        }
    } catch (error) {
        console.error("Error in /api/generate-sticker:", error);
        res.status(500).json({ error: "Failed to generate sticker." });
    }
});

// 4. Generate Backgrounds
app.post('/api/generate-backgrounds', async (req, res) => {
    try {
        const { prompt, aspectRatio } = req.body;
        const fullPrompt = `A beautiful, subtle, high-quality background for a greeting card. Style should be artistic and minimalist, suitable for text overlay. Mood: ${prompt}.`;
        
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: fullPrompt,
            config: { numberOfImages: 4, outputMimeType: 'image/jpeg', aspectRatio },
        });

        res.json({ backgrounds: response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`) });
    } catch (error) {
        console.error("Error in /api/generate-backgrounds:", error);
        res.status(500).json({ error: "Failed to generate backgrounds." });
    }
});

// 5. Enhance Doodle
app.post('/api/enhance-doodle', async (req, res) => {
    try {
        const { base64ImageData, prompt } = req.body;
        const base64Data = base64ImageData.split(',')[1];
        const imagePart = { inlineData: { data: base64Data, mimeType: 'image/png' } };
        const textPart = { text: `Expert digital artist. Redraw this doodle in a "${prompt}" style. Preserve the original's core shape. CRITICAL: Output **MUST** be a PNG with a fully transparent background.` };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: { responseModalities: ['IMAGE'] },
        });

        const part = response.candidates[0].content.parts.find(p => p.inlineData);
        if (part) {
            res.json({ imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` });
        } else {
            throw new Error("No image data found in response.");
        }
    } catch (error) {
        console.error("Error in /api/enhance-doodle:", error);
        res.status(500).json({ error: "Failed to enhance doodle." });
    }
});


// 6. Request Video Generation (Pub/Sub)
app.post('/api/request-video', async (req, res) => {
    try {
        const { cardData, prompt } = req.body;
        const jobId = `video-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        
        const jobData = { jobId, cardData, prompt };
        const dataBuffer = Buffer.from(JSON.stringify(jobData));

        await pubsub.topic(PUBSUB_TOPIC_VIDEO).publishMessage({ data: dataBuffer });
        
        // Create an initial record in Firestore
        await firestore.collection(FIRESTORE_COLLECTION_VIDEO).doc(jobId).set({
            status: 'queued',
            jobId: jobId,
            createdAt: new Date().toISOString()
        });
        
        res.status(202).json({ jobId });

    } catch (error) {
        console.error("Error in /api/request-video:", error);
        res.status(500).json({ error: "Failed to queue video generation." });
    }
});

// 7. Get Video Status (Firestore)
app.get('/api/video-status/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const docRef = firestore.collection(FIRESTORE_COLLECTION_VIDEO).doc(jobId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Job not found." });
        }
        res.json(doc.data());
    } catch (error) {
        console.error("Error in /api/video-status:", error);
        res.status(500).json({ error: "Failed to get video status." });
    }
});

// 8. Get Card of the Day (GCS)
app.get('/api/card-of-the-day', async (req, res) => {
    if (!GCS_BUCKET_DAILY_CARD) {
        return res.status(500).json({ error: "Bucket for daily card is not configured." });
    }
    try {
        const bucket = storage.bucket(GCS_BUCKET_DAILY_CARD);
        const file = bucket.file(GCS_OBJECT_DAILY_CARD);
        const [data] = await file.download();
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
    } catch (error) {
        console.error("Error fetching card of the day:", error.message);
        // It's okay if the file doesn't exist yet, just return nothing.
        if (error.code === 404) {
            return res.status(204).send();
        }
        res.status(500).json({ error: "Could not retrieve card of the day." });
    }
});

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`KairoPi API server listening on port ${PORT}`);
});