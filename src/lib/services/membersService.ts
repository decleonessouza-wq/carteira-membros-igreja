// src/services/membersService.ts
import { supabase } from "../supabaseClient";
import { Member } from "../../../types";
import { memberFromRow, memberToRow, MemberRow } from "../memberMapper";

/**
 * 🔐 Garante usuário autenticado (necessário para RLS)
 */
async function requireUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Usuário não autenticado.");
  }

  return user;
}

/**
 * 📥 LISTAR membros do usuário logado
 */
export async function getMembers(): Promise<Member[]> {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("user_id", user.id)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Erro ao buscar membros:", error);
    throw error;
  }

  return (data as MemberRow[]).map(memberFromRow);
}

/**
 * ➕ CRIAR novo membro
 */
export async function createMember(member: Member): Promise<Member> {
  const user = await requireUser();

  const row = memberToRow(member, user.id);

  const { data, error } = await supabase
    .from("members")
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar membro:", error);
    throw error;
  }

  return memberFromRow(data as MemberRow);
}

/**
 * ✏️ ATUALIZAR membro existente
 */
export async function updateMember(member: Member): Promise<Member> {
  const user = await requireUser();

  if (!member.id) {
    throw new Error("ID do membro é obrigatório para update.");
  }

  const row = memberToRow(member, user.id);

  const { data, error } = await supabase
    .from("members")
    .update(row)
    .eq("id", member.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar membro:", error);
    throw error;
  }

  return memberFromRow(data as MemberRow);
}

/**
 * 🗑️ EXCLUIR membro
 */
export async function deleteMember(memberId: string): Promise<void> {
  const user = await requireUser();

  const { error } = await supabase
    .from("members")
    .delete()
    .eq("id", memberId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erro ao excluir membro:", error);
    throw error;
  }
}
