
const API_BASE_URL = '/api'; // Assumes the backend is served on the same domain

const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network response was not ok' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const getMuseBrainstormSuggestions = async (recipient: string, memory: string, vibe: string): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/muse-brainstorm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, memory, vibe }),
    });
    return handleApiResponse(response);
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
    try {
        const response = await fetch(`${API_BASE_URL}/polish-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, polishType }),
        });
        const data = await handleApiResponse(response);
        return data.polishedMessage;
    } catch (error) {
        console.error(`Error polishing message (type: ${polishType}):`, error);
        return message; // Return original message on error
    }
};


export const generateSticker = async (prompt: string, style: string, backgroundContext: string): Promise<string | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/generate-sticker`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, style, backgroundContext }),
        });
        const data = await handleApiResponse(response);
        return data.imageUrl;
    } catch (error) {
        console.error("Error generating sticker:", error);
        return null;
    }
};

export const generateBackgrounds = async (prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'): Promise<string[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/generate-backgrounds`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, aspectRatio }),
        });
        const data = await handleApiResponse(response);
        return data.backgrounds;
    } catch (error) {
        console.error("Error generating backgrounds:", error);
        return ['#E6E6FA', '#FFF0F5', '#F0F8FF', '#F5FFFA'];
    }
};

export const enhanceDoodle = async (base64ImageData: string, prompt: string): Promise<string | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/enhance-doodle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64ImageData, prompt }),
        });
        const data = await handleApiResponse(response);
        return data.imageUrl;
    } catch (error) {
        console.error("Error enhancing doodle:", error);
        return null;
    }
};