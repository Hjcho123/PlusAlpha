import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const ThemeToggle = () => {
  const { isDark, toggleTheme, isLoaded } = useTheme();

  // Don't render until theme is loaded to avoid flash
  if (!isLoaded) {
    return (
      <button
        className="h-9 w-9 flex items-center justify-center rounded-md border border-border bg-transparent text-foreground opacity-50"
        aria-label="Loading theme"
      >
        <div className="h-4 w-4 rounded-full border-2 border-transparent" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="h-9 w-9 flex items-center justify-center rounded-md border border-none bg-transparent text-foreground hover:text-accent transition-colors duration-200"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
};

export default ThemeToggle;