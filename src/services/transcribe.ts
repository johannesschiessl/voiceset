"use client";

export interface TranscriptionResponse {
  text: string;
  error?: string;
}

export async function transcribeAudio(
  audioBlob: Blob,
): Promise<TranscriptionResponse> {
  try {
    const apiKey = localStorage.getItem("groq_api_key");

    if (!apiKey) {
      return {
        text: "",
        error: "No Groq API key found. Please add your API key in settings.",
      };
    }

    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("response_format", "json");

    const response = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      if (response.status === 401) {
        return {
          text: "",
          error: "Invalid API key. Please check your Groq API key in settings.",
        };
      } else if (response.status === 429) {
        return {
          text: "",
          error: "Rate limit exceeded. Please try again later.",
        };
      } else if (response.status === 413) {
        return {
          text: "",
          error:
            "Audio file too large. Maximum size is 40MB (free tier) or 100MB (dev tier).",
        };
      }

      return {
        text: "",
        error: `Error from Groq API: ${
          errorData?.error?.message || response.statusText
        }`,
      };
    }

    const data = await response.json();

    if (!data.text || data.text.trim() === "") {
      return {
        text: "",
        error: "No speech detected in the audio. Please try recording again.",
      };
    }

    return { text: data.text };
  } catch (error) {
    console.error("Transcription error:", error);

    if (error instanceof TypeError && error.message.includes("NetworkError")) {
      return {
        text: "",
        error: "Network error. Please check your internet connection.",
      };
    }

    return {
      text: "",
      error: `Failed to transcribe audio: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
