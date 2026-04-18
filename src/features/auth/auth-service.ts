import { fakeDbUsers, type FakeDbUser } from "./fake-db";

const FAKE_NETWORK_DELAY_MS = 350;
const AUTH_STORAGE_KEY = "smartide.auth.user";

export type AuthenticatedUser = Omit<FakeDbUser, "password">;

const sanitizeUser = (user: FakeDbUser): AuthenticatedUser => {
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

export const authenticateWithFakeDb = async (email: string, password: string): Promise<AuthenticatedUser> => {
  await new Promise((resolve) => setTimeout(resolve, FAKE_NETWORK_DELAY_MS));

  const normalizedEmail = email.trim().toLowerCase();
  const match = fakeDbUsers.find((user) => user.email.toLowerCase() === normalizedEmail && user.password === password);

  if (!match) {
    throw new Error("Credenziali non valide. Riprova.");
  }

  return sanitizeUser(match);
};

export const persistAuthenticatedUser = (user: AuthenticatedUser) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
};

export const getPersistedAuthenticatedUser = (): AuthenticatedUser | null => {
  const value = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AuthenticatedUser;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const clearPersistedAuthenticatedUser = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const authDemoCredentials = fakeDbUsers.map(({ email, password, role }) => ({
  email,
  password,
  role,
}));
