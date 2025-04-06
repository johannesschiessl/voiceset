"use client";

import { useState, type CSSProperties } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

interface ErrorDetail {
  message: string;
}

interface ApiError {
  details: ErrorDetail[];
}

const priorities = ["low", "medium", "high", "critical"] as const;
export type Priority = (typeof priorities)[number];

const createFeedbackFormSchema = (priorityEnabled: boolean) =>
  z
    .object({
      content: z
        .string()
        .min(1, "Please enter your feedback")
        .max(2000, "Feedback must be less than 2000 characters"),
      priority: priorityEnabled
        ? z.enum(priorities)
        : z.enum(priorities).nullable(),
      tags: z.array(z.string()),
      includeEmail: z.boolean(),
    })
    .required({
      content: true,
      tags: true,
      includeEmail: true,
    })
    .transform((data) => ({
      ...data,
      priority: priorityEnabled ? data.priority : null,
    }));

type FeedbackFormValues = {
  content: string;
  priority: Priority | null;
  tags: string[];
  includeEmail: boolean;
};

export type FeedbackButtonProps = {
  appId?: string;
  userEmail?: string | null;
  floating?: boolean;
  endpoint?: string;
  trigger?: React.ReactNode;
  priority?: boolean;
  tags?: string[];
};

export function FeedbackButton({
  appId = process.env.NEXT_PUBLIC_IGNOTUM_FEEDBACK_APP_ID,
  userEmail = null,
  floating = false,
  endpoint = "https://feedback.ignotum.dev/api/feedback",
  trigger,
  tags = [],
  priority = false,
}: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultValues: FeedbackFormValues = {
    content: "",
    priority: priority ? "medium" : null,
    tags: [],
    includeEmail: false,
  };

  const feedbackFormSchema = createFeedbackFormSchema(priority);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const requestBody = {
        appId,
        content: values.content,
        ...(values.priority && { priority: values.priority }),
        ...(values.tags?.length > 0 && { tags: values.tags }),
        ...(values.includeEmail && userEmail && { email: userEmail }),
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.details) {
          const errorMessage = (error as ApiError).details
            .map((detail: ErrorDetail) => detail.message)
            .join(", ");
          throw new Error(errorMessage);
        }
        throw new Error("Failed to submit feedback");
      }

      form.reset(defaultValues);
      setIsOpen(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to submit feedback. Please try again.",
      );
    }
  });

  const buttonStyles: CSSProperties = floating
    ? {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 50,
      }
    : {};

  const toggleTag = (tag: string) => {
    const currentTags = form.getValues("tags") || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    form.setValue("tags", newTags, { shouldValidate: true });
  };

  return (
    <>
      <div style={buttonStyles}>
        {trigger ? (
          <div onClick={() => setIsOpen(true)}>{trigger}</div>
        ) : (
          <Button onClick={() => setIsOpen(true)} variant="outline">
            Feedback
          </Button>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              {priority && (
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feedback</FormLabel>
                    <FormControl>
                      <Textarea
                        className="max-h-[200px] resize-none	"
                        placeholder="Tell us what you think..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {tags.length > 0 && (
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Button
                            key={tag}
                            variant={
                              field.value?.includes(tag) ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => toggleTag(tag)}
                            type="button"
                          >
                            {tag}
                          </Button>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
              )}

              {userEmail && (
                <FormField
                  control={form.control}
                  name="includeEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="leading-none">
                        <FormLabel>Include my email ({userEmail})</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              {error && <div className="text-destructive text-sm">{error}</div>}

              <div className="flex justify-end space-x-2 mt-4">
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => form.reset()}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Feedback"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
