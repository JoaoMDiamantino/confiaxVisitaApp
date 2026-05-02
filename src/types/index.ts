export type UserRole = "vendedor" | "admin";
export type VisitaStatus = "agendada" | "em_andamento" | "concluida";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface Imobiliaria {
  id: string;
  name: string;
  address: string | null;
  contact: string | null;
  created_at: string;
}

export interface Visita {
  id: string;
  user_id: string;
  imobiliaria_id: string;
  scheduled_at: string;
  checkin_at: string | null;
  checkout_at: string | null;
  duration_minutes: number | null;
  photo_url: string | null;
  rating: number | null;
  notes: string | null;
  status: VisitaStatus;
  created_at: string;
  // joins
  users?: Pick<User, "id" | "name" | "email">;
  imobiliarias?: Pick<Imobiliaria, "id" | "name" | "address">;
}
