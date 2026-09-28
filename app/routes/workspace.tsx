import { BooksProvider } from "~/features/books/books-context";
import { ChatProvider } from "~/features/chat/chat-context";
import { AppShell } from "~/shared/components/app-shell";

export default function Workspace() {
  return (
    <BooksProvider>
      <ChatProvider>
        <AppShell />
      </ChatProvider>
    </BooksProvider>
  );
}
