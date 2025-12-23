import React, { useState, useEffect } from 'react';
import { Form } from './components/Form';
import { Card } from './components/Card';
import { MemberList } from './components/MemberList';
import { Reports } from './components/Reports';
import { Member, AppView } from './types';
import { INITIAL_MEMBER_STATE, ChurchLogo } from './constants';
import { Printer, ChevronLeft, Image as ImageIcon, FileType, BarChart3 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const STORAGE_KEY = 'jardim-oracao-members';
const SEQUENCE_KEY = 'jardim-oracao-sequence';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LIST);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentMember, setCurrentMember] = useState<Member>(INITIAL_MEMBER_STATE);
  const [nextSequence, setNextSequence] = useState<number>(1);

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
    localStorage.setItem(SEQUENCE_KEY, nextSequence.toString());
  }, [nextSequence]);

  const handleNewMember = () => {
    const regNum = nextSequence.toString().padStart(3, '0');
    setCurrentMember({
      ...INITIAL_MEMBER_STATE,
      id: Date.now().toString(),
      registrationNumber: regNum
    });
    setView(AppView.FORM);
  };

  const handleEditMember = (member: Member) => {
    setCurrentMember(member);
    setView(AppView.FORM);
  };

  const handleDeleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleSaveMember = () => {
    if (!currentMember.fullName) {
      alert("Por favor, preencha o nome do membro.");
      return;
    }

    let isNew = false;
    setMembers(prev => {
      const exists = prev.find(m => m.id === currentMember.id);
      if (exists) {
        return prev.map(m => m.id === currentMember.id ? currentMember : m);
      } else {
        isNew = true;
        return [...prev, currentMember];
      }
    });

    if (isNew) {
      setNextSequence(prev => prev + 1);
    }
    setView(AppView.LIST);
  };

  const handleGenerateCard = (member: Member) => {
    setCurrentMember(member);
    setView(AppView.CARD);
  };

  /**
   * Renderiza em alta qualidade sem “desconfigurar”:
   * - força background branco (para export)
   * - usa scale alto
   * - evita deslocamentos por scroll
   */
  const captureCardCanvas = async () => {
    const element = document.getElementById('card-preview');
    if (!element) return null;

    const canvas = await html2canvas(element, {
      scale: 4,
      useCORS: true,
      backgroundColor: '#FFFFFF',
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: document.documentElement.clientWidth,
      windowHeight: document.documentElement.clientHeight
    });

    return canvas;
  };

  const handleDownloadPNG = async () => {
    try {
      const canvas = await captureCardCanvas();
      if (!canvas) return;

      const link = document.createElement('a');
      link.download = `carteira-${currentMember.fullName.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Erro ao gerar imagem:", err);
      alert("Erro ao gerar imagem.");
    }
  };

  /**
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
              <div className="w-full h-full text-green-700" aria-hidden>
                <ChurchLogo />
              </div>
            </div>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-gray-900 leading-tight truncate sm:whitespace-normal">
                Igreja Evangélica Pentecostal - JARDIM DE ORAÇÃO INDEPENDENTE
              </h1>
              <p className="text-xs text-gray-500 font-medium">Gestão de Membros</p>
            </div>
          </div>

          <nav className="flex items-center gap-2 flex-shrink-0">
            {view === AppView.LIST ? (
              <button
                onClick={() => setView(AppView.REPORTS)}
                className="shadow-lg flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Relatórios</span>
              </button>
            ) : (
              <button
                onClick={() => setView(AppView.LIST)}
                className="shadow-lg flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 print:p-0 print:w-full">

        {view === AppView.LIST && (
          <div className="shadow-lg rounded-2xl">
            <MemberList
              members={members}
              onNewMember={handleNewMember}
              onEdit={handleEditMember}
              onGenerateCard={handleGenerateCard}
              onDelete={handleDeleteMember}
            />
          </div>
        )}

        {view === AppView.REPORTS && (
          <div className="shadow-lg rounded-2xl">
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

            <div className="w-full max-w-3xl mb-8 no-print">
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Pré-visualização da Carteira</h3>
                  <p className="text-sm text-gray-500 mt-1">Verifique os dados abaixo antes de exportar.</p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
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
                </div>
              </div>
            </div>

            {/* Print / Export Container */}
            <div className="overflow-auto max-w-full p-4 md:p-10 bg-white/25 rounded-2xl border border-white/40 shadow-lg print:bg-white print:border-none print:p-0">
              <div id="card-preview" className="inline-block bg-white p-2 shadow-lg print:shadow-none print:p-0">
                {/* Agora o Card renderiza no tamanho 10x13cm total */}
                <Card member={currentMember} id="card-element" />
              </div>
            </div>

            <p className="mt-4 text-xs text-white/90 no-print">
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
