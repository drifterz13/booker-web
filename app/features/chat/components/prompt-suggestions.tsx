import { ArrowUpRight, List, Lightbulb, MessageCircle } from "lucide-react";
import { Button } from "~/shared/components/ui/button";

const suggestions = [
  {
    icon: List,
    title: "Find the big picture",
    description: "Summarize the key ideas",
    prompt: "Summarize the key ideas in this book.",
  },
  {
    icon: Lightbulb,
    title: "Go a little deeper",
    description: "Explain a concept simply",
    prompt: "Explain the most important concept in this book in simple terms.",
  },
  {
    icon: MessageCircle,
    title: "Put ideas into practice",
    description: "Take away something useful",
    prompt: "What practical lessons can I take away from this book?",
  },
];

export function PromptSuggestions({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="mt-block-gap">
      <p className="mb-3 text-xs text-muted-foreground">A few places to start</p>
      <div className="grid gap-3 @min-[560px]:grid-cols-3">
        {suggestions.map(({ icon: Icon, title, description, prompt }) => (
          <Button
            key={title}
            variant="outline"
            onClick={() => onSelect(prompt)}
            className="group h-auto flex-row items-center gap-3 rounded-xl p-4 text-left font-normal whitespace-normal shadow-none @min-[560px]:flex-col @min-[560px]:items-start"
          >
            <div className="flex items-center justify-between @min-[560px]:w-full">
              <Icon className="size-4 text-primary" strokeWidth={1.6} />
              <ArrowUpRight className="hidden size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 @min-[560px]:block" />
            </div>
            <div>
              <span className="block text-xs font-medium">{title}</span>
              <span className="mt-1 block text-caption leading-4 text-muted-foreground">
                {description}
              </span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
