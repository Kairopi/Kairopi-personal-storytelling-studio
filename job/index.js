const { GoogleGenAI } = require('@google/genai');
const { Storage } = require('@google-cloud/storage');

// --- CONFIGURATION ---
const API_KEY = process.env.API_KEY;

// Google Cloud Config
const GCLOUD_PROJECT = process.env.GCLOUD_PROJECT;
const GCS_BUCKET_DAILY_CARD = process.env.GCS_BUCKET_DAILY_CARD; // e.g., 'kairopi-public-assets'
const GCS_OBJECT_DAILY_CARD = 'card-of-the-day.json';

// --- INITIALIZATION ---
if (!API_KEY || !GCLOUD_PROJECT || !GCS_BUCKET_DAILY_CARD) {
    console.error("Missing required environment variables (API_KEY, GCLOUD_PROJECT, GCS_BUCKET_DAILY_CARD).");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const storage = new Storage({ projectId: GCLOUD_PROJECT });
const bucket = storage.bucket(GCS_BUCKET_DAILY_CARD);

// --- JOB LOGIC ---
async function run() {
    console.log("Starting 'Card of the Day' generation job...");

    try {
        // 1. Generate an inspirational quote
        console.log("Generating quote...");
        const quoteResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Generate a short, beautiful, and inspiring quote about creativity and new beginnings. Just the quote, no extra text.",
        });
        const quote = quoteResponse.text.trim();

        // 2. Generate a matching background image
        console.log("Generating background image...");
        const bgPrompt = `A beautiful, subtle, high-quality background for a greeting card. The style should be artistic and minimalist. The mood should be inspiring and gentle, matching a quote about creativity.`;
        const imageResponse = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: bgPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
        });
        const imageBase64 = imageResponse.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/jpeg;base64,${imageBase64}`;

        // 3. Assemble the card data
        const cardOfTheDay = {
            quote,
            imageUrl,
            generatedAt: new Date().toISOString(),
        };

        // 4. Upload to Cloud Storage
        console.log("Uploading card data to Cloud Storage...");
        const file = bucket.file(GCS_OBJECT_DAILY_CARD);
        await file.save(JSON.stringify(cardOfTheDay, null, 2), {
            contentType: 'application/json',
            // Make the file publicly readable
            predefinedAcl: 'publicRead',
        });

        console.log(`Successfully generated and uploaded 'Card of the Day' to gs://${GCS_BUCKET_DAILY_CARD}/${GCS_OBJECT_DAILY_CARD}`);

    } catch (error) {
        console.error("Failed to generate 'Card of the Day':", error);
        process.exit(1); // Exit with error code
    }
}

run();