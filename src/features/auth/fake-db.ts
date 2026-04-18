export type FakeDbUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "developer" | "viewer";
};

export const fakeDbUsers: FakeDbUser[] = [
  {
    id: "u-admin-001",
    name: "Giulia Rossi",
    email: "giulia.rossi@smartide.dev",
    password: "Admin123!",
    role: "admin",
  },
  {
    id: "u-dev-002",
    name: "Luca Bianchi",
    email: "luca.bianchi@smartide.dev",
    password: "DevPass123!",
    role: "developer",
  },
  {
    id: "u-view-003",
    name: "Sara Verdi",
    email: "sara.verdi@smartide.dev",
    password: "Viewer123!",
    role: "viewer",
  },
];
