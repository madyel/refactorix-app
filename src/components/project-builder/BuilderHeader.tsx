import { Box, Sparkles } from "lucide-react";

export const BuilderHeader = () => {
  return (
    <header className="mb-5 space-y-3">
      <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-[#1f2e53]">
        <Box className="h-8 w-8 fill-orange-400 text-orange-500" strokeWidth={1.6} />
        Framework &amp; Project Builder
      </h1>
      <p className="text-xl text-slate-200/95">
        Codex-style workflow <Sparkles className="mx-1 inline h-7 w-7 text-amber-300" />: crea progetto + genera
        feature in un flusso unico e guidato.
      </p>
    </header>
  );
};
