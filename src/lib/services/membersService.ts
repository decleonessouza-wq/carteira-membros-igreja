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
 * 📥 LISTAR membros (ambiente único: admins veem tudo)
 * ⚠️ A permissão real é controlada pelo RLS no banco.
 */
export async function getMembers(): Promise<Member[]> {
  await requireUser();

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Erro ao buscar membros:", error);
    throw error;
  }

  return (data as MemberRow[]).map(memberFromRow);
}

/**
 * ➕ CRIAR novo membro
 * Mantém user_id como "quem cadastrou" (auditoria), mas sem limitar visualização.
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
 * ✏️ ATUALIZAR membro existente (admin pode atualizar qualquer membro)
 * ⚠️ RLS no banco decide se o usuário pode ou não.
 */
export async function updateMember(member: Member): Promise<Member> {
  const user = await requireUser();

  if (!member.id) {
    throw new Error("ID do membro é obrigatório para update.");
  }

  // mantém user_id como "quem salvou por último" (opcional)
  const row = memberToRow(member, user.id);

  const { data, error } = await supabase
    .from("members")
    .update(row)
    .eq("id", member.id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar membro:", error);
    throw error;
  }

  return memberFromRow(data as MemberRow);
}

/**
 * 🗑️ EXCLUIR membro (admin pode excluir qualquer membro)
 * ⚠️ RLS no banco decide se o usuário pode ou não.
 */
export async function deleteMember(memberId: string): Promise<void> {
  await requireUser();

  const { error } = await supabase
    .from("members")
    .delete()
    .eq("id", memberId);

  if (error) {
    console.error("Erro ao excluir membro:", error);
    throw error;
  }
}
