import { useRef, useState } from "react";
import { useBooks } from "~/features/books/books-context";
import { BookPreview, type CitationNavigation } from "~/features/books/components/book-preview";
import type { CitationSource } from "../types";
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
  const { selectedBook, books } = useBooks();
  const desktop = useMediaQuery("(min-width: 1200px)");
  const [closedBookId, setClosedBookId] = useState<string>();
  const [mobilePreviewActivated, setMobilePreviewActivated] = useState(false);
  const citationRequest = useRef(0);
  const [citationTarget, setCitationTarget] = useState<{
    chatBookId: string;
    bookId: string;
    navigation: CitationNavigation;
  }>();
  const activeCitation =
    citationTarget?.chatBookId === selectedBook?.id ? citationTarget : undefined;
  const previewBook = activeCitation
    ? (books.find((book) => book.id === activeCitation.bookId) ?? {
        id: activeCitation.bookId,
        filename: "Cited book",
      })
    : selectedBook;
  const previewOpen = Boolean(
    previewBook && closedBookId !== previewBook.id && (desktop || mobilePreviewActivated),
  );
  const showDesktopPreview = desktop && previewOpen;

  function togglePreview() {
    setMobilePreviewActivated(true);
    setClosedBookId(previewOpen ? previewBook?.id : undefined);
  }

  function openCitation(source: CitationSource) {
    if (!selectedBook) return;

    setCitationTarget({
      chatBookId: selectedBook.id,
      bookId: source.book_id,
      navigation: { requestId: ++citationRequest.current, pages: source.pdf_pages },
    });
    setClosedBookId(undefined);
    setMobilePreviewActivated(true);
  }

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <ResizablePanelGroup orientation="horizontal" id="book-chat">
        <ResizablePanel
          id="chat"
          defaultSize={showDesktopPreview ? "55%" : "100%"}
          minSize={showDesktopPreview ? "360px" : "0%"}
        >
          <div className="@container h-full min-h-0">
            <ChatSession
              key={session}
              onTogglePreview={togglePreview}
              onCitation={openCitation}
              onBookSelected={() => {
                setCitationTarget(undefined);
                setClosedBookId(undefined);
                setMobilePreviewActivated(true);
              }}
              previewOpen={previewOpen}
            />
          </div>
        </ResizablePanel>
        {showDesktopPreview && previewBook && (
          <>
            <ResizableHandle
              withHandle
              aria-label="Resize chat and PDF preview"
              className="w-2 bg-surface-subtle hover:bg-secondary"
            />
            <ResizablePanel id="pdf" defaultSize="45%" minSize="320px">
              <div className="pdf-preview-enter h-full min-h-0">
                <BookPreview
                  key={previewBook.id}
                  book={previewBook}
                  citation={activeCitation?.navigation}
                  onClose={() => setClosedBookId(previewBook.id)}
                />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
      {previewBook && (
        <Sheet
          open={!desktop && previewOpen}
          onOpenChange={(open) => {
            setMobilePreviewActivated(open);
            setClosedBookId(open ? undefined : previewBook.id);
          }}
        >
          <SheetContent
            side="right"
            showCloseButton={false}
            className="pdf-preview-sheet w-full gap-0 p-0 sm:max-w-none motion-reduce:animate-none"
          >
            <SheetTitle className="sr-only">PDF preview</SheetTitle>
            <SheetDescription className="sr-only">
              Read your selected book and return to the chat when you are ready.
            </SheetDescription>
            {previewBook && (
              <BookPreview
                key={previewBook.id}
                book={previewBook}
                citation={activeCitation?.navigation}
                onClose={() => setClosedBookId(previewBook.id)}
              />
            )}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
