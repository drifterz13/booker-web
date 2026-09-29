import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BooksProvider } from "~/features/books/books-context";
import { ChatProvider } from "~/features/chat/chat-context";
import Home from "~/routes/home";

export function renderChatPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

  render(
    <QueryClientProvider client={client}>
      <BooksProvider>
        <ChatProvider>
          <Home />
        </ChatProvider>
      </BooksProvider>
    </QueryClientProvider>,
  );

  return { user: userEvent.setup() };
}
