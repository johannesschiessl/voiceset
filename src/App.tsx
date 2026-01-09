import { useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import HomePage from "@/pages/home";
import SettingsPage from "@/pages/settings";

export type Page = "home" | "settings";

export default function App() {
  const [page, setPage] = useState<Page>("home");

  return (
    <ThemeProvider defaultTheme="system" storageKey="voiceset-theme">
      <div className="antialiased bg-muted min-h-screen">
        <div className="p-4">
          {page === "home" && <HomePage navigate={setPage} />}
          {page === "settings" && <SettingsPage navigate={setPage} />}
        </div>
        <Toaster position="top-center" expand={false} richColors />
      </div>
    </ThemeProvider>
  );
}
