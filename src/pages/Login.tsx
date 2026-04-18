import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  authDemoCredentials,
  authenticateWithFakeDb,
  getPersistedAuthenticatedUser,
  persistAuthenticatedUser,
} from "@/features/auth/auth-service";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentSession = useMemo(() => getPersistedAuthenticatedUser(), []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await authenticateWithFakeDb(email, password);
      persistAuthenticatedUser(user);
      navigate("/", { replace: true });
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : "Errore imprevisto durante il login";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#151515] p-4 text-white">
      <Card className="w-full max-w-xl border-white/10 bg-[#1f1f1f] shadow-[0_25px_65px_rgba(0,0,0,0.55)]">
        <CardHeader>
          <CardTitle className="text-2xl">Login Smart IDE</CardTitle>
          <CardDescription>
            Accedi con un account demo cablato (database finto) per provare la feature richiesta.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-slate-200">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nome.cognome@smartide.dev"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm text-slate-200">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Accesso in corso..." : "Accedi"}
            </Button>
          </form>

          <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-slate-300">
            <p className="mb-2 font-medium text-slate-100">Credenziali demo (fake DB)</p>
            <ul className="space-y-1">
              {authDemoCredentials.map((credential) => (
                <li key={credential.email}>
                  <span className="font-semibold">{credential.role}</span>: {credential.email} / {credential.password}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-start gap-2 text-sm text-slate-300">
          <span>
            Sessione corrente: {currentSession ? `${currentSession.name} (${currentSession.role})` : "nessuna"}
          </span>
          <Link className="text-sky-400 hover:text-sky-300" to="/">
            Vai direttamente al builder
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
};

export default Login;
