import { Member } from "../../types";

export type MemberRow = {
  id: string;
  user_id: string;

  registration_number: string;
  full_name: string;

  rg: string | null;
  cpf: string | null;
  sex: string | null;

  father_name: string | null;
  mother_name: string | null;

  naturalness: string | null;
  birth_date: string | null;

  registration_date: string | null;
  role: string | null;
  congregation: string | null;

  baptism_date: string | null;

  photo_url: string | null;

  phone: string | null;
  email: string | null;

  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_cep: string | null;
  address_complement: string | null;

  status: string | null;

  created_at: string;
  updated_at: string;
};

/**
 * Normaliza datas para ISO (YYYY-MM-DD), aceitando:
 * - "YYYY-MM-DD" (ok)
 * - "DD/MM/YYYY" (converte)
 */
export function normalizeToISODate(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;

  // Já ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  // BR
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const dd = m[1];
    const mm = m[2];
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  // Qualquer outra coisa: devolve null (evita erro "date/time field value out of range")
  return null;
}

export function memberFromRow(row: MemberRow): Member {
  return {
    id: row.id,
    userId: row.user_id,

    registrationNumber: row.registration_number,
    fullName: row.full_name,

    rg: row.rg ?? "",
    cpf: row.cpf ?? "",
    sex: (row.sex as any) ?? "Masculino",

    fatherName: row.father_name ?? "",
    motherName: row.mother_name ?? "",

    naturalness: row.naturalness ?? "",
    birthDate: row.birth_date ?? "",

    // Mantemos ISO no estado (inputs type="date")
    registrationDate: row.registration_date ?? "",
    role: row.role ?? "",
    congregation: row.congregation ?? "",

    baptismDate: row.baptism_date ?? "",

    photo: row.photo_url ?? null,

    phone: row.phone ?? "",
    email: row.email ?? "",

    addressStreet: row.address_street ?? "",
    addressNumber: row.address_number ?? "",
    addressNeighborhood: row.address_neighborhood ?? "",
    addressCity: row.address_city ?? "",
    addressState: row.address_state ?? "",
    addressCep: row.address_cep ?? "",
    addressComplement: row.address_complement ?? "",

    status: (row.status as any) ?? "ATIVO",
  };
}

export function memberToRow(member: Member, userId: string) {
  return {
    id: member.id || undefined,
    user_id: userId,

    registration_number: member.registrationNumber,
    full_name: member.fullName,

    rg: member.rg || null,
    cpf: member.cpf || null,
    sex: member.sex || null,

    father_name: member.fatherName || null,
    mother_name: member.motherName || null,

    naturalness: member.naturalness || null,
    birth_date: normalizeToISODate(member.birthDate),

    registration_date: normalizeToISODate(member.registrationDate),
    role: member.role || null,
    congregation: member.congregation || null,

    baptism_date: normalizeToISODate(member.baptismDate),

    photo_url: member.photo || null,

    phone: member.phone || null,
    email: member.email || null,

    address_street: member.addressStreet || null,
    address_number: member.addressNumber || null,
    address_neighborhood: member.addressNeighborhood || null,
    address_city: member.addressCity || null,
    address_state: member.addressState || null,
    address_cep: member.addressCep || null,
    address_complement: member.addressComplement || null,

    status: member.status || null,
  };
}
