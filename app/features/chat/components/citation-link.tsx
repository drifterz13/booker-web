import { Tooltip } from "radix-ui";
import { Button } from "~/shared/components/ui/button";
import { citationDescription } from "../citations";
import type { CitationSource } from "../types";

export function CitationLink({
  source,
  number,
  onCitation,
}: {
  source: CitationSource;
  number: number;
  onCitation: (source: CitationSource) => void;
}) {
  const description = citationDescription(source);

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <Button
          type="button"
          variant="link"
          size="xs"
          className="citation-link inline h-auto rounded-sm px-0.5 py-0 align-baseline text-sm leading-[inherit] font-medium no-underline hover:no-underline"
          aria-label={`Open citation: ${description}`}
          onClick={() => onCitation(source)}
        >
          [{number}]
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 max-w-72 rounded-md border bg-popover px-3 py-2 text-xs leading-5 text-popover-foreground shadow-surface"
        >
          {description}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
