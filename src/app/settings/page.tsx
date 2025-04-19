"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [specializedTerms, setSpecializedTerms] = useState<string[]>([]);
  const [newTerm, setNewTerm] = useState("");
  const [language, setLanguage] = useState("auto");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isInstructionsSaved, setIsInstructionsSaved] = useState(false);

  useEffect(() => {
    const storedApiKey = localStorage.getItem("groq_api_key") || "";
    const storedTerms = localStorage.getItem("specialized_terms");
    const storedLanguage = localStorage.getItem("language");
    const storedCustomInstructions = localStorage.getItem(
      "custom_instructions",
    );

    if (!storedLanguage) {
      localStorage.setItem("language", "auto");
      setLanguage("auto");
    }

    setApiKey(storedApiKey);
    setLanguage(storedLanguage || "auto");
    setCustomInstructions(storedCustomInstructions || "");

    if (storedTerms) {
      try {
        const parsedTerms = JSON.parse(storedTerms);
        setSpecializedTerms(parsedTerms);
      } catch (error) {
        console.error("Error parsing specialized terms:", error);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("groq_api_key", apiKey);
    setIsSaved(true);

    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  const handleAddTerm = () => {
    if (!newTerm.trim()) return;

    const term = newTerm.trim();
    if (specializedTerms.includes(term)) return;

    const updatedTerms = [...specializedTerms, term];
    setSpecializedTerms(updatedTerms);
    localStorage.setItem("specialized_terms", JSON.stringify(updatedTerms));

    setNewTerm("");
  };

  const handleRemoveTerm = (termToRemove: string) => {
    const updatedTerms = specializedTerms.filter(
      (term) => term !== termToRemove,
    );
    setSpecializedTerms(updatedTerms);
    localStorage.setItem("specialized_terms", JSON.stringify(updatedTerms));
  };

  const handleLanguageChange = (value: string) => {
    localStorage.setItem("language", value);
    setLanguage(value);
  };

  const handleInstructionsSave = () => {
    localStorage.setItem("custom_instructions", customInstructions);
    setIsInstructionsSaved(true);

    setTimeout(() => {
      setIsInstructionsSaved(false);
    }, 3000);
  };

  return (
    <div className="container mx-auto px-4 sm:px-0 max-w-3xl">
      <Link href="/">
        <Button variant="outline" className="mb-6">
          <ArrowLeft />
          Settings
        </Button>
      </Link>
      <div className="space-y-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Groq API Key</CardTitle>
              <CardDescription>
                Enter your Groq API key to enable speech-to-text functionality.
                You can get an API key from{" "}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Groq Console
                </a>
                . Your API key will never be sent to our servers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 items-start">
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Groq API key"
                />
                <Button onClick={handleSave}>Save</Button>
              </div>
            </CardContent>
            {isSaved && (
              <CardFooter>
                <Alert variant="default">
                  <AlertDescription>
                    API key saved successfully!
                  </AlertDescription>
                </Alert>
              </CardFooter>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Instructions</CardTitle>
              <CardDescription>
                Add custom instructions to the AI. This will be taken into
                account when improving the transcription.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 items-end">
                <Textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Enter your custom instructions"
                />
                <Button onClick={handleInstructionsSave}>Save</Button>
              </div>
            </CardContent>
            {isInstructionsSaved && (
              <CardFooter>
                <Alert variant="default">
                  <AlertDescription>
                    Custom instructions saved successfully!
                  </AlertDescription>
                </Alert>
              </CardFooter>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Language</CardTitle>
              <CardDescription>
                Select the language to use for transcription. Improves
                transcription quality. Languages not listed here may still be
                supported, in which case please select Auto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Specialized Terms</CardTitle>
              <CardDescription>
                Add specialized terms, industry jargon, or technical vocabulary
                that might appear in your recordings. This helps the AI better
                understand and correctly transcribe these terms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      placeholder="Add a specialized term (e.g. 'PyTorch', 'GraphQL')"
                      value={newTerm}
                      onChange={(e) => setNewTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddTerm();
                        }
                      }}
                    />
                  </div>
                  <Button onClick={handleAddTerm} variant="outline" size="icon">
                    <Plus className="size-4" />
                  </Button>
                </div>

                {specializedTerms.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <ul className="divide-y">
                      {specializedTerms.map((term) => (
                        <li
                          key={term}
                          className="flex justify-between items-center px-4 py-2"
                        >
                          <span>{term}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveTerm(term)}
                            title="Remove term"
                          >
                            <Trash2 />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-center p-4 text-muted-foreground text-sm border rounded-md">
                    No specialized terms added yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
              <CardDescription>Built by Johannes Schießl.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="https://github.com/johannesschiessl/Voiceset"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full">
                  <svg
                    viewBox="0 0 24 24"
                    className="mr-2 h-4 w-4"
                    fill="currentColor"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
