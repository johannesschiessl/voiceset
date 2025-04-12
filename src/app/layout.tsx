import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FeedbackButton } from "@/components/feedback-button";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voiceset",
  description: "Speak your thoughts. Shape your ideas.",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Voiceset",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-muted`}
      >
        <div className="p-4">
          {children}
          <FeedbackButton floating />
        </div>
        <Toaster position="top-center" expand={false} richColors />
      </body>
    </html>
  );
}
