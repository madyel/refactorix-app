import { beforeEach, describe, expect, it } from "vitest";
import {
  authenticateWithFakeDb,
  clearPersistedAuthenticatedUser,
  getPersistedAuthenticatedUser,
  persistAuthenticatedUser,
} from "@/features/auth/auth-service";

describe("auth service fake db", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("authenticates a valid demo user", async () => {
    const user = await authenticateWithFakeDb("giulia.rossi@smartide.dev", "Admin123!");

    expect(user.email).toBe("giulia.rossi@smartide.dev");
    expect(user.role).toBe("admin");
  });

  it("rejects invalid credentials", async () => {
    await expect(authenticateWithFakeDb("giulia.rossi@smartide.dev", "wrong")).rejects.toThrow(
      "Credenziali non valide. Riprova.",
    );
  });

  it("persists and clears session user", () => {
    persistAuthenticatedUser({
      id: "u-admin-001",
      name: "Giulia Rossi",
      email: "giulia.rossi@smartide.dev",
      role: "admin",
    });

    expect(getPersistedAuthenticatedUser()?.name).toBe("Giulia Rossi");

    clearPersistedAuthenticatedUser();
    expect(getPersistedAuthenticatedUser()).toBeNull();
  });
});
