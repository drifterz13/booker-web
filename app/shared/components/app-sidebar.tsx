import { Library, MessageCircle, PanelLeftClose, SquarePen } from "lucide-react";
import { Link, NavLink } from "react-router";
import { useBooks } from "~/features/books/books-context";
import bookerIcon from "../assets/booker-icon.svg";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

const sampleConversations = [
  {
    period: "Today",
    items: [
      { title: "The case for doing less", book: "Rework" },
      { title: "How to make ideas stick", book: "Made to Stick" },
      { title: "When should we change course?", book: "Rework" },
    ],
  },
  {
    period: "Yesterday",
    items: [
      { title: "What makes a useful habit?", book: "Atomic Habits" },
      { title: "Finding the main argument", book: "The Art of War" },
      { title: "A practical reading plan", book: "Deep Work" },
    ],
  },
  {
    period: "Earlier",
    items: [
      { title: "Strategy and uncertainty", book: "The Art of War" },
      { title: "A simpler way to model domains", book: "Learning DDD" },
      { title: "How teams make decisions", book: "Rework" },
      { title: "The most useful examples", book: "Learning DDD" },
    ],
  },
];

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
  const { books, hasMore, loading } = useBooks();
  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary",
      isActive && "bg-secondary font-medium",
    );

  return (
    <aside
      id={id}
      aria-label="Main sidebar"
      className="flex h-full w-72 shrink-0 flex-col border-r bg-surface-subtle p-4"
    >
      <div className="flex items-center justify-between px-2 pt-2">
        <Link
          to="/"
          className="flex items-center gap-2.5"
          aria-label="Booker home"
          onClick={onNavigate}
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <img src={bookerIcon} alt="" className="size-4 brightness-0 invert" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            booker<span className="text-primary">.</span>
          </span>
        </Link>
        <Button variant="ghost" size="icon-sm" aria-label="Collapse sidebar" onClick={onClose}>
          <PanelLeftClose className="size-4 text-muted-foreground" />
        </Button>
      </div>
      <nav aria-label="Main navigation" className="mt-section-gap space-y-1">
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
          My books
          <span className="ml-auto text-xs text-muted-foreground">
            {loading ? "…" : `${books.length}${hasMore ? "+" : ""}`}
          </span>
        </NavLink>
      </nav>
      <div className="mt-6 min-h-0 flex-1 overflow-y-auto border-t pt-4">
        <section aria-label="Sample conversations">
          <div className="flex items-center justify-between px-3">
            <h2 className="text-sm font-medium text-foreground">Conversations</h2>
            <span className="rounded-md bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
              Preview
            </span>
          </div>
          <div className="mt-4 space-y-4">
            {sampleConversations.map((group) => (
              <div key={group.period}>
                <h3 className="px-3 text-xs font-medium text-muted-foreground">{group.period}</h3>
                <ul className="mt-1">
                  {group.items.map((conversation) => (
                    <li key={conversation.title} className="flex gap-3 rounded-lg px-3 py-1">
                      <MessageCircle
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0"
                        strokeWidth={1.7}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm leading-5 text-foreground">
                          {conversation.title}
                        </p>
                        <p className="truncate text-xs leading-4 text-muted-foreground">
                          {conversation.book}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
