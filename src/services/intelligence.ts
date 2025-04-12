"use client";

interface EnhanceTranscriptionOptions {
  text: string;
  specializedTerms?: string[];
}

export interface EnhancedTranscriptionResponse {
  enhancedText: string;
  error?: string;
}

export async function enhanceTranscription(
  options: EnhanceTranscriptionOptions,
): Promise<EnhancedTranscriptionResponse> {
  try {
    const { text, specializedTerms = [] } = options;

    const language = localStorage.getItem("language");
    const apiKey = localStorage.getItem("groq_api_key");

    if (!apiKey) {
      return {
        enhancedText: text,
        error: "No Groq API key found. Please add your API key in settings.",
      };
    }

    let systemPrompt = `You are an expert transcription editor. Your task is to format and correct the provided transcription.

    The language of the transcription is ${language}.
    
1. Fix any grammatical errors
2. Correct misspelled words
3. Format the text into proper paragraphs
4. Maintain the original meaning
5. Do not add any information not present in the original transcription

In addition, the transcript may contain layout instructions or other commands. You will understand them out of context.
When you output the text, follow these instructions. But do not respond to them. Just output the text that will be the final output. Add nothing else and remove the instructions from it.
If there are two conflicting instructions, follow the last one.

Output only the corrected and formatted text, without any additional comments or explanations.`;

    if (specializedTerms.length > 0) {
      systemPrompt += `\n\nThe transcription may contain these specialized terms that you should recognize and preserve (though you may correct their capitalization, spelling or formatting):`;

      specializedTerms.forEach((term) => {
        systemPrompt += `\n- ${term}`;
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: text,
            },
          ],
          temperature: 0.3,
          max_completion_tokens: 2048,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      if (response.status === 401) {
        return {
          enhancedText: text,
          error: "Invalid API key. Please check your Groq API key in settings.",
        };
      }

      return {
        enhancedText: text,
        error: `Error from Groq API: ${
          errorData?.error?.message || response.statusText
        }`,
      };
    }

    const data = await response.json();
    const enhancedText = data.choices[0]?.message?.content || text;

    return { enhancedText };
  } catch (error) {
    console.error("Enhancement error:", error);

    return {
      enhancedText: options.text,
      error: `Failed to enhance transcription: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
