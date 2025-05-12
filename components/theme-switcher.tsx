"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-9 w-9 rounded-full border-none bg-secondary/50 backdrop-blur-sm transition-all "
        >
          <Sun size={16} className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon size={16} className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px] rounded-xl p-2 border-border/40 bg-card/95 backdrop-blur-sm">
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem 
            value="light" 
            className="flex gap-2 cursor-pointer rounded-lg focus:bg-accent focus:text-accent-foreground"
          >
            <Sun size={16} className="text-yellow-500" /> 
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem 
            value="dark" 
            className="flex gap-2 cursor-pointer rounded-lg focus:bg-accent focus:text-accent-foreground"
          >
            <Moon size={16} className="text-indigo-400" /> 
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem 
            value="system" 
            className="flex gap-2 cursor-pointer rounded-lg focus:bg-accent focus:text-accent-foreground"
          >
            <Laptop size={16} className="text-accent" /> 
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { ThemeSwitcher };
