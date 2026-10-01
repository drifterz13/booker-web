import { BookMotion } from "~/shared/components/book-motion";

export function ChatWelcome() {
  return (
    <div className="mb-block-gap">
      <BookMotion className="mb-4 size-12" />
      <h1 className="text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
        Good to see you.
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
        What will you discover today?
      </p>
    </div>
  );
}
