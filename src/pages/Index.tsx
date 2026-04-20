import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BuilderHeader } from "@/components/project-builder/BuilderHeader";
import {
  createAndGenerateProject,
  toProjectProvisionErrorMessage,
  type ProjectProvisionResult,
} from "@/features/project-provisioning/client";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const DEFAULT_PROJECT_BASE_PATH = "/workspace";

const Index = () => {
  const navigate = useNavigate();
  const [command, setCommand] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [provisionResult, setProvisionResult] = useState<ProjectProvisionResult | null>(null);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleOpenProjectViewer = (repoPath: string) => {
    const params = new URLSearchParams({
      mode: "remote",
      path: repoPath,
    });
    navigate(`/project-viewer?${params.toString()}`);
  };

  const handleSubmitCommand = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedCommand = command.trim();
    if (!trimmedCommand || isSubmitting) return;

    const projectName = `workspace-${Date.now()}`;

    setMessages((current) => [
      ...current,
      {
        id: `${Date.now()}-user`,
        role: "user",
        content: trimmedCommand,
      },
    ]);

    setCommand("");
    setIsSubmitting(true);
    setProvisionError(null);

    try {
      const result = await createAndGenerateProject({
        name: projectName,
        path: DEFAULT_PROJECT_BASE_PATH,
        request: trimmedCommand,
      });

      setProvisionResult(result);
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: result.summary,
        },
      ]);
    } catch (error) {
      const message = toProjectProvisionErrorMessage(error, "Errore esecuzione comando");
      const formatted = `Comando fallito: ${message}`;
      setProvisionError(formatted);
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant-error`,
          role: "assistant",
          content: formatted,
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#1b1b1b] p-4 text-slate-100 sm:p-7">
      <section className="relative mx-auto w-full max-w-[1100px] overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_30%_10%,rgba(255,255,255,0.08),transparent_35%),linear-gradient(180deg,#1f1f1f,#171717)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)] sm:p-8">
        <BuilderHeader />

        <section className="mx-auto mt-6 flex w-full max-w-4xl flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#242424]/70 p-4 text-sm text-slate-300">
            Scrivi un comando per avviare la generazione del progetto.
          </div>

          <div className="max-h-[440px] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-[#1a1a1a]/70 p-4">
            {messages.length === 0 ? (
              <p className="text-sm text-slate-400">Nessun comando inviato.</p>
            ) : (
              messages.map((message) => (
                <article
                  key={message.id}
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                    message.role === "user"
                      ? "ml-auto bg-slate-100 text-slate-900"
                      : "border border-white/10 bg-white/[0.03] text-slate-100"
                  }`}
                >
                  {message.content}
                </article>
              ))
            )}
          </div>

          <form onSubmit={handleSubmitCommand} className="rounded-2xl border border-white/10 bg-[#242424]/70 p-4">
            <label className="block">
              <span className="sr-only">Comando</span>
              <textarea
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                rows={3}
                placeholder="Es. crea una dashboard con autenticazione e gestione utenti"
                className="w-full resize-none rounded-xl border border-white/10 bg-[#161616] px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-400"
              />
            </label>

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="submit"
                disabled={isSubmitting || command.trim().length === 0}
                className="h-10 rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Invio..." : "Invia comando"}
              </button>
            </div>
          </form>

          {provisionError && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {provisionError}
            </div>
          )}

          {provisionResult && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              <p className="font-semibold">Repository: {provisionResult.repoPath}</p>
              <button
                type="button"
                onClick={() => handleOpenProjectViewer(provisionResult.repoPath)}
                className="mt-3 rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-300/20"
              >
                Apri in Project Viewer
              </button>
            </div>
          )}
        </section>
      </section>
    </main>
  );
};

export default Index;
