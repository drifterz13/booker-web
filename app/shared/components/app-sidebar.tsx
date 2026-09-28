import { BookOpen, Library, PanelLeftClose, SquarePen } from "lucide-react";
import { Link, NavLink } from "react-router";
import { useBooks } from "~/features/books/books-context";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

export function AppSidebar({
  onNewChat,
  onClose,
  onNavigate,
  id = "app-sidebar",
}: {
  onNewChat: () => void;
  onClose: () => void;
  onNavigate: () => void;
  id?: string;
}) {
  const { books } = useBooks();
  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary",
      isActive && "bg-secondary font-medium",
    );
  return (
    <aside
      id={id}
      aria-label="Main sidebar"
      className="flex h-full w-64 shrink-0 flex-col overflow-y-auto border-r bg-sidebar p-4 md:w-56 lg:w-60"
    >
      <div className="flex items-center justify-between px-2 pt-2">
        <Link
          to="/"
          className="flex items-center gap-2.5"
          aria-label="Booker home"
          onClick={onNavigate}
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
            <BookOpen className="size-4" strokeWidth={1.7} />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            booker<span className="text-primary">.</span>
          </span>
        </Link>
        <Button variant="ghost" size="icon-sm" aria-label="Collapse sidebar" onClick={onClose}>
          <PanelLeftClose className="size-4 text-muted-foreground" />
        </Button>
      </div>
      <nav aria-label="Main navigation" className="mt-11 space-y-1">
        <NavLink
          to="/"
          end
          className={navClass}
          onClick={() => {
            onNewChat();
            onNavigate();
          }}
        >
          <SquarePen className="size-4" strokeWidth={1.7} />
          New chat
        </NavLink>
        <NavLink to="/books" className={navClass} onClick={onNavigate}>
          <Library className="size-4" strokeWidth={1.7} />
          My books<span className="ml-auto text-xs text-muted-foreground">{books.length}</span>
        </NavLink>
      </nav>
      <div className="mt-9 border-t px-3 pt-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Your library
        </p>
        {books.length === 0 ? (
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            A good book is a great beginning.
            <br />
            Add your first one to get started.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {books.slice(-5).map((book) => (
              <li key={book.id}>
                <Link
                  to="/books"
                  onClick={onNavigate}
                  className="flex items-center gap-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <BookOpen className="size-3.5 shrink-0" />
                  <span className="truncate">{book.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-auto px-3 pt-12 pb-2">
        <p className="text-xs font-medium">Read. Ask. Discover.</p>
        <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">
          A quieter space to explore your books.
        </p>
      </div>
    </aside>
  );
}
