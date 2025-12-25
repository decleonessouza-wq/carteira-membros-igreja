import React, { useEffect, useMemo, useState } from "react";
import { Form } from "./components/Form";
import { Card } from "./components/Card";
import { MemberList } from "./components/MemberList";
import { Reports } from "./components/Reports";
import { Login } from "./components/Login";
import { Member, AppView } from "./types";
import { INITIAL_MEMBER_STATE, ChurchLogo, APP_LOGO_SRC } from "./constants";
import {
  Printer,
  ChevronLeft,
  Image as ImageIcon,
  FileType,
  BarChart3,
  LogOut,
  RefreshCw,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { supabase } from "./src/lib/supabaseClient";
import {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
} from "./src/lib/services/membersService";

// ✅ Carteira horizontal: 10cm + 10cm + gap ~0.3cm = 20.3cm (203mm)
// Altura: 6.5cm (65mm)
const CARD_PDF_W_MM = 203;
const CARD_PDF_H_MM = 65;

function todayISODate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeToISODate(value: string) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }

  return value;
}

// ✅ aguarda todas as imagens dentro do elemento carregarem (logo, marca d'água, foto, etc.)
async function waitForImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if ((img as HTMLImageElement).complete) return resolve();
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        })
    )
  );
}

// ✅ calcula a próxima matrícula corretamente (numérica), sem depender do ORDER do banco (texto)
function getNextRegistrationNumber(existing: Array<string | undefined | null>) {
  const used = new Set(existing.map((v) => String(v ?? "").trim()).filter(Boolean));

  let max = 0;

  for (const raw of used) {
    // pega só o prefixo numérico (antes de "-"), exemplo: "12-PRE" -> "12"
    const base = raw.split("-")[0]?.trim() ?? "";
    const n = parseInt(base, 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }

  // candidato inicial
  let next = max + 1;

  // garante que não existe exatamente "next" (ex: "10") já cadastrado
  while (used.has(String(next))) next += 1;

  return String(next);
}

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LIST);

  // Auth
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Dados
  const [members, setMembers] = useState<Member[]>([]);
  const [currentMember, setCurrentMember] = useState<Member>(INITIAL_MEMBER_STATE);

  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Logo (header) - fallback seguro
  const [headerLogoOk, setHeaderLogoOk] = useState(true);

  const isLogged = !!sessionUserId;

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      setAuthLoading(true);
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) {
        console.error(error);
        setSessionUserId(null);
      } else {
        setSessionUserId(data.session?.user?.id ?? null);
      }
      setAuthLoading(false);
    };

    boot();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSessionUserId(sess?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const fetchMembers = async () => {
    setDataLoading(true);
    setDataError(null);

    try {
      const list = await getMembers(); // ✅ usa RLS + user logado
      const sorted = [...list].sort((a, b) => {
        const av = String(a.registrationNumber ?? "");
        const bv = String(b.registrationNumber ?? "");
        return av.localeCompare(bv, "pt-BR", { numeric: true });
      });
      setMembers(sorted);
    } catch (err: any) {
      console.error(err);
      setDataError(err?.message ?? "Erro ao carregar membros.");
      setMembers([]);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (sessionUserId) {
      fetchMembers();
      setView(AppView.LIST);
    } else {
      setMembers([]);
      setView(AppView.LIST);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUserId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const goBack = () => {
    if (view === AppView.FORM) setView(AppView.LIST);
    else if (view === AppView.CARD) setView(AppView.LIST);
    else if (view === AppView.REPORTS) setView(AppView.LIST);
  };

  const handleNewMember = async () => {
    if (!sessionUserId) return;

    // ✅ NOVO: calcula pela lista já carregada (evita bug do "10")
    const nextReg = getNextRegistrationNumber(members.map((m) => m.registrationNumber));

    setCurrentMember({
      ...INITIAL_MEMBER_STATE,
      registrationNumber: nextReg,
      registrationDate: todayISODate(),
    });

    setView(AppView.FORM);
  };

  const handleEditMember = (member: Member) => {
    setCurrentMember(member);
    setView(AppView.FORM);
  };

  const handleDeleteMember = async (id: string) => {
    if (!sessionUserId) return;
    const confirm = window.confirm("Tem certeza que deseja excluir este membro?");
    if (!confirm) return;

    try {
      setDataLoading(true);
      setDataError(null);

      await deleteMember(id); // ✅ usa RLS

      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      console.error(err);
      setDataError(err?.message ?? "Erro ao excluir membro.");
    } finally {
      setDataLoading(false);
    }
  };

  const handleSaveMember = async () => {
    if (!sessionUserId) return;

    if (!currentMember.fullName) {
      alert("Por favor, preencha o nome do membro.");
      return;
    }

    try {
      setDataLoading(true);
      setDataError(null);

      const normalized: Member = {
        ...currentMember,
        birthDate: normalizeToISODate(currentMember.birthDate),
        baptismDate: normalizeToISODate(currentMember.baptismDate),
        registrationDate: normalizeToISODate(currentMember.registrationDate),
      };

      const saved = normalized.id
        ? await updateMember(normalized)
        : await createMember(normalized);

      setMembers((prev) => {
        const exists = prev.some((m) => m.id === saved.id);
        const next = exists ? prev.map((m) => (m.id === saved.id ? saved : m)) : [...prev, saved];
        return next.sort((a, b) =>
          String(a.registrationNumber ?? "").localeCompare(String(b.registrationNumber ?? ""), "pt-BR", {
            numeric: true,
          })
        );
      });

      setCurrentMember(saved);
      setView(AppView.LIST);
    } catch (err: any) {
      console.error(err);

      const msg = String(err?.message ?? "Erro ao salvar membro.");
      setDataError(msg);

      // ✅ mensagem mais amigável para a constraint de matrícula
      if (msg.toLowerCase().includes("members_registration_number_uq") || msg.toLowerCase().includes("duplicate key")) {
        alert(
          "Essa matrícula já existe. Clique em 'Novo Membro' novamente para o sistema gerar a próxima matrícula e tente salvar."
        );
      } else {
        alert(msg);
      }
    } finally {
      setDataLoading(false);
    }
  };

  const handleGenerateCard = (member: Member) => {
    setCurrentMember(member);
    setView(AppView.CARD);
  };

  const captureCardCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const element = document.getElementById("member-card-print") as HTMLElement | null;
    if (!element) return null;

    try {
      // @ts-ignore
      if (document.fonts?.ready) {
        // @ts-ignore
        await document.fonts.ready;
      }
    } catch (_) {
      // ignore
    }

    await waitForImages(element);

    const rect = element.getBoundingClientRect();
    const width = Math.ceil(rect.width);
    const height = Math.ceil(rect.height);

    return await html2canvas(element, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      scrollX: 0,
      scrollY: -window.scrollY,
    });
  };

  const handleDownloadPDF = async () => {
    try {
      const canvas = await captureCardCanvas();
      if (!canvas) return;

      const imgData = canvas.toDataURL("image/png", 1.0);

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [CARD_PDF_W_MM, CARD_PDF_H_MM],
      });

      pdf.addImage(imgData, "PNG", 0, 0, CARD_PDF_W_MM, CARD_PDF_H_MM, undefined, "FAST");
      pdf.save(`carteira-${currentMember.fullName || "membro"}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar PDF.");
    }
  };

  const handleDownloadImage = async () => {
    try {
      const canvas = await captureCardCanvas();
      if (!canvas) return;

      const link = document.createElement("a");
      link.download = `carteira-${currentMember.fullName || "membro"}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar imagem.");
    }
  };

  const handleGoReports = () => setView(AppView.REPORTS);

  const headerRight = useMemo(() => {
    if (!isLogged) return null;

    const btnBase =
      "inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 hover:bg-white border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]";

    return (
      <div className="flex items-center gap-2">
        <button onClick={() => fetchMembers()} className={btnBase} title="Atualizar">
          <RefreshCw className={"w-4 h-4 " + (dataLoading ? "animate-spin" : "")} />
          <span className="text-sm font-semibold text-gray-700">Atualizar</span>
        </button>

        <button onClick={handleLogout} className={btnBase} title="Sair">
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-semibold text-gray-700">Sair</span>
        </button>
      </div>
    );
  }, [isLogged, dataLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        Carregando sessão...
      </div>
    );
  }

  if (!isLogged) {
    return <Login onSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-green-50 to-emerald-100">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/75 backdrop-blur-md border-b border-emerald-100 shadow-[0_1px_0_rgba(16,185,129,0.08)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-2xl shadow-md border border-emerald-100 flex items-center justify-center overflow-hidden">
              {headerLogoOk ? (
                <img
                  src={APP_LOGO_SRC || "/logo_app.png"}
                  alt="Logo"
                  className="w-full h-full object-contain p-1"
                  onError={() => setHeaderLogoOk(false)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-green-700">
                  <ChurchLogo />
                </div>
              )}
            </div>

            <div className="leading-tight">
              <div className="text-[12px] md:text-sm text-gray-500 font-medium">
                Igreja Ev.Pent. JARDIM DE ORAÇÃO INDEPENDENTE
              </div>
              <div className="font-black text-gray-900 text-[15px] md:text-base tracking-tight">
                Cadastro de Membros
              </div>
              <div className="text-[11px] md:text-xs text-emerald-700 font-semibold">
                Igreja • Secretaria • Relatórios
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view !== AppView.LIST && (
              <button
                onClick={goBack}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 hover:bg-white border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
                title="Voltar"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm font-semibold text-gray-700">Voltar</span>
              </button>
            )}
            {headerRight}
          </div>
        </div>
      </header>

      {/* Alerts */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        {dataError && (
          <div className="mb-4 text-sm text-red-700 bg-red-50/90 border border-red-200 rounded-2xl p-4 shadow-sm">
            {dataError}
          </div>
        )}
      </div>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 pb-10">
        <div className="animate-in fade-in duration-300">
          {view === AppView.LIST && (
            <MemberList
              members={members}
              onNewMember={handleNewMember}
              onEdit={handleEditMember}
              onGenerateCard={handleGenerateCard}
              onDelete={handleDeleteMember}
              onReports={handleGoReports}
            />
          )}

          {view === AppView.FORM && (
            <Form data={currentMember} onChange={setCurrentMember} onSubmit={handleSaveMember} />
          )}

          {view === AppView.CARD && (
            <div className="space-y-4">
              <Card member={currentMember} id="member-card-print" />

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
                >
                  <FileType className="w-4 h-4" />
                  Baixar PDF
                </button>

                <button
                  onClick={handleDownloadImage}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-emerald-200 text-emerald-800 font-bold hover:bg-emerald-50 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
                >
                  <ImageIcon className="w-4 h-4" />
                  Baixar Imagem
                </button>

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-emerald-200 text-emerald-800 font-bold hover:bg-emerald-50 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>

                <button
                  onClick={handleGoReports}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-emerald-200 text-emerald-800 font-bold hover:bg-emerald-50 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
                >
                  <BarChart3 className="w-4 h-4" />
                  Relatórios
                </button>
              </div>
            </div>
          )}

          {view === AppView.REPORTS && <Reports members={members} />}
        </div>

        {dataLoading && (
          <div className="fixed bottom-4 right-4 bg-white border border-emerald-100 shadow-lg rounded-2xl px-4 py-3 text-sm text-gray-700 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Sincronizando...
          </div>
        )}
      </main>

      {/* Footer (não aparece na impressão) */}
      <footer className="print:hidden border-t border-emerald-100 bg-white/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 text-center text-xs md:text-sm text-gray-600">
          ©2026 - <span className="font-semibold">I.E.P.J.O.I</span> - Cadastro de membros - Produzido com excelência{" "}
          <span className="font-semibold">By Decleones Andrade</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
