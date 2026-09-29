# Booker

Booker web is the React frontend for asking questions about PDF books. Select a
book, preview it beside the chat, and explore its ideas. The interface is being
built to replace Chainlit; saved-library uploads start backend indexing, while
chat answers are not connected yet.

## Technology

- **Application:** React, TypeScript, React Router, and Vite.
- **Server data:** TanStack Query for the saved library and book creation.
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

The saved library uses the Booker API, defaulting to `http://127.0.0.1:8000`.
Copy `.env.example` to `.env` to change `VITE_API_BASE_URL`, then restart Vite.
Start the backend and its storage service and create its configured bucket first.
The API must allow your web origin. Storage must allow presigned PUT requests
and expose the `ETag` response header to that origin.

## Run

```sh
pnpm dev
```

Open the URL printed by Vite and visit **My books**. **Add a book** uploads a PDF
directly to storage in 8 MiB parts, with three concurrent transfers and byte-based
progress. Unfinished uploads can be cancelled; failed PUTs are retried up to two
times. After completion, the app creates the book and refreshes the saved library.
If creation fails, **Retry creating book** reuses the uploaded object. Check the
library first if the response was lost, since the API rejects duplicate object keys.
Uploads survive navigation within the workspace, but not a browser refresh.
The library has 20-book pages and displays upload status and cover thumbnails.

The chat page still uses local files; connecting saved books to the chat selector
and remote PDF preview is a separate step. Selected local books open beside chat on screens
at least 1200 px wide. Drag the divider or focus it and use the arrow keys to
resize. On smaller screens, **View PDF** opens a full-width preview.

The reader supports page navigation, zoom, fit to width, text selection, and
download. You can hide the preview and reopen it from the chat header. PDF.js
and its worker are bundled locally and loaded when needed.

Saved library books persist through the API. Local chat selections and conversations
stay in memory while navigating and are cleared on refresh. Submitted questions
appear in the conversation; AI answers are not connected yet.

## Tests and checks

```sh
pnpm test
pnpm lint
pnpm format:check
pnpm typecheck
pnpm build
```

Use `pnpm lint:fix` for automatic lint fixes and `pnpm format` to format with
Oxfmt. Oxlint loads `@stylistic/eslint-plugin` to enforce blank lines after
variable declarations, before returns and throws, and around control-flow blocks,
functions, classes, type aliases, and interfaces. Consecutive variable declarations
can stay together.
Run `pnpm lint:fix` before `pnpm format` when applying both.

Keep the direct `pdfjs-dist` version in sync with React-PDF's dependency
when updating the reader.
