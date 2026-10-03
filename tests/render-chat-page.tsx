import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { BooksProvider } from "~/features/books/books-context";
import { ChatProvider } from "~/features/chat/chat-context";
import Home from "~/routes/home";

export function renderChatPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <BooksProvider>
          <ChatProvider>
            <Home />
          </ChatProvider>
        </BooksProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { user: userEvent.setup() };
}
