// Text-to-Speech service
// Uses multiple fallback options for maximum reliability

export async function generateSpeech(text: string): Promise<Buffer | null> {
  // Try multiple TTS services in order of preference
  
  // Option 1: Google Translate TTS (free, no auth needed)
  const buffer1 = await tryGoogleTranslateTTS(text);
  if (buffer1) return buffer1;
  
  // Option 2: Elevenlabs (if API key available)
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (apiKey) {
    const buffer2 = await tryElevenlabsTTS(text, apiKey);
    if (buffer2) return buffer2;
  }
  
  // Option 3: ResponsiveVoice API
  const buffer3 = await tryResponsiveVoiceTTS(text);
  if (buffer3) return buffer3;
  
  // Fallback: Return null (client can generate silence or use Web Audio API)
  console.warn("All TTS services failed for text:", text.substring(0, 50));
  return null;
}

// Google Translate TTS - free but limited
async function tryGoogleTranslateTTS(text: string): Promise<Buffer | null> {
  try {
    // URL encode the text
    const encoded = encodeURIComponent(text.substring(0, 200)); // limit to 200 chars
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=en&client=tw-ob`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (!response.ok) throw new Error("Google TTS failed");
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.debug("Google Translate TTS failed:", error);
    return null;
  }
}

// Elevenlabs TTS - premium option
async function tryElevenlabsTTS(text: string, apiKey: string): Promise<Buffer | null> {
  try {
    const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Rachel voice
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });
    
    if (!response.ok) throw new Error("Elevenlabs API failed");
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.debug("Elevenlabs TTS failed:", error);
    return null;
  }
}

// ResponsiveVoice API - alternative free option
async function tryResponsiveVoiceTTS(text: string): Promise<Buffer | null> {
  try {
    const encoded = encodeURIComponent(text);
    const url = `https://responsivevoice.org/responsivevoice/getvoice.php?t=${encoded}&tl=en`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("ResponsiveVoice failed");
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Check if response is valid audio
    if (buffer.length > 100) return buffer;
    return null;
  } catch (error) {
    console.debug("ResponsiveVoice TTS failed:", error);
    return null;
  }
}

// Alternative: Use a proper TTS service
export async function generateSpeechWithGoogleTTS(text: string): Promise<Buffer | null> {
  // This would require Google Cloud credentials
  // For hackathon, we'll use the simple HTTP approach above
  return generateSpeech(text);
}

