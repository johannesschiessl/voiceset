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
        </div>
      </div>
    </div>
  );
}
