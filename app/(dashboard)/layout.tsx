import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center gap-6">
          <Link href="/" className="font-semibold tracking-tight">
            Nexus AI
          </Link>
          <nav className="text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Projets
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
