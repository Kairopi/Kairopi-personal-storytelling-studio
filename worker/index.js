const { GoogleGenAI } = require('@google/genai');
const { PubSub } = require('@google-cloud/pubsub');
const { Firestore } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');

// --- CONFIGURATION ---
const API_KEY = process.env.API_KEY;

// Google Cloud Config
const GCLOUD_PROJECT = process.env.GCLOUD_PROJECT;
const PUBSUB_SUBSCRIPTION_VIDEO = 'video-requests-sub';
const FIRESTORE_COLLECTION_VIDEO = 'video-jobs';
const GCS_BUCKET_VIDEOS = process.env.GCS_BUCKET_VIDEOS; // e.g., 'kairopi-video-output'

// --- INITIALIZATION ---
if (!API_KEY || !GCLOUD_PROJECT || !GCS_BUCKET_VIDEOS) {
  console.error("Missing required environment variables (API_KEY, GCLOUD_PROJECT, GCS_BUCKET_VIDEOS).");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const pubsub = new PubSub({ projectId: GCLOUD_PROJECT });
const firestore = new Firestore({ projectId: GCLOUD_PROJECT });
const storage = new Storage({ projectId: GCLOUD_PROJECT });
const bucket = storage.bucket(GCS_BUCKET_VIDEOS);

// --- HELPER FUNCTIONS ---

const updateJobStatus = async (jobId, status, data = {}) => {
  const docRef = firestore.collection(FIRESTORE_COLLECTION_VIDEO).doc(jobId);
  await docRef.set({ status, ...data }, { merge: true });
  console.log(`Updated job ${jobId} status to ${status}`);
};

const buildDetailedPrompt = (cardData, prompt) => {
    let cardDescription = 'The video ends by revealing a greeting card. The card looks like this:';
    if (cardData.backgroundPrompt) cardDescription += ` The background is artistic and minimalist, in a style of "${cardData.backgroundPrompt}".`;
    else if (cardData.background) cardDescription += ` The background is a solid color: ${cardData.background}.`;
    if (cardData.paperTexture !== 'matte') cardDescription += ` The card has a physical texture of ${cardData.paperTexture}.`;
    const fontStyle = cardData.ink.value.replace('font-', '');
    cardDescription += ` The main message says "${cardData.message}", written in an elegant ${fontStyle} font.`;
    if (cardData.messageFoil !== 'none') cardDescription += ` The text has a shimmering ${cardData.messageFoil} foil effect.`;
    if (cardData.elements.length > 0) {
        cardDescription += " It's decorated with stickers: " + cardData.elements.map(el => `a sticker of a "${el.prompt}"`).join(', ') + '.';
    }
    return `${prompt}. ${cardDescription} The video should be about 8 seconds long, cinematic, and beautiful.`;
};


// --- MESSAGE HANDLER ---

const messageHandler = async (message) => {
  console.log(`Received message ${message.id}:`);
  const jobData = JSON.parse(message.data.toString());
  const { jobId, cardData, prompt } = jobData;

  try {
    await updateJobStatus(jobId, 'processing', { startedAt: new Date().toISOString() });
    
    const detailedPrompt = buildDetailedPrompt(cardData, prompt);

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: detailedPrompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: cardData.canvas.aspectRatio === '1:1' ? '1:1' : cardData.canvas.aspectRatio === '3:4' ? '9:16' : '16:9',
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        operation = await ai.operations.getVideosOperation({ operation: operation });
        console.log(`Job ${jobId} is still processing...`);
    }

    if (operation.error) {
         throw new Error(operation.error.message || 'An unknown error occurred during video generation.');
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error('Video generation finished, but no download link was provided.');
    }
    
    console.log(`Job ${jobId}: Fetching video from ${downloadLink}`);
    const videoResponse = await fetch(`${downloadLink}&key=${API_KEY}`);
    if (!videoResponse.ok) throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

    console.log(`Job ${jobId}: Uploading video to Cloud Storage.`);
    const fileName = `${jobId}.mp4`;
    const file = bucket.file(fileName);
    await file.save(videoBuffer, { contentType: 'video/mp4' });
    await file.makePublic();
    
    await updateJobStatus(jobId, 'complete', { 
        videoUrl: file.publicUrl(),
        finishedAt: new Date().toISOString()
    });

    message.ack();

  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);
    await updateJobStatus(jobId, 'error', { 
        errorMessage: error.message,
        finishedAt: new Date().toISOString()
    });
    // Acknowledge the message even on failure to prevent retries for non-transient errors.
    message.ack();
  }
};


// --- WORKER START ---
function listenForMessages() {
  const subscription = pubsub.subscription(PUBSUB_SUBSCRIPTION_VIDEO);
  subscription.on('message', messageHandler);
  subscription.on('error', error => {
    console.error('Received error:', error);
    process.exit(1);
  });
  console.log(`🚀 KairoPi Video Worker is listening for messages on ${PUBSUB_SUBSCRIPTION_VIDEO}...`);
}

listenForMessages();