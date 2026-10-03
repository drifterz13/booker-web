import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: "!rounded-lg !border-border !bg-background !text-foreground !shadow-md",
          description: "!text-muted-foreground",
          error: "!border-danger/30",
          success: "!border-success/30",
        },
      }}
    />
  );
}
