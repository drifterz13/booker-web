import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router";
import { useChat } from "~/features/chat/chat-context";
import { useBooks } from "../books-context";
import { BookCard } from "../components/book-card";
import { BookUploadButton } from "../components/book-upload-button";

export function BooksPage() {
  const { books, selectBook } = useBooks();
  const { newChat } = useChat();
  const navigate = useNavigate();
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-12 sm:px-10">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Your reading space
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">My books</h1>
        </div>
        <BookUploadButton onAdded={newChat} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        A place for your books, and the questions they inspire.
      </p>
      {books.length === 0 ? (
        <div className="mt-14 flex flex-col items-center rounded-2xl border border-dashed px-6 py-20 text-center">
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
            <BookOpen className="size-6" />
          </div>
          <h2 className="text-lg font-medium">Your next read starts here</h2>
          <p className="mt-2 mb-6 max-w-xs text-sm leading-6 text-muted-foreground">
            Add a PDF to your library and start exploring it with Booker.
          </p>
          <BookUploadButton variant="outline" onAdded={newChat} />
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onOpen={() => {
                selectBook(book.id);
                newChat();
                navigate("/");
              }}
            />
          ))}
        </div>
      )}
      <p className="mt-6 text-xs leading-5 text-muted-foreground">
        PDF files up to 100 MB. Books stay in this tab for this visit.
      </p>
    </section>
  );
}
