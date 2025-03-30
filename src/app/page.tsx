"use client";

import { useState, useRef, useEffect } from "react";
import {
  Copy,
  Trash2,
  Mic,
  Square,
  Settings,
  CircleAlert,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { transcribeAudio } from "@/services/transcribe";
import { enhanceTranscription } from "@/services/intelligence";

export default function HomePage() {
  const [content, setContent] = useState("");
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<
    "transcribing" | "enhancing" | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const apiKey = localStorage.getItem("groq_api_key");

    setHasApiKey(!!apiKey);

    if (!apiKey) {
      setShowKeyPrompt(true);
    }
  }, []);

  useEffect(() => {
    const savedContent = localStorage.getItem("editor_content");
    if (savedContent) {
      setContent(savedContent);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("editor_content", content);
  }, [content]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
  }

  const appendToContent = (text: string) => {
    setContent((prev) => prev + (prev ? "\n" : "") + text);
  };

  const handleCopyToClipboard = () => {
    if (navigator.clipboard && content) {
      navigator.clipboard
        .writeText(content)
        .then(() => {
          setShowCopyAlert(true);
          setTimeout(() => setShowCopyAlert(false), 2000);
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err);
        });
    }
  };

  const handleClear = () => {
    setContent("");
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsProcessing(true);
        setProcessingStage("transcribing");
      }
    } else {
      const apiKey = localStorage.getItem("groq_api_key");
      if (!apiKey) {
        setErrorMessage(
          "No Groq API key found. Please add your API key in settings.",
        );
        setHasApiKey(false);
        return;
      }

      try {
        setErrorMessage(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);

        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });

          stream.getTracks().forEach((track) => track.stop());
          setIsRecording(false);

          try {
            setProcessingStage("transcribing");
            const transcriptionResult = await transcribeAudio(audioBlob);

            if (transcriptionResult.error) {
              setErrorMessage(transcriptionResult.error);
              if (transcriptionResult.error.includes("No Groq API key found")) {
                setHasApiKey(false);
              }
              setIsProcessing(false);
              setProcessingStage(null);
              return;
            }

            setProcessingStage("enhancing");

            const termsString = localStorage.getItem("specialized_terms");
            const specializedTerms = termsString ? JSON.parse(termsString) : [];

            const enhancementResult = await enhanceTranscription({
              text: transcriptionResult.text,
              specializedTerms,
            });

            if (enhancementResult.error) {
              appendToContent(transcriptionResult.text);
              setErrorMessage(
                `Enhancement warning: ${enhancementResult.error}`,
              );
            } else {
              appendToContent(enhancementResult.enhancedText);
            }
          } catch (error) {
            setErrorMessage(
              `Error processing audio: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          } finally {
            setIsProcessing(false);
            setProcessingStage(null);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        setErrorMessage(
          "Could not access microphone. Please check your permissions.",
        );
      }
    }
  };

  return (
    <div className="px-4 sm:px-0">
      {/* API Key Setup Prompt */}
      {showKeyPrompt && (
        <div className="flex justify-center pb-6 z-50">
          <Alert className="w-3xl">
            <AlertTitle>Set up Speech-to-Text</AlertTitle>
            <AlertDescription>
              <p className="mb-3">
                To enable voice-to-text transcription, you need to add your Groq
                API key.
              </p>
              <div className="flex gap-3">
                <Link href="/settings">
                  <Button>Set up now</Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Error message if present */}
      {errorMessage && (
        <div className="flex justify-center pb-6 z-50">
          <Alert className="w-3xl">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              <p>{errorMessage}</p>
              {!hasApiKey && (
                <div className="mt-2">
                  <Link href="/settings">
                    <Button>Go to settings to add your API key</Button>
                  </Link>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Editor */}

      <div className="bg-white max-w-3xl p-4 container mx-auto min-h-[400px] rounded-[1rem] border shadow-sm">
        <div className="flex justify-between mb-2">
          {/* Voice recording button */}
          <Button
            variant={isRecording ? "outline" : "default"}
            size="sm"
            onClick={toggleRecording}
            disabled={isProcessing || !hasApiKey}
            className="mr-2"
          >
            {!hasApiKey ? (
              <Button variant="ghost">
                <CircleAlert />
                No API key
              </Button>
            ) : isProcessing ? (
              <>
                <Loader2 className="animate-spin" />
                {processingStage === "transcribing"
                  ? "Transcribing..."
                  : "Enhancing..."}
              </>
            ) : isRecording ? (
              <>
                <Square />
                Stop recording
              </>
            ) : (
              <>
                <Mic />
                Start recording
              </>
            )}
          </Button>

          <div className="flex gap-2">
            <Link href="/settings">
              <Button variant="ghost" size="icon" title="Settings">
                <Settings className="size-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyToClipboard}
              disabled={!content}
              title="Copy to clipboard"
            >
              <Copy className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              disabled={!content}
              title="Clear text"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        {showCopyAlert && (
          <Alert className="mb-2">
            <AlertDescription>Text copied to clipboard!</AlertDescription>
          </Alert>
        )}

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          placeholder="Start typing here..."
          className="w-full h-full resize-none outline-none overflow-hidden min-h-[350px]"
          style={{
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}
