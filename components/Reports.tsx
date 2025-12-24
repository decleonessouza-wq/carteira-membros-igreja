import React, { useMemo } from "react";
import { Member } from "../types";
import { BarChart3, Users, PieChart, Activity, Download } from "lucide-react";
import jsPDF from "jspdf";
import { CONGREGATION_DETAILS, CONGREGATIONS_LIST, APP_LOGO_SRC } from "../constants";

interface ReportsProps {
  members: Member[];
}

type HeaderInfo = {
  name: string;
  address: string;
  pastor: string;
};

function safeText(value: string | undefined | null) {
  return (value ?? "").toString().trim() || "-";
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

/**
 * Cabeçalho padrão (verde) para PDFs + LOGO
 */
function drawPdfHeader(
  doc: jsPDF,
  header: HeaderInfo,
  title: string,
  subtitle: string,
  logoDataUrl?: string | null
) {
  // Top bar
  doc.setFillColor(16, 122, 74);
  doc.rect(0, 0, 210, 28, "F");

  // Logo (caixa branca)
  if (logoDataUrl) {
    try {
      const fmt = detectImageFormat(logoDataUrl);

      // caixa branca arredondada
      doc.setFillColor(255, 255, 255);
      (doc as any).roundedRect(10, 6, 16, 16, 2, 2, "F");

      doc.addImage(logoDataUrl as any, fmt, 10.8, 6.8, 14.4, 14.4);
    } catch {
      // ignora se falhar
    }
  }

  // Textos do header
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);

  // centraliza com leve compensação caso tenha logo
  doc.text(safeText(header.name), 112, 12, { align: "center", maxWidth: 185 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Endereço: ${safeText(header.address)}`, 112, 18, { align: "center", maxWidth: 185 });
  doc.text(`Pastor Local: ${safeText(header.pastor)}`, 112, 23, { align: "center", maxWidth: 185 });

  // Title block
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, 105, 38, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(subtitle, 105, 44, { align: "center" });

  // divider
  doc.setDrawColor(200);
  doc.setLineWidth(0.4);
  doc.line(10, 48, 200, 48);
}

function drawPdfFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(90);
    doc.text(
      `Página ${i} de ${pageCount} • Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
      105,
      292,
      { align: "center" }
    );
  }
}

function drawTableHeader(doc: jsPDF, y: number, isGeneral: boolean) {
  doc.setFillColor(240, 245, 242);
  doc.rect(10, y - 6, 190, 9, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(35);

  doc.text("Matrícula", 12, y);
  doc.text("Nome Completo", 40, y);
  doc.text("Cargo", 120, y);
  doc.text("Situação", 160, y);

  if (isGeneral) {
    doc.text("Congr.", 188, y, { align: "right" });
  }

  doc.setDrawColor(210);
  doc.line(10, y + 3, 200, y + 3);
}

export const Reports: React.FC<ReportsProps> = ({ members }) => {
  const total = members.length;

  const stats = useMemo(() => {
    const byRole = members.reduce((acc, m) => {
      const key = (m.role || "—").trim() || "—";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = members.reduce((acc, m) => {
      const key = (m.status || "—").trim() || "—";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCongregation = members.reduce((acc, m) => {
      const key = (m.congregation || "—").trim() || "—";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { byRole, byStatus, byCongregation };
  }, [members]);

  const StatCard = ({
    title,
    count,
    icon,
    tone = "emerald",
  }: {
    title: string;
    count: number;
    icon: React.ReactNode;
    tone?: "emerald" | "blue" | "amber";
  }) => {
    const toneMap: Record<string, { bg: string; ring: string; iconBg: string; iconText: string }> =
      {
        emerald: {
          bg: "bg-white",
          ring: "ring-1 ring-emerald-100",
          iconBg: "bg-emerald-50",
          iconText: "text-emerald-700",
        },
        blue: {
          bg: "bg-white",
          ring: "ring-1 ring-blue-100",
          iconBg: "bg-blue-50",
          iconText: "text-blue-700",
        },
        amber: {
          bg: "bg-white",
          ring: "ring-1 ring-amber-100",
          iconBg: "bg-amber-50",
          iconText: "text-amber-700",
        },
      };

    const t = toneMap[tone];

    return (
      <div
        className={[
          "rounded-2xl",
          t.bg,
          t.ring,
          "shadow-sm hover:shadow-lg transition-all duration-300",
          "p-5 flex items-center justify-between",
        ].join(" ")}
      >
        <div>
          <p className="text-gray-500 text-sm font-semibold">{title}</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{count}</p>
        </div>
        <div className={["p-3 rounded-2xl", t.iconBg, t.iconText, "shadow-inner"].join(" ")}>
          {icon}
        </div>
      </div>
    );
  };

  const generateReport = async (congregationFilter?: string) => {
    const isGeneral = !congregationFilter;

    const filteredMembers = congregationFilter
      ? members.filter((m) => m.congregation === congregationFilter)
      : [...members];

    const headerInfo: HeaderInfo = congregationFilter
      ? CONGREGATION_DETAILS[congregationFilter] || CONGREGATION_DETAILS["SEDE"]
      : CONGREGATION_DETAILS["SEDE"];

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const title = isGeneral
      ? "RELATÓRIO GERAL DE MEMBROS"
      : `RELATÓRIO DE MEMBROS • ${congregationFilter}`;

    const subtitle = `Total de Registros: ${filteredMembers.length}`;

    filteredMembers.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));

    const logoDataUrl = await loadLogoDataUrl();

    drawPdfHeader(doc, headerInfo, title, subtitle, logoDataUrl);

    let y = 60;
    drawTableHeader(doc, y, isGeneral);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30);

    const rowHeight = 7;

    for (const m of filteredMembers) {
      if (y > 280) {
        doc.addPage();
        drawPdfHeader(doc, headerInfo, title, subtitle, logoDataUrl);
        y = 60;
        drawTableHeader(doc, y, isGeneral);
        y += 10;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(30);
      }

      const reg = safeText(m.registrationNumber);
      const name = safeText(m.fullName).toUpperCase();
      const role = safeText(m.role);
      const status = safeText(m.status);
      const cong = safeText(m.congregation);

      doc.text(reg.substring(0, 12), 12, y);
      doc.text(name.substring(0, 45), 40, y);
      doc.text(role.substring(0, 22), 120, y);
      doc.text(status.substring(0, 14), 160, y);

      if (isGeneral) {
        doc.text(cong.substring(0, 10), 188, y, { align: "right" });
      }

      doc.setDrawColor(235);
      doc.line(10, y + 2, 200, y + 2);

      y += rowHeight;
    }

    drawPdfFooter(doc);

    const fileName = isGeneral ? "relatorio_geral.pdf" : `relatorio_${congregationFilter}.pdf`;
    doc.save(fileName);
  };

  const { byRole, byStatus, byCongregation } = stats;

  const activeCount = byStatus["ATIVO"] || 0;
  const otherCount = total - activeCount;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-3xl bg-white/80 backdrop-blur border border-emerald-100 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-inner">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900">Relatórios</h2>
              <p className="text-sm text-gray-500 mt-0.5">Estatísticas e geração de PDFs por congregação.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => generateReport()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-200/50 hover:bg-emerald-800 transition-all duration-200 active:scale-[0.98]"
              title="Baixar relatório geral"
            >
              <Download className="w-4 h-4" />
              RELATÓRIO GERAL
            </button>

            {CONGREGATIONS_LIST.map((cong) => (
              <button
                key={cong}
                onClick={() => generateReport(cong)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-emerald-200 text-emerald-800 font-bold hover:bg-emerald-50 transition-all duration-200 active:scale-[0.98]"
                title={`Baixar relatório de ${cong}`}
              >
                <Download className="w-4 h-4" />
                {cong}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total de Membros" count={total} tone="blue" icon={<Users className="w-6 h-6" />} />
        <StatCard title="Ativos" count={activeCount} tone="emerald" icon={<Activity className="w-6 h-6" />} />
        <StatCard title="Inativos/Outros" count={otherCount} tone="amber" icon={<PieChart className="w-6 h-6" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
            <h3 className="text-lg font-black text-gray-900">Membros por Cargo</h3>
            <p className="text-sm text-gray-500 mt-0.5">Distribuição de cargos no cadastro.</p>
          </div>

          <div className="p-6 space-y-3">
            {(Object.entries(byRole) as [string, number][])
              .sort((a, b) => b[1] - a[1])
              .map(([role, count]) => {
                const pct = Math.round((count / (total || 1)) * 100);
                return (
                  <div key={role} className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-800 truncate">{role}</div>
                      <div className="text-xs text-gray-500">{pct}% do total</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-40 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${(count / (total || 1)) * 100}%` }}
                        />
                      </div>
                      <div className="text-sm font-black text-gray-900 w-8 text-right">{count}</div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
              <h3 className="text-lg font-black text-gray-900">Por Congregação</h3>
              <p className="text-sm text-gray-500 mt-0.5">Quantidade de membros por local.</p>
            </div>

            <div className="p-6 space-y-3">
              {Object.entries(byCongregation)
                .sort((a, b) => b[1] - a[1])
                .map(([cong, count]) => (
                  <div key={cong} className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{cong}</span>
                    <span className="text-sm font-black text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
              <h3 className="text-lg font-black text-gray-900">Situação</h3>
              <p className="text-sm text-gray-500 mt-0.5">Ativos, inativos e demais status.</p>
            </div>

            <div className="p-6 grid grid-cols-2 gap-3">
              {Object.entries(byStatus)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <div
                    key={status}
                    className="rounded-2xl bg-gray-50 border border-gray-100 p-4 text-center hover:shadow-md transition-all duration-300"
                  >
                    <span className="block text-gray-500 text-[11px] font-black uppercase tracking-wide">
                      {status}
                    </span>
                    <span className="block text-gray-900 font-black text-2xl mt-1">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center">
        Dica: os PDFs gerados já saem com cabeçalho verde e paginação automática.
      </div>
    </div>
  );
};
