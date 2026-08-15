"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ClipboardList,
  Loader2,
  Megaphone,
  Search,
  User,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type SearchItem = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
};

type SearchGroup = {
  type: string;
  label: string;
  items: SearchItem[];
};

const GROUP_META: Record<string, { label: string; icon: LucideIcon }> = {
  campaigns: { label: "Campaigns", icon: Megaphone },
  creators: { label: "Creators", icon: User },
  brands: { label: "Brands", icon: Building2 },
  applications: { label: "Applications", icon: ClipboardList },
};

const FALLBACK_ICON: LucideIcon = Search;

export default function GlobalSearch() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [activeIndex, setActiveIndex] = useState(0);

  const triggerRef = useRef<HTMLInputElement>(null);
  const closedAtRef = useRef(0);

  const items = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  // Global ⌘K / Ctrl+K toggle.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Debounced search as the user types.
  useEffect(() => {
    if (!open || !query.trim()) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Search failed");
        const data = (await res.json()) as { groups: SearchGroup[] };
        setGroups(data.groups ?? []);
        setStatus("success");
        setActiveIndex(0);
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          setStatus("error");
        }
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      closedAtRef.current = Date.now();
    }
    setOpen(next);
    if (next) {
      setQuery("");
      setGroups([]);
      setStatus("idle");
      setActiveIndex(0);
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setGroups([]);
      setStatus("idle");
      setActiveIndex(0);
    } else {
      setStatus("loading");
      setActiveIndex(0);
    }
  };

  const selectItem = (item: SearchItem) => {
    setOpen(false);
    setQuery("");
    router.push(item.url);
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        items.length ? (i - 1 + items.length) % items.length : 0
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[activeIndex]) selectItem(items[activeIndex]);
    }
  };

  return (
    <>
      <div className="relative w-32 min-w-0 sm:w-48 lg:w-72">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={triggerRef}
          readOnly
          onClick={() => handleOpenChange(true)}
          onFocus={(e) => {
            if (Date.now() - closedAtRef.current > 150) {
              handleOpenChange(true);
            } else {
              e.currentTarget.blur();
            }
          }}
          placeholder="Search..."
          aria-label="Search"
          className="h-9 w-full cursor-pointer rounded-full pl-8 pr-14"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 items-center rounded  px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
          ⌘K
        </kbd>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="top-[12%] -translate-y-0 gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-xl"
        >
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search campaigns, creators, applications..."
              aria-label="Search dashboard"
              className="h-12 border-0 bg-transparent px-0 text-base shadow-none focus-visible:border-0 focus-visible:ring-0"
            />
              {query && (
                <button
                  type="button"
                  onClick={() => handleQueryChange("")}
                  aria-label="Clear search"
                className="shrink-0 cursor-pointer rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="max-h-[55vh] overflow-y-auto p-2">
            {status === "loading" && (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Searching...
              </div>
            )}

            {status === "idle" && (
             <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
  <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/50">
    <Search className="h-5 w-5 text-muted-foreground" />
  </div>

  <div>
    <p className="text-sm font-medium text-foreground">
      Search Konnectika
    </p>
    <p className="mt-1 text-xs text-muted-foreground">
      Search campaigns, creators, applications and more
    </p>
  </div>

  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
    <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">⌘</kbd>
    <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">K</kbd>
    <span>to search</span>
  </div>
</div>
            )}

            {status === "error" && (
              <div className="px-4 py-10 text-center text-sm text-destructive">
                Something went wrong while searching. Please try again.
              </div>
            )}

            {status === "success" && items.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                No results found for{" "}
                <span className="font-medium text-foreground">
                  &quot;{query.trim()}&quot;
                </span>
              </div>
            )}

            {status === "success" &&
              groups.map((group) => {
                const meta = GROUP_META[group.type] ?? {
                  label: group.label,
                  icon: FALLBACK_ICON,
                };
                const Icon = meta.icon;

                return (
                  <div key={group.type} className="mb-2">
                    <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      {meta.label}
                    </div>
                    {group.items.map((item) => {
                      const flatIndex = items.indexOf(item);
                      const active = flatIndex === activeIndex;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectItem(item)}
                          onMouseEnter={() => setActiveIndex(flatIndex)}
                          className={cn(
                            "flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                            active
                              ? "bg-muted text-foreground"
                              : "text-foreground"
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                              active
                                ? "bg-background text-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            <Icon className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {item.title}
                            </span>
                            {item.subtitle && (
                              <span className="block truncate text-xs text-muted-foreground">
                                {item.subtitle}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
            <span>
              <kbd className="mr-0.5 rounded border border-border bg-muted px-1 font-mono">↑</kbd>
              <kbd className="mr-0.5 rounded border border-border bg-muted px-1 font-mono">↓</kbd>
              navigate ·{" "}
              <kbd className="mr-0.5 rounded border border-border bg-muted px-1 font-mono">↵</kbd>
              select ·{" "}
              <kbd className="rounded border border-border bg-muted px-1 font-mono">esc</kbd>
              close
            </span>
            <kbd className="rounded border border-border bg-muted px-1.5 font-mono">⌘K</kbd>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
