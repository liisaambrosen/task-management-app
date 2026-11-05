# Task Management App

A task management application built with Next.js 15, TypeScript, tRPC, and TanStack React Query. Tasks can be listed, created, edited, and deleted through a client interface backed by in-memory storage.

## Features

- Server-rendered task list with client-side refresh and updates.
- Create, edit, and delete tasks.
- Title and ID validation on the backend, with title validation in the form.
- Loading, success, and user-friendly error feedback.
- Confirmation before deleting a task.
- Automated backend procedure and UI component tests.

## Tech Stack

The versions below are the versions currently resolved in `package-lock.json`:

| Technology | Version |
| --- | --- |
| Next.js | 15.5.28 |
| React / React DOM | 19.1.0 |
| TypeScript | 5.9.3 |
| tRPC client, server, and TanStack React Query integration | 11.23.0 |
| TanStack React Query | 5.105.2 |
| Zod | 4.6.7 |
| Jest / Jest jsdom environment | 29.7.0 |
| React Testing Library | 16.3.3 |
| Testing Library jest-dom | 7.0.1 |
| Testing Library user-event | 14.6.8 |

Tailwind CSS is used for styling.

## Prerequisites

- Node.js 18.18.x, 19.8+, or 20+ (Node.js 20 LTS or later is recommended).
- npm.

No environment variables are required for local development.

## Getting Started

From the repository root, install dependencies and start the application:

```bash
cd task-manager
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Commands

Run these commands from the `task-manager` directory:

```bash
# Start the development server
npm run dev

# Run the production build
npm run build

# Start the production server (after building)
npm run start

# Run ESLint
npm run lint

# Type-check the project
npx tsc --noEmit

# Run all Jest tests once
npm test

# Run Jest in watch mode
npm run test:watch

# Run tests and generate coverage reports in coverage/
npm run test:coverage
```

The optional `VERCEL_URL` and `PORT` environment variables are used to construct an absolute tRPC URL when the client provider is rendered on the server. They are not needed for local development; the application uses the browser-relative `/api/trpc` URL in the browser.

## Project Structure

```text
src/
  app/
    api/trpc/[trpc]/route.ts       # HTTP adapter for tRPC
    server/api/
      db/task-store.ts             # In-memory task store
      routers/task.ts              # Task procedures and Zod validation
      root.ts                      # Root tRPC router and AppRouter type
      trpc.ts                      # tRPC initialization
    error.tsx                      # Page-level error UI
    loading.tsx                    # Page-level loading UI
    page.tsx                       # Dynamic server-rendered page
    layout.tsx                     # Root layout and client providers
  components/tasks/
    task-form.tsx                  # Create/edit form
    task-list.tsx                  # List, mutations, and feedback
  lib/task-validation.ts           # Shared title length limit
  test-utils/task-trpc.tsx         # Shared test mocks and render helper
  trpc/
    client.tsx                     # Browser tRPC and React Query providers
    query-client.ts                # React Query client factory
```

Backend procedure tests are alongside the task router. Component tests are alongside the task components. Jest configuration and setup are in `jest.config.mjs` and `jest.setup.ts`.

## Architecture

### tRPC API

tRPC provides a typed contract between the server router and the frontend client through the exported `AppRouter` type, avoiding a separately maintained client API contract. Task procedures are grouped in `src/app/server/api/routers/task.ts`:

- `list` returns all tasks.
- `getById` retrieves one task by UUID.
- `create` creates a task.
- `update` edits an existing task.
- `delete` removes a task.

The root router combines these procedures. Browser requests use the fetch adapter at `/api/trpc`; the client uses tRPC's `httpBatchLink` and the TanStack React Query integration. The initial server-rendered list calls the router directly and does not make an HTTP request to the application's own API.

### Validation

Zod validates inputs at the procedure boundary. Titles are trimmed, must not be empty, and are limited to 120 characters. UUIDs are validated for lookup, update, and delete; valid IDs that do not identify a task return a `NOT_FOUND` error. Descriptions are optional, and empty or whitespace-only descriptions are normalized to `undefined`.

The form also prevents empty or whitespace-only titles and uses the same 120-character limit as the backend.

### Server rendering and client data

The home page is configured with `dynamic = "force-dynamic"`, so Next.js renders it on each request. The server component calls `appRouter.createCaller({}).task.list()` and passes the result to the client `TaskList` as `initialTasks`. The first rendered list uses this server-fetched data; the browser then refreshes it after the client component mounts.

On the client, `TaskList` seeds the React Query list cache from `initialTasks` and runs the list query on mount to refresh it. The shared `QueryClient` uses a 30-second query `staleTime` and disables refetch-on-window-focus. Creating, editing, and deleting tasks invalidate the task-list query so it can be refreshed. Loading and refresh failures are surfaced in the UI.

The provider creates a separate query client during server rendering and reuses a singleton in the browser. The tRPC provider and React Query provider share that same client.

### In-memory storage and limitations

`task-store.ts` keeps tasks in a module-level array and generates IDs with `crypto.randomUUID()` and creation timestamps with `Date.now()`. This keeps the example self-contained and avoids a database, which is not required for this project.

The store is process-local and non-persistent: data is lost when the server process restarts, and separate server processes or deployment instances do not share the same task array. This storage is not suitable for durable or multi-instance production use.

## Testing

Jest is configured through `next/jest` in `jest.config.mjs`, with the `jsdom` environment for component tests, the TypeScript path alias, and `jest.setup.ts` loading `@testing-library/jest-dom`.

The backend tests call tRPC procedures directly with `appRouter.createCaller()` and clean up tasks created by each test. Component tests use React Testing Library and `user-event`; they mock the tRPC hook/procedures while using a real, isolated React Query client. The tests cover task procedures and validation, empty and populated list rendering, form validation, create/edit/delete interactions, and loading, success, and error feedback.

Run the full suite with `npm test`. Use `npm run test:watch` while developing or `npm run test:coverage` to generate local coverage reports. The current suite does not include browser-based end-to-end tests or an integration test of the actual HTTP adapter.
