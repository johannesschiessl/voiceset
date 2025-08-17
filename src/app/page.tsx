"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Trash2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import Recorder from "@/components/recorder";
import { toast } from "sonner";
import { ModeToggle } from "@/components/mode-toggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

export default function HomePage() {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);

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
    if (content === "" && document.hasFocus() === false) return;

    localStorage.setItem("editor_content", content);
    console.log("Saved to localStorage:", content);
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

  const insertAtCursor = (text: string) => {
    if (!textareaRef.current) return;

    const storedContent = localStorage.getItem("editor_content") || "";
    const currentContent = storedContent !== content ? storedContent : content;

    const textarea = textareaRef.current;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;

    const newContent =
      currentContent.substring(0, selectionStart) +
      (selectionStart > 0 &&
      !currentContent
        .substring(selectionStart - 1, selectionStart)
        .match(/[\n\s]/)
        ? " "
        : "") +
      text +
      currentContent.substring(selectionEnd);

    setContent(newContent);

    localStorage.setItem("editor_content", newContent);

    const newCursorPosition =
      selectionStart +
      text.length +
      (selectionStart > 0 &&
      !currentContent
        .substring(selectionStart - 1, selectionStart)
        .match(/[\n\s]/)
        ? 1
        : 0);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = newCursorPosition;
        textareaRef.current.selectionEnd = newCursorPosition;
      }
    }, 0);
  };

  const handleCopyToClipboard = () => {
    if (navigator.clipboard && content) {
      navigator.clipboard
        .writeText(content)
        .then(() => {
          toast.success("Text copied to clipboard!");
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err);
        });
    }
  };

  const handleClear = () => {
    setContent("");
    localStorage.setItem("editor_content", "");
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleTranscription = (text: string) => {
    console.log("Received transcription:", text);
    console.log("Current content before insertion:", content);
    insertAtCursor(text);
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

      {/* Editor */}
      <div className="bg-background max-w-3xl p-4 container mx-auto min-h-[400px] rounded-[1rem] border shadow-sm">
        <div className="flex justify-end mb-2">
          <div className="flex gap-2">
            <ModeToggle />
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
            <AlertDialog>
              <AlertDialogTrigger disabled={!content}>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!content}
                  title="Clear text"
                >
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>Clear text input field</AlertDialogTitle>
                <AlertDialogDescription>
                  This clears the entire text input field. This action cannot be
                  undone.
                </AlertDialogDescription>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClear}>
                  Clear
                </AlertDialogAction>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

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

      {/* Voice recorder component */}
      <Recorder
        onTranscriptionComplete={handleTranscription}
        disabled={!hasApiKey}
      />
    </div>
  );
}
