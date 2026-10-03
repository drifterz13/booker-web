import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router";
import { useBooks } from "~/features/books/books-context";
import { cn } from "~/shared/lib/utils";
import {
  CONVERSATION_PAGE_SIZE,
  conversationKeys,
  listConversations,
  type ConversationSummary,
} from "../api/conversations";
import { useBookChat } from "../chat-context";

function groupConversations(conversations: ConversationSummary[]) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const yesterdayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 1,
  ).getTime();

  return [
    {
      period: "Today",
      items: conversations.filter((item) => Date.parse(item.updated_at) >= todayStart),
    },
    {
      period: "Yesterday",
      items: conversations.filter((item) => {
        const updated = Date.parse(item.updated_at);

        return updated >= yesterdayStart && updated < todayStart;
      }),
    },
    {
      period: "Earlier",
      items: conversations.filter((item) => Date.parse(item.updated_at) < yesterdayStart),
    },
  ].filter((group) => group.items.length > 0);
}

export function ConversationList({ onNavigate }: { onNavigate: () => void }) {
  const { books, selectedBook, loading, hasMore } = useBooks();
  const { activeConversationId, openingConversationId, openConversation } = useBookChat();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const query = useQuery({
    queryKey: conversationKeys.list,
    queryFn: ({ signal }) => listConversations(signal),
  });
  const conversations = (query.data ?? [])
    .slice()
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
    .slice(0, CONVERSATION_PAGE_SIZE);
  const groups = groupConversations(conversations);
  const pending = query.isPending || loading || hasMore;

  return (
    <section aria-label="Conversations">
      <h2 className="px-3 text-sm font-medium text-foreground">Conversations</h2>
      {pending ? (
        <output className="mt-4 block px-3 text-xs text-muted-foreground">
          Loading conversations…
        </output>
      ) : query.isError ? (
        <p role="alert" className="mt-4 px-3 text-xs text-danger">
          Could not load conversations.
        </p>
      ) : groups.length === 0 ? (
        <p className="mt-4 px-3 text-xs leading-5 text-muted-foreground">No conversations yet.</p>
      ) : (
        <div className="mt-4 space-y-5">
          {groups.map((group) => (
            <div key={group.period}>
              <h3 className="px-3 text-xs font-medium text-muted-foreground">{group.period}</h3>
              <ul className="mt-1 space-y-0.5">
                {group.items.map((conversation) => {
                  const isCurrent =
                    pathname === "/" &&
                    conversation.book_id === selectedBook?.id &&
                    conversation.id === activeConversationId;
                  const bookTitle = books.find(
                    (book) => book.id === conversation.book_id,
                  )?.filename;

                  return (
                    <li key={conversation.id}>
                      <button
                        type="button"
                        aria-current={isCurrent ? "page" : undefined}
                        disabled={openingConversationId === conversation.id}
                        onClick={async () => {
                          if (
                            conversation.book_id !== selectedBook?.id ||
                            conversation.id !== activeConversationId
                          ) {
                            const opened = await openConversation(
                              conversation.book_id,
                              conversation.id,
                            );

                            if (!opened) return;
                          }

                          await navigate("/");
                          onNavigate();
                        }}
                        className={cn(
                          "flex min-h-12 w-full flex-col justify-center rounded-lg px-3 py-2 text-left transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60",
                          isCurrent && "bg-secondary text-primary",
                        )}
                      >
                        <span
                          className={cn(
                            "block w-full truncate text-sm font-medium leading-5 text-foreground",
                            isCurrent && "text-primary",
                          )}
                          title={conversation.title}
                        >
                          {conversation.title}
                        </span>
                        <span
                          className="block w-full truncate text-xs leading-4 text-muted-foreground"
                          title={bookTitle}
                        >
                          {bookTitle}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
