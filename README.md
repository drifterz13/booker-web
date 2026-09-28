# Booker web

React Router and Vite frontend for Booker's Chainlit migration.

## Development

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## Checks

```sh
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

Use `pnpm lint:fix` for automatic lint fixes and `pnpm format` to format with
Oxfmt. Oxlint includes React and accessibility checks. Tailwind CSS uses the
Vite plugin; shared design tokens live in `app/app.css`.

## Organization

- `app/routes/`: thin React Router route modules and workspace composition.
- `app/features/chat/`: chat state, welcome, composer, suggestions, messages,
  and chat page.
- `app/features/books/`: book state, PDF validation, selection, upload controls,
  book cards, and library page.
- `app/shared/components/`: app shell and navigation.
- `app/shared/components/ui/`: shadcn/ui Button, Textarea, Select, and Sheet.
- `app/shared/lib/`: common styling helpers.

The shadcn aliases in `components.json` route future components into the shared
UI folder. Add primitives with `pnpm dlx shadcn@latest add <component>`; this
project uses `~/shared/lib/utils` for its `cn` helper. If the CLI emits an import
from the `cn` package, change it to that shared helper.

## UI foundation

`/` opens a new chat; `/books` shows the book library. The sidebar collapses on
desktop and uses a keyboard-accessible drawer on mobile. PDF selection checks
the extension, browser MIME type, empty files, and a 100 MB size limit.

Files and conversations are kept in memory for the current visit and survive
navigation between these pages. Refreshing clears them. No files are sent to a
server, indexed, or persisted yet. Submitted questions appear in the
conversation alongside an explicit preview notice; no AI responses are mocked.

The Python backend still exposes its session flow through Chainlit. Backend
integration should replace local book selection with an upload/indexing API
and connect chat submission to streaming answers. Keep those transport concerns
outside the presentation components, and add loading/error states when the API
is available.
