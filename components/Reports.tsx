import React from 'react';
import { Member } from '../types';
import { BarChart3, Users, PieChart, Activity, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { CONGREGATION_DETAILS, CONGREGATIONS_LIST } from '../constants';

interface ReportsProps {
  members: Member[];
}

export const Reports: React.FC<ReportsProps> = ({ members }) => {
  const total = members.length;
  
  // Aggregate stats
  const byRole = members.reduce((acc, m) => {
    acc[m.role] = (acc[m.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byStatus = members.reduce((acc, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byCongregation = members.reduce((acc, m) => {
    acc[m.congregation] = (acc[m.congregation] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const StatCard = ({ title, count, icon, color }: any) => (
    <div className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between`}>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{count}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
      </div>
    </div>
  );

  const generateReport = (congregationFilter?: string) => {
    const doc = new jsPDF();
    const isGeneral = !congregationFilter;
    
    const filteredMembers = congregationFilter 
      ? members.filter(m => m.congregation === congregationFilter)
      : members;
      
    // Use Sede info for General, or specific congregation info
    const headerInfo = congregationFilter 
      ? (CONGREGATION_DETAILS[congregationFilter] || CONGREGATION_DETAILS['SEDE'])
      : CONGREGATION_DETAILS['SEDE'];

    // Header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(headerInfo.name, 105, 15, { align: "center", maxWidth: 180 });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Endereço: ${headerInfo.address}`, 105, 25, { align: "center", maxWidth: 180 });
    doc.text(`Pastor Local: ${headerInfo.pastor}`, 105, 30, { align: "center" });
    
    doc.line(10, 35, 200, 35);

    // Title
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const reportTitle = isGeneral ? "RELATÓRIO GERAL DE MEMBROS" : `RELATÓRIO DE MEMBROS - ${congregationFilter}`;
    doc.text(reportTitle, 105, 45, { align: "center" });
    doc.text(`Total de Registros: ${filteredMembers.length}`, 105, 50, { align: "center" });

    // Table Header
    let y = 60;
    doc.setFontSize(10);
    doc.setFillColor(230, 230, 230);
    doc.rect(10, y - 5, 190, 8, 'F');
    doc.text("Matrícula", 12, y);
    doc.text("Nome Completo", 40, y);
    doc.text("Cargo", 110, y);
    doc.text("Situação", 150, y);
    doc.text("Congregação", 175, y); // Only relevant for General, but kept for consistency
    y += 8;

    // List
    doc.setFont("helvetica", "normal");
    filteredMembers.sort((a, b) => a.fullName.localeCompare(b.fullName)).forEach((m) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(m.registrationNumber || "-", 12, y);
      doc.text(m.fullName.substring(0, 35), 40, y);
      doc.text(m.role, 110, y);
      doc.text(m.status, 150, y);
      doc.text(m.congregation.substring(0, 10), 175, y);
      y += 6;
      doc.setDrawColor(240);
      doc.line(10, y - 4, 200, y - 4);
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Página ${i} de ${pageCount} - Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 105, 290, {align:'center'});
    }

    doc.save(`relatorio_${isGeneral ? 'geral' : congregationFilter}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-green-700" />
          <h2 className="text-xl font-bold text-gray-800">Relatório Geral</h2>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => generateReport()}
            className="flex items-center gap-1 bg-gray-800 text-white px-3 py-2 rounded text-xs font-bold hover:bg-gray-700 transition"
          >
            <Download className="w-3 h-3" /> RELATÓRIO GERAL
          </button>
          
          {CONGREGATIONS_LIST.map(cong => (
             <button 
               key={cong}
               onClick={() => generateReport(cong)}
               className="flex items-center gap-1 bg-green-700 text-white px-3 py-2 rounded text-xs font-bold hover:bg-green-600 transition"
             >
               <Download className="w-3 h-3" /> {cong}
             </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total de Membros" count={total} icon={<Users className="w-6 h-6 text-blue-600" />} color="bg-blue-50" />
        <StatCard title="Ativos" count={byStatus['ATIVO'] || 0} icon={<Activity className="w-6 h-6 text-green-600" />} color="bg-green-50" />
        <StatCard title="Inativos/Outros" count={total - (byStatus['ATIVO'] || 0)} icon={<PieChart className="w-6 h-6 text-orange-600" />} color="bg-orange-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Role */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Membros por Cargo</h3>
          <div className="space-y-3">
            {(Object.entries(byRole) as [string, number][]).sort((a,b) => b[1] - a[1]).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">{role}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / (total || 1)) * 100}%` }}></div>
                  </div>
                  <span className="text-gray-800 font-bold text-sm w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Congregation & Status */}
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Por Congregação</h3>
              <div className="space-y-3">
                {Object.entries(byCongregation).map(([cong, count]) => (
                  <div key={cong} className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">{cong}</span>
                    <span className="text-gray-800 font-bold text-sm bg-gray-100 px-2 py-1 rounded">{count}</span>
                  </div>
                ))}
              </div>
           </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Situação</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(byStatus).map(([status, count]) => (
                  <div key={status} className="bg-gray-50 p-3 rounded text-center">
                    <span className="block text-gray-500 text-xs font-bold uppercase">{status}</span>
                    <span className="block text-gray-800 font-bold text-lg">{count}</span>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};