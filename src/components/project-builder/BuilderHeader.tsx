import { Bell, Code2, Cog, UserCircle2 } from "lucide-react";

const topLinks = ["Codice", "App", "Documenti"];

export const BuilderHeader = () => {
  return (
    <header className="mb-8 space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 text-slate-100">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5">
            <Code2 className="h-4 w-4" />
          </span>
          <span className="text-lg font-semibold">Codex</span>
        </div>

        <div className="flex items-center gap-5 pt-1 text-sm text-slate-400">
          <nav className="hidden items-center gap-5 md:flex">
            {topLinks.map((link) => (
              <button
                key={link}
                type="button"
                className="font-medium transition hover:text-white"
              >
                {link}
              </button>
            ))}
          </nav>
          <button type="button" className="transition hover:text-white">
            <Cog className="h-4 w-4" />
          </button>
          <button type="button" className="transition hover:text-white">
            <Bell className="h-4 w-4" />
          </button>
          <button type="button" className="text-slate-200 transition hover:text-white">
            <UserCircle2 className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-3 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
          Quale codice dovremmo scrivere adesso?
        </h1>
        <p className="text-base text-slate-400 md:text-lg">
          Definisci progetto, stack e feature in un unico flusso per generare il framework software.
        </p>
      </div>
    </header>
  );
};
