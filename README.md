# Booker

A web app for uploading PDF books, browsing your library, and previewing books
alongside chat. Library and PDF preview use the Booker API; AI answers are not
connected yet.

## Stack

- React, TypeScript, React Router, and Vite
- TanStack Query
- Tailwind CSS, shadcn/ui, Radix, and Lucide
- React-PDF and PDF.js
- Vitest, React Testing Library, MSW, Oxlint, and Oxfmt

## Installation

Requires Node.js and pnpm, plus the Booker API and its storage service.

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

Set `VITE_API_BASE_URL` in `.env` if your API is not at `http://127.0.0.1:8000`.
Start the API and storage services with the configured bucket. Allow the frontend
origin in API/storage CORS and expose storage's `ETag` header for uploads.
Open the URL printed by Vite.

## Commands

| Command                             | Purpose                      |
| ----------------------------------- | ---------------------------- |
| `pnpm dev`                          | Start the development server |
| `pnpm build`                        | Build for production         |
| `pnpm start`                        | Serve the production build   |
| `pnpm test`                         | Run integration tests        |
| `pnpm typecheck`                    | Check TypeScript             |
| `pnpm lint` / `pnpm lint:fix`       | Check or fix lint issues     |
| `pnpm format:check` / `pnpm format` | Check or apply formatting    |
