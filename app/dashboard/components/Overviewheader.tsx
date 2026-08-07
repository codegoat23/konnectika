"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";

const RANGE_OPTIONS = [

  "This Week",
  "This Month",
  "Last Month",
  "Last 3 Months",
  
];

export interface OverviewHeaderProps {
  title: string;
  /** Controlled value, e.g. "April 10, 2026 - May 11, 2026" */
  value?: string;
  onValueChange?: (value: string) => void;
  options?: string[];
}

export function OverviewHeader({
  title,
  value,
  onValueChange,
  options = RANGE_OPTIONS,
}: OverviewHeaderProps) {
  const [internalValue, setInternalValue] = useState(options[2]);
  const selected = value ?? internalValue;

  const handleSelect = (option: string) => {
    setInternalValue(option);
    onValueChange?.(option);
  };

  return (
    <div className="flex items-center justify-between px-4 lg:px-6">
      <h2 className="text-xl font-semibold">{title}</h2>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="rounded-full gap-2 text-xs font-medium text-muted-foreground border-border"
          >
            <CalendarIcon className="size-3.5" />
            {selected}
            <ChevronDownIcon className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 border-border bg-popover backdrop-blur-md rounded-2xl"
        style={{ borderRadius: "14px" }}
        >
          {options.map((option) => (
            <DropdownMenuItem key={option} onClick={() => handleSelect(option)} className="">
              {option}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}