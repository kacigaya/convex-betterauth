"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export default function DarkModeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Button
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      size="icon"
      variant="outline"
    >
      {isDark ? (
        <Sun aria-hidden="true" />
      ) : (
        <Moon aria-hidden="true" />
      )}
    </Button>
  );
}
