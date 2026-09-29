import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { BooksProvider } from "~/features/books/books-context";
import { ChatProvider } from "../chat-context";
import { ChatPage } from "./chat-page";

it("renders full-width chat before hydration with no PDF pane, divider, or viewer placeholder", () => {
  const html = renderToStaticMarkup(
    <BooksProvider>
      <ChatProvider>
        <ChatPage />
      </ChatProvider>
    </BooksProvider>,
  );
  const document = new DOMParser().parseFromString(html, "text/html");
  const chat = document.querySelector<HTMLElement>('[data-slot="resizable-panel"][id="chat"]');

  expect(chat?.style.flexBasis).toBe("100%");
  expect(document.querySelector('[id="pdf"]')).toBeNull();
  expect(document.querySelector('[data-slot="resizable-handle"]')).toBeNull();
  expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
  expect(html).not.toContain("Loading page");
});
