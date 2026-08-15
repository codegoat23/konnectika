"use client";

import * as React from "react";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const current =
    themes.find((t) => t.value === theme) ?? themes[2];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Change theme"
          className="
            size-9
            rounded-xl
            border border-transparent
            text-muted-foreground
            transition-colors
            hover:border-border
            hover:bg-muted
            hover:text-foreground
            focus-visible:ring-2
            focus-visible:ring-primary/30
          "
        >
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="
          w-44
          rounded-xl
          border-border
          bg-card
          p-1.5
          shadow-lg
        "
      >
        <DropdownMenuLabel className="px-2.5 py-2 text-xs font-medium text-muted-foreground">
          Appearance
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-border" />

        {themes.map(({ value, label, icon: Icon }) => {
          const isActive = current.value === value;

          return (
            <DropdownMenuItem
              key={value}
              onClick={() => setTheme(value)}
              className="
                flex
                cursor-pointer
                items-center
                justify-between
                rounded-lg
                px-2.5
                py-2
                text-sm
                text-foreground
                outline-none
                transition-colors
                focus:bg-muted
                focus:text-foreground
              "
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={`
                    flex size-7 items-center justify-center rounded-md
                    ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }
                  `}
                >
                  <Icon className="size-3.5" />
                </span>

                <span>{label}</span>
              </span>

              {isActive && (
                <Check className="size-4 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}