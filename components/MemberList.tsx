import React, { useMemo, useState } from "react";
import { Member } from "../types";
import {
  UserPlus,
  Search,
  Edit,
  CreditCard,
  Trash2,
  User,
  FileText,
  BarChart3,
  Users,
  BadgeCheck,
  AlertTriangle,
} from "lucide-react";
import jsPDF from "jspdf";
import { CONGREGATION_DETAILS, APP_LOGO_SRC } from "../constants";

interface MemberListProps {
  members: Member[];
  onNewMember: () => void;
  onEdit: (member: Member) => void;
  onGenerateCard: (member: Member) => void;
  onDelete: (id: string) => void;
  onReports?: () => void;
}

function formatToPtBR(dateString?: string) {
  if (!dateString) return "-";
  const v = String(dateString);

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return v;

  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [yyyy, mm, dd] = v.split("-");
    return `${dd}/${mm}/${yyyy}`;
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(v)) {
    const iso = v.slice(0, 10);
    const [yyyy, mm, dd] = iso.split("-");
    return `${dd}/${mm}/${yyyy}`;
  }

  return v;
}

function detectImageFormat(dataUrl: string): "PNG" | "JPEG" {
  const v = (dataUrl || "").toLowerCase();
  if (v.includes("image/png")) return "PNG";
  return "JPEG";
}

let _cachedLogoDataUrl: string | null = null;

async function loadLogoDataUrl(): Promise<string | null> {
  if (_cachedLogoDataUrl) return _cachedLogoDataUrl;

  const url = APP_LOGO_SRC || "/logo_app.png";

  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;

    const blob = await res.blob();

    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Falha ao ler logo"));
      reader.readAsDataURL(blob);
    });

    if (!dataUrl.startsWith("data:image/")) return null;

    _cachedLogoDataUrl = dataUrl;
    return dataUrl;
  } catch {
    return null;
  }
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  onNewMember,
  onEdit,
  onGenerateCard,
  onDelete,
  onReports,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMembers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return members;

    return members.filter((m) => {
      const name = (m.fullName ?? "").toLowerCase();
      const cpf = (m.cpf ?? "").toLowerCase();
      const reg = String(m.registrationNumber ?? "").toLowerCase();
      return name.includes(term) || cpf.includes(term) || reg.includes(term);
    });
  }, [members, searchTerm]);

  const stats = useMemo(() => {
    const total = members.length;
    const ativo = members.filter((m) => (m.status ?? "").toUpperCase() === "ATIVO").length;
    const inativo = members.filter((m) => (m.status ?? "").toUpperCase() === "INATIVO").length;
    const desligado = members.filter((m) => (m.status ?? "").toUpperCase() === "DESLIGADO").length;
    return { total, ativo, inativo, desligado };
  }, [members]);

  const getStatusPill = (status: string) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "ATIVO":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "INATIVO":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "DESLIGADO":
        return "bg-rose-50 text-rose-800 border-rose-200";
      case "FALECIDO":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "SUSPENSO":
        return "bg-orange-50 text-orange-800 border-orange-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const generateMemberSheet = async (member: Member) => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const GREEN = { r: 4, g: 120, b: 87 };
    const DARK = { r: 15, g: 23, b: 42 };
    const MUTED = { r: 71, g: 85, b: 105 };

    const congData = CONGREGATION_DETAILS[member.congregation] || CONGREGATION_DETAILS["SEDE"];

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 12;

    const logoDataUrl = await loadLogoDataUrl();

    doc.setFillColor(GREEN.r, GREEN.g, GREEN.b);
    doc.rect(0, 0, pageW, 28, "F");

    if (logoDataUrl) {
      try {
        const fmt = detectImageFormat(logoDataUrl);
        doc.setFillColor(255, 255, 255);
        (doc as any).roundedRect(10, 6, 16, 16, 2, 2, "F");
        doc.addImage(logoDataUrl as any, fmt, 10.8, 6.8, 14.4, 14.4);
      } catch {
        // ignora
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(congData.name, pageW / 2 + 6, 11, {
      align: "center",
      maxWidth: pageW - margin * 2 - 10,
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Endereço: ${congData.address}`, pageW / 2 + 6, 18, {
      align: "center",
      maxWidth: pageW - margin * 2 - 10,
    });
    doc.text(`Pastor Local: ${congData.pastor}`, pageW / 2 + 6, 23.5, {
      align: "center",
      maxWidth: pageW - margin * 2 - 10,
    });

    doc.setTextColor(DARK.r, DARK.g, DARK.b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("FICHA DE MEMBRO", pageW / 2, 40, { align: "center" });

    const photoX = pageW - margin - 34;
    const photoY = 47;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    (doc as any).roundedRect(photoX, photoY, 34, 44, 2, 2, "S");

    if (member.photo) {
      try {
        const fmt = detectImageFormat(member.photo);
        doc.addImage(member.photo as any, fmt, photoX + 1, photoY + 1, 32, 42);
      } catch {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
        doc.text("Foto", photoX + 17, photoY + 24, { align: "center" });
      }
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
      doc.text("Sem Foto", photoX + 17, photoY + 24, { align: "center" });
    }

    const cardX = margin;
    const cardY = 47;
    const cardW = pageW - margin * 2 - 38;
    const colGap = 8;
    const colW = (cardW - colGap) / 2;
    const leftX = cardX;
    const rightX = cardX + colW + colGap;

    const drawSectionTitle = (title: string, y: number) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(GREEN.r, GREEN.g, GREEN.b);
      doc.text(title.toUpperCase(), cardX, y);
      doc.setDrawColor(220, 252, 231);
      doc.setLineWidth(2);
      doc.line(cardX, y + 1.2, cardX + cardW, y + 1.2);
    };

    const drawField = (label: string, value: string, x: number, y: number, w: number) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(label, x, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(DARK.r, DARK.g, DARK.b);

      const txt = value?.trim() ? value : "-";
      const lines = doc.splitTextToSize(txt, w);
      doc.text(lines, x, y + 5);
      return y + 5 + lines.length * 4.8;
    };

    let y = cardY;

    drawSectionTitle("Dados do Membro", y);
    y += 8;

    const rowTop = y;
    const y1 = drawField("Matrícula", String(member.registrationNumber || "N/A"), leftX, rowTop, colW);
    const y2 = drawField("Situação", String(member.status || "-"), rightX, rowTop, colW);
    y = Math.max(y1, y2) + 2;

    y = drawField("Nome Completo", member.fullName || "-", leftX, y, cardW) + 2;

    const y3 = drawField("CPF", member.cpf || "-", leftX, y, colW);
    const y4 = drawField("RG", member.rg || "-", rightX, y, colW);
    y = Math.max(y3, y4) + 2;

    const y5 = drawField("Data de Nascimento", formatToPtBR(member.birthDate), leftX, y, colW);
    const y6 = drawField("Naturalidade", member.naturalness || "-", rightX, y, colW);
    y = Math.max(y5, y6) + 2;

    y = drawField("Pai", member.fatherName || "-", leftX, y, cardW) + 1.5;
    y = drawField("Mãe", member.motherName || "-", leftX, y, cardW) + 2;

    drawSectionTitle("Contato & Endereço", y);
    y += 8;

    const y7 = drawField("Telefone", member.phone || "-", leftX, y, colW);
    const y8 = drawField("Email", member.email || "-", rightX, y, colW);
    y = Math.max(y7, y8) + 2;

    const fullAddress = `${member.addressStreet || "-"}, ${member.addressNumber || "-"} - ${
      member.addressNeighborhood || "-"
    } - ${member.addressCity || "-"}/${member.addressState || "-"} - CEP: ${
      member.addressCep || "-"
    }${member.addressComplement ? ` (${member.addressComplement})` : ""}`;

    y = drawField("Endereço Completo", fullAddress, leftX, y, cardW) + 2;

    drawSectionTitle("Dados Eclesiásticos", y);
    y += 8;

    const y9 = drawField("Congregação", member.congregation || "-", leftX, y, colW);
    const y10 = drawField("Cargo", member.role || "-", rightX, y, colW);
    y = Math.max(y9, y10) + 2;

    const y11 = drawField("Data Batismo", formatToPtBR(member.baptismDate), leftX, y, colW);
    const y12 = drawField("Data Cadastro", formatToPtBR(member.registrationDate), rightX, y, colW);
    y = Math.max(y11, y12) + 4;

    const sigY = 270;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);

    doc.line(margin, sigY, margin + 70, sigY);
    doc.line(pageW - margin - 70, sigY, pageW - margin, sigY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Assinatura do Membro", margin + 35, sigY + 5, { align: "center" });
    doc.text("Secretaria da Igreja", pageW - margin - 35, sigY + 5, { align: "center" });

    doc.line(pageW / 2 - 35, sigY + 22, pageW / 2 + 35, sigY + 22);
    doc.text("Pastor Responsável", pageW / 2, sigY + 27, { align: "center" });

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, pageW / 2, pageH - 10, {
      align: "center",
    });

    doc.save(`ficha_${(member.fullName || "membro").replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-[0_12px_40px_-20px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 via-white to-emerald-50" />
        <div className="relative p-5 sm:p-6 md:p-7 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-black">
                <Users className="w-4 h-4" />
                Cadastro & Carteira Digital
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-2 tracking-tight">
                Membros Cadastrados
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Gerencie membros, gere carteiras e fichas em PDF.
              </p>
            </div>

            <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
              {onReports && (
                <button
                  onClick={onReports}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white border border-emerald-200 text-emerald-800 font-extrabold shadow-sm hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 whitespace-nowrap"
                  title="Relatórios"
                >
                  <BarChart3 className="w-5 h-5" />
                  RELATÓRIOS
                </button>
              )}

              <button
                onClick={onNewMember}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-black shadow-[0_18px_40px_-22px_rgba(16,185,129,0.9)] hover:shadow-[0_22px_55px_-25px_rgba(16,185,129,0.95)] hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 whitespace-nowrap"
              >
                <UserPlus className="w-5 h-5" />
                NOVO MEMBRO
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
              <div className="text-xs font-black text-slate-500">TOTAL</div>
              <div className="text-2xl font-black text-slate-900">{stats.total}</div>
            </div>
            <div className="rounded-2xl bg-white border border-emerald-100 shadow-sm p-4">
              <div className="text-xs font-black text-emerald-700 flex items-center gap-2">
                <BadgeCheck className="w-4 h-4" /> ATIVOS
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.ativo}</div>
            </div>
            <div className="rounded-2xl bg-white border border-amber-100 shadow-sm p-4">
              <div className="text-xs font-black text-amber-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> INATIVOS
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.inativo}</div>
            </div>
            <div className="rounded-2xl bg-white border border-rose-100 shadow-sm p-4">
              <div className="text-xs font-black text-rose-700">DESLIGADOS</div>
              <div className="text-2xl font-black text-slate-900">{stats.desligado}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome, CPF ou matrícula..."
          className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl leading-5 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm shadow-sm transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <User className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-lg font-black text-slate-900">Nenhum membro encontrado.</p>
          <p className="text-slate-500 text-sm text-center max-w-md mt-1">
            Tente buscar outro termo ou cadastre um novo membro para gerar carteira e ficha.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="group bg-white rounded-3xl p-4 sm:p-5 border border-slate-100
                         shadow-[0_16px_45px_-28px_rgba(0,0,0,0.45)]
                         hover:shadow-[0_22px_60px_-30px_rgba(0,0,0,0.55)]
                         hover:border-emerald-200 transition-all duration-300
                         flex flex-col sm:flex-row items-start gap-4 sm:gap-5 hover:-translate-y-[1px]"
            >
              <div className="relative flex-shrink-0 w-full sm:w-auto">
                <div className="flex items-start gap-4 sm:block">
                  <div className="relative">
                    <div className="w-20 h-24 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                      {member.photo ? (
                        <img
                          src={member.photo}
                          alt={member.fullName}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <User className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-emerald-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                      #{member.registrationNumber}
                    </div>
                  </div>

                  {/* no mobile mostra status perto do topo para não apertar */}
                  <div className="sm:hidden flex-1 min-w-0 pt-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-900 truncate text-base uppercase">
                          {member.fullName}
                        </h3>
                        <p className="text-sm font-extrabold text-emerald-700">{member.role || "-"}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{member.congregation || "-"}</p>
                      </div>

                      <span
                        className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusPill(
                          member.status
                        )}`}
                      >
                        {member.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden sm:block flex-1 min-w-0 py-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 truncate text-base group-hover:text-emerald-700 transition-colors uppercase">
                      {member.fullName}
                    </h3>
                    <p className="text-sm font-extrabold text-emerald-700">{member.role || "-"}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{member.congregation || "-"}</p>
                  </div>

                  <span
                    className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusPill(
                      member.status
                    )}`}
                  >
                    {member.status}
                  </span>
                </div>

                {/* Ações: no mobile quebram linha e ficam confortáveis */}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <button
                    onClick={() => onGenerateCard(member)}
                    className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-black
                               bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800
                               border border-slate-200 hover:border-emerald-200
                               transition-all duration-200 active:scale-[0.99]"
                    title="Carteira"
                  >
                    <CreditCard className="w-4 h-4" />
                    Carteira
                  </button>

                  <button
                    onClick={() => generateMemberSheet(member)}
                    className="inline-flex items-center justify-center p-2.5 rounded-2xl
                               bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700
                               border border-slate-200 hover:border-emerald-200 transition-all duration-200"
                    title="Ficha PDF"
                    aria-label="Ficha PDF"
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onEdit(member)}
                    className="inline-flex items-center justify-center p-2.5 rounded-2xl
                               bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700
                               border border-slate-200 hover:border-amber-200 transition-all duration-200"
                    title="Editar"
                    aria-label="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm("Tem certeza que deseja excluir este membro?")) {
                        onDelete(member.id);
                      }
                    }}
                    className="inline-flex items-center justify-center p-2.5 rounded-2xl
                               bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700
                               border border-slate-200 hover:border-rose-200 transition-all duration-200"
                    title="Excluir"
                    aria-label="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 text-[11px] text-slate-400">
                  Dica: gere a <span className="font-bold text-slate-500">Ficha</span> para impressão e arquivo.
                </div>
              </div>

              {/* bloco de ações no mobile (abaixo) para ficar perfeito */}
              <div className="sm:hidden w-full">
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <button
                    onClick={() => onGenerateCard(member)}
                    className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-black
                               bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800
                               border border-slate-200 hover:border-emerald-200
                               transition-all duration-200 active:scale-[0.99]"
                    title="Carteira"
                  >
                    <CreditCard className="w-4 h-4" />
                    Carteira
                  </button>

                  <button
                    onClick={() => generateMemberSheet(member)}
                    className="inline-flex items-center justify-center p-2.5 rounded-2xl
                               bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700
                               border border-slate-200 hover:border-emerald-200 transition-all duration-200"
                    title="Ficha PDF"
                    aria-label="Ficha PDF"
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onEdit(member)}
                    className="inline-flex items-center justify-center p-2.5 rounded-2xl
                               bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700
                               border border-slate-200 hover:border-amber-200 transition-all duration-200"
                    title="Editar"
                    aria-label="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm("Tem certeza que deseja excluir este membro?")) {
                        onDelete(member.id);
                      }
                    }}
                    className="inline-flex items-center justify-center p-2.5 rounded-2xl
                               bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700
                               border border-slate-200 hover:border-rose-200 transition-all duration-200"
                    title="Excluir"
                    aria-label="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 text-[11px] text-slate-400">
                  Dica: gere a <span className="font-bold text-slate-500">Ficha</span> para impressão e arquivo.
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
