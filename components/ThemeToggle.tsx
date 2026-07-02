"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  // null until mounted — avoids hydration mismatch with the head script.
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // private mode — theme just won't persist
    }
    setDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="nb-press inline-flex items-center justify-center size-10 rounded-md bg-surface border-2 border-ink shadow-[3px_3px_0_var(--color-ink)] cursor-pointer"
    >
      {dark === null ? (
        <span className="size-4" />
      ) : dark ? (
        <Sun className="size-4" aria-hidden />
      ) : (
        <Moon className="size-4" aria-hidden />
      )}
    </button>
  );
}
