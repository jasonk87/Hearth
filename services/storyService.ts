import { ai, USE_FAKE_DATA } from './geminiService';

export async function generateStorySegment(prompt: string, existingStory: string = ''): Promise<string> {
    if (USE_FAKE_DATA) {
        return Promise.resolve("Once upon a time, in a land filled with candy castles and chocolate rivers, lived a friendly dragon named Sparky. Sparky loved to fly, but he was afraid of heights.");
    }
    const fullPrompt = existingStory 
        ? `Continue this children's story. Keep the tone whimsical and imaginative. Write only one or two new paragraphs. STORY SO FAR:\n\n${existingStory}\n\n CONTINUE THE STORY:`
        : `Write the beginning of a children's story based on this prompt: "${prompt}". Keep the tone whimsical and imaginative. Write only one or two paragraphs.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: fullPrompt,
        config: {
            temperature: 0.8,
            topP: 0.95,
            thinkingConfig: {
                thinkingBudget: 24576,
            }
        }
    });

    return response.text.trim();
}

export async function generateStoryImage(textSegment: string): Promise<string> {
    if (USE_FAKE_DATA) {
        return Promise.resolve("https://via.placeholder.com/512x384.png?text=Whimsical+Dragon");
    }
    const prompt = `A beautiful, whimsical, watercolor illustration for a children's storybook, depicting the following scene: ${textSegment}`;
    
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '4:3',
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    if (!base64ImageBytes) {
        throw new Error("Image generation failed.");
    }
    return `data:image/png;base64,${base64ImageBytes}`;
}
