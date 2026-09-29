import { BooksProvider } from "~/features/books/books-context";
import { ChatProvider } from "~/features/chat/chat-context";
import { AppShell } from "~/shared/components/app-shell";

import { BookUploadProvider } from "~/features/books/upload-context";

export default function Workspace() {
  return (
    <BookUploadProvider>
      <BooksProvider>
        <ChatProvider>
          <AppShell />
        </ChatProvider>
      </BooksProvider>
    </BookUploadProvider>
  );
}
