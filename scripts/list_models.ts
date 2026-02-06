
import { GoogleGenerativeAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    try {
        const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) {
            console.error("No API Key found");
            return;
        }
        // The SDK imports might be different based on the codebase. 
        // I will try to use the raw fetch if the SDK is complex to setup in a script.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach((m: any) => console.log(`- ${m.name}`));
        } else {
            console.log("No models found or error:", data);
        }
    } catch (e) {
        console.error("Error listing models:", e);
    }
}

listModels();
