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
import { memberFromRow, memberToRow, MemberRow } from "./src/lib/memberMapper";

const MEMBERS_TABLE = "members";

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

  const fetchMembers = async (userId: string) => {
    setDataLoading(true);
    setDataError(null);

    try {
      const { data, error } = await supabase
        .from(MEMBERS_TABLE)
        .select("*")
        .eq("user_id", userId)
        .order("registration_number", { ascending: true });

      if (error) throw error;

      const list = (data ?? []).map((r: any) => memberFromRow(r as MemberRow));
      setMembers(list);
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
      fetchMembers(sessionUserId);
      setView(AppView.LIST);
    } else {
      setMembers([]);
      setView(AppView.LIST);
    }
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

    let next = 1;
    try {
      const { data, error } = await supabase
        .from(MEMBERS_TABLE)
        .select("registration_number")
        .eq("user_id", sessionUserId)
        .order("registration_number", { ascending: false })
        .limit(1);

      if (error) throw error;

      const maxVal = data?.[0]?.registration_number;
      const maxNum = parseInt(String(maxVal ?? "0"), 10);
      if (!Number.isNaN(maxNum) && maxNum >= 0) next = maxNum + 1;
    } catch (e) {
      next = 1;
    }

    setCurrentMember({
      ...INITIAL_MEMBER_STATE,
      registrationNumber: String(next),
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

      const { error } = await supabase
        .from(MEMBERS_TABLE)
        .delete()
        .eq("id", id)
        .eq("user_id", sessionUserId);

      if (error) throw error;

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

      const row = memberToRow(normalized, sessionUserId) as any;

      let savedRow: any = null;

      if (normalized.id) {
        const { data, error } = await supabase
          .from(MEMBERS_TABLE)
          .update(row)
          .eq("id", normalized.id)
          .eq("user_id", sessionUserId)
          .select("*")
          .single();

        if (error) throw error;
        savedRow = data;
      } else {
        const { id, ...rowNoId } = row;
        const { data, error } = await supabase
          .from(MEMBERS_TABLE)
          .insert(rowNoId)
          .select("*")
          .single();

        if (error) throw error;
        savedRow = data;
      }

      const saved = memberFromRow(savedRow as MemberRow);

      setMembers((prev) => {
        const exists = prev.some((m) => m.id === saved.id);
        if (exists) return prev.map((m) => (m.id === saved.id ? saved : m));
        return [...prev, saved];
      });

      setCurrentMember(saved);
      setView(AppView.LIST);
    } catch (err: any) {
      console.error(err);
      setDataError(err?.message ?? "Erro ao salvar membro.");
      alert(err?.message ?? "Erro ao salvar membro.");
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

    // ✅ garante fontes e imagens carregadas para não “pular” layout no export
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

    // ✅ força medidas corretas do elemento (sem depender do viewport/scroll)
    const rect = element.getBoundingClientRect();
    const width = Math.ceil(rect.width);
    const height = Math.ceil(rect.height);

    return await html2canvas(element, {
      scale: 3, // mais nítido e reduz risco de “quebrar” texto
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

      // ✅ PDF HORIZONTAL no tamanho exato da carteira (20.3cm x 6.5cm)
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
        <button
          onClick={() => sessionUserId && fetchMembers(sessionUserId)}
          className={btnBase}
          title="Atualizar"
        >
          <RefreshCw className={"w-4 h-4 " + (dataLoading ? "animate-spin" : "")} />
          <span className="text-sm font-semibold text-gray-700">Atualizar</span>
        </button>

        <button onClick={handleLogout} className={btnBase} title="Sair">
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-semibold text-gray-700">Sair</span>
        </button>
      </div>
    );
  }, [isLogged, dataLoading, sessionUserId]);

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
                Carteira Digital
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
