import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Books from "~/routes/books";
import { BookUploadProvider } from "~/features/books/upload-context";
import { Toaster } from "~/shared/components/ui/sonner";

export function renderBooksPage() {
  const client = new QueryClient({
    defaultOptions: {
      // Surface API errors immediately instead of waiting through query retry delays.
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={client}>
      <BookUploadProvider>
        <Books />
      </BookUploadProvider>
      <Toaster />
    </QueryClientProvider>,
  );

  // Bypass the file picker's accept filter so validation stories reach the application.
  return { user: userEvent.setup({ applyAccept: false }) };
}
