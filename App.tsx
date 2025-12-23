import React, { useState, useEffect } from 'react';
import { Form } from './components/Form';
import { Card } from './components/Card';
import { MemberList } from './components/MemberList';
import { Reports } from './components/Reports';
import { Member, AppView } from './types';
import { INITIAL_MEMBER_STATE } from './constants';
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
        return prev.map(m => (m.id === currentMember.id ? currentMember : m));
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

  const handleDownloadPNG = async () => {
    const element = document.getElementById('card-preview');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 4,
        useCORS: true,
        backgroundColor: null
      });
      const link = document.createElement('a');
      link.download = `carteira-${currentMember.fullName.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Erro ao gerar imagem:", err);
      alert("Erro ao gerar imagem.");
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('card-preview');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 4, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // Mantém proporção do canvas e centraliza no A4
      const margin = 10;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;

      const ratio = canvas.width / canvas.height;
      let drawW = maxW;
      let drawH = drawW / ratio;

      if (drawH > maxH) {
        drawH = maxH;
        drawW = drawH * ratio;
      }

      const x = (pageW - drawW) / 2;
      const y = (pageH - drawH) / 2;

      pdf.addImage(imgData, 'PNG', x, y, drawW, drawH);
      pdf.save(`carteira-${currentMember.fullName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Erro ao gerar PDF.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-12">
      {/* Modern Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 flex-shrink-0 bg-green-50 rounded-lg p-1 shadow-sm border border-green-100 flex items-center justify-center overflow-hidden">
              <img
                src="/logo_app.png"
                alt="Logo Igreja"
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-gray-900 leading-tight truncate sm:whitespace-normal">
                Igreja Evangélica Pentecostal Jardim de Oração Independente
              </h1>
              <p className="text-xs text-gray-500 font-medium">Gestão de Membros</p>
            </div>
          </div>

          <nav className="flex items-center gap-2 flex-shrink-0">
            {view === AppView.LIST ? (
              <button
                onClick={() => setView(AppView.REPORTS)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Relatórios</span>
              </button>
            ) : (
              <button
                onClick={() => setView(AppView.LIST)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all"
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
          <MemberList
            members={members}
            onNewMember={handleNewMember}
            onEdit={handleEditMember}
            onGenerateCard={handleGenerateCard}
            onDelete={handleDeleteMember}
          />
        )}

        {view === AppView.REPORTS && <Reports members={members} />}

        {view === AppView.FORM && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Form data={currentMember} onChange={setCurrentMember} onSubmit={handleSaveMember} />
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
                    className="btn-secondary flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" /> PNG
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="btn-primary flex items-center gap-2 px-4 py-2 bg-green-700 text-white font-semibold rounded-lg hover:bg-green-800 shadow-md shadow-green-200 transition-all"
                  >
                    <FileType className="w-4 h-4" /> PDF
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="btn-secondary flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Printer className="w-4 h-4" /> Imprimir
                  </button>
                </div>
              </div>
            </div>

            {/* Print Container */}
            <div className="overflow-auto max-w-full p-4 md:p-10 bg-gray-200/50 rounded-xl border border-gray-300 print:bg-white print:border-none print:p-0">
              <div id="card-preview" className="inline-block bg-white p-1 print:p-0">
                <Card member={currentMember} id="card-element" />
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-400 no-print">
              * Para melhor qualidade, baixe o PDF e imprima em papel fotográfico ou PVC. Dimensões: 10cm x 6.5cm.
            </p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 mt-auto no-print">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">© 2026 Igreja Evangélica Pentecostal Jardim de Oração Independente</p>
          <p className="text-xs text-gray-400 mt-1">Desenvolvido com excelência por Decleones Andrade</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
