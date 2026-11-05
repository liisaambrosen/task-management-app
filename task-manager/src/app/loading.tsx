export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="min-h-screen bg-slate-50 px-4 py-10"
    >
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-slate-900">
          Task Manager
        </h1>
        <p className="text-sm text-slate-600">Loading tasks...</p>
      </div>
    </main>
  );
}
