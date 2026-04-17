import { Link } from "react-router-dom";

const Documents = () => {
  return (
    <main className="min-h-screen bg-[#1b1b1b] p-6 text-slate-100">
      <section className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-black/20 p-6">
        <h1 className="text-2xl font-semibold">Documenti</h1>
        <p className="mt-2 text-sm text-slate-300">
          Sezione documentazione Smart IDE/Copilot. Usa i link sotto per tornare rapidamente alle aree principali.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="rounded border border-white/20 px-3 py-2 text-sm hover:bg-white/10" to="/">
            Vai a App
          </Link>
          <Link className="rounded border border-white/20 px-3 py-2 text-sm hover:bg-white/10" to="/project-viewer">
            Vai a Codice (IDE)
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Documents;
