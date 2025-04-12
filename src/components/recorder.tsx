import { useRef, useState, useCallback } from "react";
import { useKeyPressEvent } from "react-use";
import { AnimatePresence, motion } from "framer-motion";
import { transcribeAudio } from "@/services/transcribe";
import { enhanceTranscription } from "@/services/intelligence";

interface QuickRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
}

export default function Recorder({
  onTranscriptionComplete,
  disabled = false,
}: QuickRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const [ctrlPressed, setCtrlPressed] = useState(false);
  const lastCtrlSpacePressRef = useRef<number>(0);

  const toggleRecording = useCallback(() => {
    if (disabled || isProcessing) return;

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, disabled, isProcessing]);

  useKeyPressEvent(
    "Control",
    () => {
      setCtrlPressed(true);
    },
    () => {
      setCtrlPressed(false);
      if (isRecording && mediaRecorderRef.current?.state === "recording") {
        stopRecording();
      }
    },
  );

  useKeyPressEvent(" ", (e) => {
    if (ctrlPressed && !disabled && !isProcessing) {
      e.preventDefault();

      const now = Date.now();
      const timeSinceLastPress = now - lastCtrlSpacePressRef.current;

      if (
        !isRecording &&
        (timeSinceLastPress < 500 || timeSinceLastPress > 1000)
      ) {
        startRecording();
      } else if (isRecording) {
        stopRecording();
      }

      lastCtrlSpacePressRef.current = now;
    }
  });

  const startRecording = async () => {
    if (disabled || isProcessing) return;

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        processRecording();
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      setError("Could not access microphone. Please check your permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);

      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const processRecording = async () => {
    try {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      if (audioBlob.size === 0) {
        setError("No audio recorded. Please try again.");
        setIsProcessing(false);
        return;
      }

      const transcriptionResult = await transcribeAudio(audioBlob);

      if (transcriptionResult.error) {
        setError(transcriptionResult.error);
        setIsProcessing(false);
        return;
      }

      if (!transcriptionResult.text.trim()) {
        setError("No speech detected. Please try again.");
        setIsProcessing(false);
        return;
      }

      const termsString = localStorage.getItem("specialized_terms");
      const specializedTerms = termsString ? JSON.parse(termsString) : [];

      const enhancementResult = await enhanceTranscription({
        text: transcriptionResult.text,
        specializedTerms,
      });

      if (enhancementResult.error) {
        onTranscriptionComplete(transcriptionResult.text);
      } else {
        onTranscriptionComplete(enhancementResult.enhancedText);
      }
    } catch (error) {
      console.error("Error processing recording:", error);
      setError(
        `Processing error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {/* Recording inactive */}
      {!isRecording && !isProcessing && !error && (
        <motion.div
          className="fixed bottom-12 left-1/2 transform -translate-x-1/2 py-2.5 px-4 rounded-xl bg-black/90 shadow-lg text-white flex items-center cursor-pointer hover:bg-black/95 hover:scale-105 transition-all"
          whileHover={{ scale: 1.05 }}
          onClick={!disabled ? toggleRecording : undefined}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          key="record-prompt"
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                disabled ? "bg-gray-500" : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm font-mono">
              Click here or hold{" "}
              <kbd className="bg-white/20 px-1 py-0.5 rounded text-xs mx-0.5">
                Ctrl
              </kbd>
              +
              <kbd className="bg-white/20 px-1 py-0.5 rounded text-xs mx-0.5">
                Space
              </kbd>{" "}
              to record
            </span>
          </div>
        </motion.div>
      )}

      {/* Recording active */}
      {isRecording && (
        <motion.div
          className="fixed bottom-12 left-1/2 transform -translate-x-1/2 py-2.5 px-4 rounded-xl bg-black/90 shadow-lg text-white flex items-center cursor-pointer hover:bg-black/95 hover:scale-105 transition-all"
          whileHover={{ scale: 1.05 }}
          onClick={toggleRecording}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          key="recording-indicator"
        >
          <div className="flex items-center space-x-3">
            <motion.div
              className="w-3 h-3 rounded-full bg-red-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut",
              }}
            />
            <span className="text-sm font-mono">
              Recording... Release{" "}
              <kbd className="bg-white/20 px-1 py-0.5 rounded text-xs mx-0.5">
                Ctrl
              </kbd>
              +
              <kbd className="bg-white/20 px-1 py-0.5 rounded text-xs mx-0.5">
                Space
              </kbd>{" "}
              or click to stop
            </span>
          </div>
        </motion.div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-12 left-1/2 transform -translate-x-1/2 bg-black/90 text-white py-2.5 px-4 rounded-xl shadow-xl flex items-center space-x-3 font-mono"
          key="processing"
        >
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          <span>Processing audio...</span>
        </motion.div>
      )}

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-12 left-1/2 transform -translate-x-1/2 bg-red-500/90 text-white py-2.5 px-4 rounded-xl shadow-xl font-mono"
          key="error"
        >
          {error}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
