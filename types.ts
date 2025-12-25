export interface ChurchInfo {
  name: string;
  honorPresident: string;
  nationalPresident: string;
  vicePresident: string;
  address: string;
  cnpj: string;
}

export interface CongregationData {
  name: string;
  address: string;
  pastor: string;
}

/**
 * Anotações administrativas do membro
 * (Pastor / Administrador)
 */
export interface MemberNote {
  id: string;          // uuid ou timestamp
  text: string;        // conteúdo da anotação
  createdAt: string;   // ISO date-time
  createdBy?: string;  // nome ou id do admin (opcional por enquanto)
}

export interface Member {
  id: string;

  // Dono do registro (Supabase Auth)
  userId?: string;

  registrationNumber: string;
  registrationDate: string;

  fullName: string;
  cpf: string;
  rg: string;
  sex: "Masculino" | "Feminino";

  fatherName: string;
  motherName: string;

  naturalness: string;
  birthDate: string;
  baptismDate: string;

  /** 🆕 NOVOS CAMPOS */
  maritalStatus: "Solteiro(a)" | "Casado(a)" | "Viúvo(a)" | "Outro";
  churchEntryDate: string;       // data de ingresso na igreja
  anointingDate: string;         // unção / separação ao cargo
  notes: MemberNote[];           // anotações administrativas

  role: string;
  congregation: string;

  email: string;
  phone: string;

  // base64/dataURL no momento (sem Storage). Pode virar URL do Storage depois.
  photo: string | null;

  addressStreet: string;
  addressNumber: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressCep: string;
  addressComplement: string;

  status: "ATIVO" | "SUSPENSO" | "DESLIGADO" | "INATIVO" | "FALECIDO";
}

export enum AppView {
  LIST = "LIST",
  FORM = "FORM",
  CARD = "CARD",
  REPORTS = "REPORTS",
}
