# Booker

Booker web is the React frontend for asking questions about PDF books. Select a
book, preview it beside the chat, and explore its ideas. The interface is being
built to replace Chainlit; PDF indexing and AI answers are not connected yet.

## Technology

- **Application:** React, TypeScript, React Router, and Vite.
- **UI:** Tailwind CSS, shadcn/ui with Radix primitives, and Lucide icons.
- **PDF preview:** React-PDF and PDF.js for local rendering, with
  react-resizable-panels for the chat and preview layout.
- **Development:** pnpm, Vitest, React Testing Library, Oxlint, and Oxfmt.

Components are organized by feature under `app/features/chat/` and
`app/features/books/`. Route modules live in `app/routes/`; reusable controls
and layout components live in `app/shared/components/`.

## Prerequisites

- Node.js 22.13.0 or newer and pnpm.
- A modern browser and a PDF up to 100 MB to try the reader.
- An unlocked, readable PDF. Password-protected or damaged PDFs cannot be
  previewed.

An OpenAI API key is not required for the current frontend preview.

## Install

```sh
pnpm install --frozen-lockfile
```

No environment configuration is needed yet. Selected files are rendered locally
in the browser; book text is not sent to a server or an AI provider.

## Run

```sh
pnpm dev
```

Open the URL printed by Vite and select **Add a book**. **My books** shows the
files selected during this visit. Selected books open beside chat on screens
at least 1200 px wide. Drag the divider or focus it and use the arrow keys to
resize. On smaller screens, **View PDF** opens a full-width preview.

The reader supports page navigation, zoom, fit to width, text selection, and
download. You can hide the preview and reopen it from the chat header. PDF.js
and its worker are bundled locally and loaded when needed.

Books and conversations stay in memory while navigating between pages.
Refreshing clears them. Submitted questions appear in the conversation, but
indexing, persistence, and AI answers still require backend integration.

## Tests and checks

```sh
pnpm test
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
```

Use `pnpm lint:fix` for automatic lint fixes and `pnpm format` to format with
Oxfmt. Keep the direct `pdfjs-dist` version in sync with React-PDF's dependency
when updating the reader.
