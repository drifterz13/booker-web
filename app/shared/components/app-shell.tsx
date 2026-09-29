import { useState } from "react";
import { PanelLeftOpen } from "lucide-react";
import { Outlet, useLocation } from "react-router";
import { useBookChat } from "~/features/chat/chat-context";
import { AppSidebar } from "./app-sidebar";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "./ui/sheet";
import { cn } from "../lib/utils";

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { newChat } = useBookChat();
  const { pathname } = useLocation();
  const pageName = pathname === "/books" ? "My books" : "Booker";
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex h-dvh overflow-hidden">
      <a
        href="#main-content"
        className="sr-only fixed top-2 left-2 z-60 rounded-md bg-white p-3 focus:not-sr-only"
      >
        Skip to content
      </a>
      <div className={cn("hidden h-dvh", !collapsed && "md:flex")}>
        <AppSidebar
          onNewChat={newChat}
          onClose={() => setCollapsed(true)}
          onNavigate={closeMobile}
        />
      </div>
      <main id="main-content" tabIndex={-1} className="flex min-w-0 flex-1 flex-col outline-none">
        <div className="flex items-center gap-3 border-b px-4 py-3 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Open sidebar">
                <PanelLeftOpen className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              showCloseButton={false}
              className="w-64 gap-0 p-0 sm:max-w-64"
            >
              <SheetTitle className="sr-only">Booker navigation</SheetTitle>
              <SheetDescription className="sr-only">
                Start a new chat or browse your books.
              </SheetDescription>
              <AppSidebar
                id="mobile-sidebar"
                onNewChat={newChat}
                onClose={closeMobile}
                onNavigate={closeMobile}
              />
            </SheetContent>
          </Sheet>
          <span className="text-sm font-medium">{pageName}</span>
        </div>
        {collapsed && (
          <div className="hidden items-center gap-3 border-b px-4 py-3 md:flex">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Open sidebar"
              aria-controls="app-sidebar"
              aria-expanded={false}
              onClick={() => setCollapsed(false)}
            >
              <PanelLeftOpen className="size-4" />
            </Button>
            <span className="text-sm font-medium">{pageName}</span>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
