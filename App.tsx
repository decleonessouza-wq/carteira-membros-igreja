import React, { useState, useEffect } from 'react';
import { Form } from './components/Form';
import { Card } from './components/Card';
import { MemberList } from './components/MemberList';
import { Reports } from './components/Reports';
import { Login } from './components/Login';
import { Member, AppView } from './types';
import { INITIAL_MEMBER_STATE, ChurchLogo } from './constants';
import { Printer, ChevronLeft, Image as ImageIcon, FileType, BarChart3, LogOut } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/src/lib/supabaseClient';

const STORAGE_KEY = 'jardim-oracao-members';
const SEQUENCE_KEY = 'jardim-oracao-sequence';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const [view, setView] = useState<AppView>(AppView.LIST);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentMember, setCurrentMember] = useState<Member>(INITIAL_MEMBER_STATE);
  const [nextSequence, setNextSequence] = useState<number>(1);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return;
        setSession(data.session ?? null);
        setAuthLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setAuthLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const storedMembers = localStorage.getItem(STORAGE_KEY);
    if (storedMembers) {
      setMembers(JSON.parse(storedMembers));
    }
    const storedSequence = localStorage.getItem(SEQUENCE_KEY);
    if (storedSequence) {
      setNextSequence(parseInt(storedSequence, 10));
    } else {
      setNextSequence(1);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(SEQUENCE_KEY, String(nextSequence));
  }, [nextSequence]);

  const handleSaveMember = (member: Member) => {
    let updatedMembers: Member[];
    if (member.id) {
      updatedMembers = members.map(m => m.id === member.id ? member : m);
    } else {
      const newMember = { ...member, id: String(nextSequence), sequence: nextSequence };
      updatedMembers = [...members, newMember];
      setNextSequence(prev => prev + 1);
    }
    setMembers(updatedMembers);
    setCurrentMember(INITIAL_MEMBER_STATE);
    setView(AppView.LIST);
  };

  const handleEditMember = (member: Member) => {
    setCurrentMember(member);
    setView(AppView.FORM);
  };

  const handleViewCard = (member: Member) => {
    setCurrentMember(member);
    setView(AppView.CARD);
  };

  const handleDeleteMember = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este membro?")) {
      setMembers(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView(AppView.LIST);
  };

  const captureCardCanvas = async () => {
    const element = document.getElementById('member-card');
    if (!element) {
      alert("Card não encontrado.");
      return null;
    }

    const hideElements = element.querySelectorAll('.no-print');
    hideElements.forEach(el => ((el as HTMLElement).style.display = 'none'));

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    hideElements.forEach(el => ((el as HTMLElement).style.display = ''));

    return canvas;
  };

  const handleDownloadPNG = async () => {
    try {
      const canvas = await captureCardCanvas();
      if (!canvas) return;

      const link = document.createElement('a');
      link.download = `carteira-${currentMember.fullName.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      console.error("Erro ao gerar PNG:", err);
      alert("Erro ao gerar PNG.");
    }
  };

  /**
   * Exporta como PDF:
   * PDF no tamanho real 10cm x 13cm (100mm x 130mm)
   * Frente (10x6,5) em cima e Verso (10x6,5) embaixo
   */
  const handleDownloadPDF = async () => {
    try {
      const canvas = await captureCardCanvas();
      if (!canvas) return;

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [100, 130] // 10cm x 13cm
      });

      // ocupa a página toda (100 x 130)
      pdf.addImage(imgData, 'PNG', 0, 0, 100, 130, undefined, 'FAST');
      pdf.save(`carteira-${currentMember.fullName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Erro ao gerar PDF.");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl px-8 py-10 text-center max-w-md w-full">
          <div className="text-white text-xl font-extrabold">Carregando...</div>
          <div className="text-green-100 text-sm mt-2 opacity-90">Verificando sua sessão</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login appName="Carteira Digital - Jardim de Oração" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#00C993] pb-12 print:bg-white">
      {/* Modern Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 overflow-hidden">
            {/* LOGO MAIOR (máximo possível sem estourar) */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-white rounded-xl p-1 shadow-lg border border-gray-100">
              {/* usa sua logo do /public; se faltar, cai no SVG antigo */}
              <img
                src="/logo_app.png"
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="hidden">
                <ChurchLogo />
              </div>
            </div>

            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight truncate">
                Carteira Digital
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                Igreja Evangélica Pentecostal - JARDIM DE ORAÇÃO INDEPENDENTE
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-2 sm:gap-3">
            {view === AppView.CARD ? (
              <>
                <button
                  onClick={handleDownloadPNG}
                  className="shadow-lg flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <ImageIcon className="w-4 h-4" /> PNG
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="shadow-lg flex items-center gap-2 px-4 py-2 bg-green-700 text-white font-semibold rounded-lg hover:bg-green-800 transition-all"
                >
                  <FileType className="w-4 h-4" /> PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="shadow-lg flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Printer className="w-4 h-4" /> Imprimir
                </button>
              </>
            ) : view === AppView.LIST ? (
              <button
                onClick={() => setView(AppView.REPORTS)}
                className="shadow-lg flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:text-green-700 hover:bg-green-50 rounded-lg transition-all"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Relatórios</span>
              </button>
            ) : (
              <button
                onClick={() => setView(AppView.LIST)}
                className="shadow-lg flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:text-green-700 hover:bg-green-50 rounded-lg transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="shadow-lg flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 font-semibold rounded-lg hover:bg-red-100 transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 print:p-0 print:w-full">

        {view === AppView.LIST && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="max-w-3xl mx-auto shadow-lg rounded-2xl">
              <Form
                data={currentMember}
                onChange={setCurrentMember}
                onSubmit={handleSaveMember}
                onCancel={() => {
                  setCurrentMember(INITIAL_MEMBER_STATE);
                }}
                onViewList={() => setView(AppView.LIST)}
              />
            </div>

            <MemberList
              members={members}
              onEdit={handleEditMember}
              onViewCard={handleViewCard}
              onDelete={handleDeleteMember}
            />
          </div>
        )}

        {view === AppView.REPORTS && (
          <div className="animate-in fade-in duration-500">
            <Reports members={members} />
          </div>
        )}

        {view === AppView.FORM && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-lg rounded-2xl">
            <Form
              data={currentMember}
              onChange={setCurrentMember}
              onSubmit={handleSaveMember}
            />
          </div>
        )}

        {view === AppView.CARD && (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
            <div className="w-full max-w-md shadow-lg rounded-2xl">
              <Card member={currentMember} />
            </div>
            <p className="text-center mt-6 text-sm text-white/90 max-w-2xl bg-black/20 p-4 rounded-xl">
              * Para melhor qualidade, baixe o PDF e imprima em papel fotográfico ou PVC. Dimensões: 10cm x 13cm (frente/verso).
            </p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 mt-auto no-print shadow-lg">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">© 2026 Igreja Evangélica Pentecostal Jardim de Oração Independente</p>
          <p className="text-xs text-gray-400 mt-1">Desenvolvido com excelência por Decleones Andrade</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
