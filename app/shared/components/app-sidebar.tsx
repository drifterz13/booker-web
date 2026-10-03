import { Library, PanelLeftClose, SquarePen } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router";
import { useBooks } from "~/features/books/books-context";
import { useBookChat } from "~/features/chat/chat-context";
import { ConversationList } from "~/features/chat/components/conversation-list";
import bookerIcon from "../assets/booker-icon.svg";
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
  const { books, hasMore, loading } = useBooks();
  const { activeConversationId } = useBookChat();
  const { pathname } = useLocation();
  const isNewChat = pathname === "/" && !activeConversationId;
  const navClass = (isActive: boolean) =>
    cn(
      "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm leading-5 transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary",
      isActive && "bg-secondary font-medium text-primary",
    );

  return (
    <aside
      id={id}
      aria-label="Main sidebar"
      className="flex h-full w-72 shrink-0 flex-col border-r bg-surface-subtle p-4"
    >
      <div className="flex min-h-10 items-center justify-between pl-3">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Collapse sidebar"
          onClick={onClose}
        >
          <PanelLeftClose className="size-4" />
        </Button>
      </div>
      <nav aria-label="Main navigation" className="mt-6 space-y-1">
        <Link
          to="/"
          aria-current={isNewChat ? "page" : undefined}
          className={navClass(isNewChat)}
          onClick={() => {
            onNewChat();
            onNavigate();
          }}
        >
          <SquarePen aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.7} />
          New chat
        </Link>
        <NavLink to="/books" className={({ isActive }) => navClass(isActive)} onClick={onNavigate}>
          <Library aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.7} />
          My books
          <span className="ml-auto text-xs text-muted-foreground">
            {loading ? "…" : `${books.length}${hasMore ? "+" : ""}`}
          </span>
        </NavLink>
      </nav>
      <div className="mt-6 min-h-0 flex-1 overflow-y-auto border-t pt-5">
        <ConversationList onNavigate={onNavigate} />
      </div>
    </aside>
  );
}
