import { useState } from "react";
import { useBooks } from "~/features/books/books-context";
import { BookPreview } from "~/features/books/components/book-preview";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/shared/components/ui/resizable";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "~/shared/components/ui/sheet";
import { useMediaQuery } from "~/shared/hooks/use-media-query";
import { useBookChat } from "../chat-context";
import { ChatSession } from "../components/chat-session";

export function ChatPage() {
  const { session } = useBookChat();
  const { selectedBook } = useBooks();
  const desktop = useMediaQuery("(min-width: 1200px)");
  const [closedBookId, setClosedBookId] = useState<string>();
  const previewOpen = Boolean(selectedBook && closedBookId !== selectedBook.id);
  const showDesktopPreview = desktop && previewOpen;

  function togglePreview() {
    setClosedBookId(previewOpen ? selectedBook?.id : undefined);
  }

  return (
    <div className="h-full min-h-0">
      <ResizablePanelGroup orientation="horizontal" id="book-chat">
        <ResizablePanel
          id="chat"
          defaultSize={showDesktopPreview ? "55%" : "100%"}
          minSize={showDesktopPreview ? "360px" : "0%"}
        >
          <div data-chat-scroll className="@container h-full overflow-y-auto">
            <ChatSession
              key={session}
              onTogglePreview={togglePreview}
              onBookSelected={() => setClosedBookId(undefined)}
              previewOpen={previewOpen}
            />
          </div>
        </ResizablePanel>
        {showDesktopPreview && selectedBook && (
          <>
            <ResizableHandle
              withHandle
              aria-label="Resize chat and PDF preview"
              className="w-2 bg-sidebar hover:bg-secondary"
            />
            <ResizablePanel id="pdf" defaultSize="45%" minSize="320px">
              <BookPreview
                key={selectedBook.id}
                book={selectedBook}
                onClose={() => setClosedBookId(selectedBook.id)}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
      {selectedBook && (
        <Sheet
          open={!desktop && previewOpen}
          onOpenChange={(open) => setClosedBookId(open ? undefined : selectedBook.id)}
        >
          <SheetContent
            side="right"
            showCloseButton={false}
            className="w-full gap-0 p-0 sm:max-w-none"
          >
            <SheetTitle className="sr-only">PDF preview</SheetTitle>
            <SheetDescription className="sr-only">
              Read your selected book and return to the chat when you are ready.
            </SheetDescription>
            {selectedBook && (
              <BookPreview
                key={selectedBook.id}
                book={selectedBook}
                onClose={() => setClosedBookId(selectedBook.id)}
              />
            )}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
