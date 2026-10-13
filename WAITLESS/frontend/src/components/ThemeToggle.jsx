import { Check, Monitor, Moon, Sun } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/utils/cn";

const THEME_OPTIONS = [
  { value: "light", label: "Light", description: "Always use the light theme", icon: Sun },
  { value: "dark", label: "Dark", description: "Always use the dark theme", icon: Moon },
  {
    value: "system",
    label: "System",
    description: "Follow device settings",
    icon: Monitor,
  },
];

const VARIANT_STYLES = {
  light:
    "border border-border/70 bg-background/70 text-muted-foreground hover:bg-muted hover:text-foreground",
  dark: "border border-cyan-300/35 bg-cyan-300/12 text-cyan-50 hover:bg-cyan-300/20 hover:text-white",
  ghost:
    "border border-white/15 bg-white/[0.06] text-slate-100 hover:bg-white/[0.12]",
};

export function ThemeToggle({ variant = "light", className }) {
  const { preference, isDark, setPreference } = useTheme();

  const TriggerIcon =
    preference === "system" ? Monitor : isDark ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Change color theme"
          title="Theme: Light, Dark or System"
          className={cn(
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
            VARIANT_STYLES[variant] ?? VARIANT_STYLES.light,
            className
          )}
        >
          <TriggerIcon className="h-[18px] w-[18px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEME_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => setPreference(option.value)}
            className="gap-3"
          >
            <option.icon className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {option.description}
              </span>
            </span>
            {preference === option.value ? (
              <Check className="h-4 w-4 shrink-0 text-primary" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
