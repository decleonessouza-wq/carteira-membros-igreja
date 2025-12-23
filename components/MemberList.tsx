import React, { useState } from 'react';
import { Member } from '../types';
import { UserPlus, Search, Edit, CreditCard, Trash2, User, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import { CONGREGATION_DETAILS } from '../constants';

interface MemberListProps {
  members: Member[];
  onNewMember: () => void;
  onEdit: (member: Member) => void;
  onGenerateCard: (member: Member) => void;
  onDelete: (id: string) => void;
}

export const MemberList: React.FC<MemberListProps> = ({ 
  members, onNewMember, onEdit, onGenerateCard, onDelete 
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.cpf.includes(searchTerm) ||
    m.registrationNumber?.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ATIVO': return 'bg-green-100 text-green-800';
      case 'INATIVO': return 'bg-orange-100 text-orange-800';
      case 'DESLIGADO': return 'bg-red-100 text-red-800';
      case 'FALECIDO': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const generateMemberSheet = (member: Member) => {
    // PDF Logic kept same as logic is sound, improved headers only
    const doc = new jsPDF();
    const congData = CONGREGATION_DETAILS[member.congregation] || CONGREGATION_DETAILS['SEDE'];
    
    // Header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(congData.name, 105, 15, { align: "center", maxWidth: 180 });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Endereço: ${congData.address}`, 105, 25, { align: "center", maxWidth: 180 });
    doc.text(`Pastor Local: ${congData.pastor}`, 105, 30, { align: "center" });

    doc.setLineWidth(0.5);
    doc.line(10, 35, 200, 35);

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("FICHA DE MEMBRO", 105, 45, { align: "center" });

    // Photo Box
    doc.setDrawColor(0);
    doc.rect(160, 40, 30, 40);
    if (member.photo) {
      try {
        doc.addImage(member.photo, "JPEG", 161, 41, 28, 38);
      } catch (e) {
        doc.setFontSize(8);
        doc.text("Foto", 175, 60, { align: "center" });
      }
    } else {
      doc.setFontSize(8);
      doc.text("Sem Foto", 175, 60, { align: "center" });
    }

    // Data Fields
    let y = 60;
    const lineHeight = 10;
    
    const addField = (label: string, val: string, x: number) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, x, y);
      doc.setFont("helvetica", "normal");
      doc.text(val || "-", x + doc.getTextWidth(`${label}: `), y);
    };

    addField("Matrícula", member.registrationNumber || "N/A", 15);
    y += lineHeight;
    
    addField("Nome Completo", member.fullName, 15);
    y += lineHeight;

    addField("CPF", member.cpf, 15);
    addField("RG", member.rg, 100);
    y += lineHeight;

    addField("Data Nasc.", member.birthDate ? new Date(member.birthDate).toLocaleDateString('pt-BR') : "-", 15);
    addField("Naturalidade", member.naturalness, 80);
    y += lineHeight;

    addField("Pai", member.fatherName, 15);
    y += lineHeight;
    addField("Mãe", member.motherName, 15);
    y += lineHeight;

    addField("Telefone", member.phone, 15);
    addField("Email", member.email, 100);
    y += lineHeight;

    // Construct Address
    const fullAddress = `${member.addressStreet}, ${member.addressNumber} - ${member.addressNeighborhood} - ${member.addressCity}/${member.addressState} - CEP: ${member.addressCep} ${member.addressComplement ? `(${member.addressComplement})` : ''}`;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Endereço:", 15, y);
    doc.setFont("helvetica", "normal");
    // Handle long addresses by splitting text
    const addressLines = doc.splitTextToSize(fullAddress, 170);
    doc.text(addressLines, 15 + doc.getTextWidth("Endereço: "), y);
    
    y += (addressLines.length * 5) + 5; // Adjust Y based on address lines

    doc.line(10, y, 150, y);
    y += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Dados Eclesiásticos", 15, y);
    y += 10;

    addField("Congregação", member.congregation, 15);
    addField("Situação", member.status, 100);
    y += lineHeight;

    addField("Cargo", member.role, 15);
    addField("Data Batismo", member.baptismDate ? new Date(member.baptismDate).toLocaleDateString('pt-BR') : "-", 100);
    y += lineHeight;

    addField("Data Cadastro", member.registrationDate, 15);
    
    y = 250;
    doc.setLineWidth(0.2);
    
    doc.line(20, y, 90, y);
    doc.setFontSize(8);
    doc.text("Assinatura do Membro", 55, y + 5, { align: "center" });

    doc.line(120, y, 190, y);
    doc.text("Secretaria da Igreja", 155, y + 5, { align: "center" });

    y += 25;
    doc.line(70, y, 140, y);
    doc.text("Pastor Responsável", 105, y + 5, { align: "center" });

    doc.save(`ficha_${member.fullName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Membros Cadastrados</h2>
           <p className="text-gray-500 text-sm mt-1">Gerencie os membros, gere carteiras e fichas.</p>
        </div>
        <button 
          onClick={onNewMember}
          className="w-full md:w-auto bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-green-200 transition-all transform hover:scale-105"
        >
          <UserPlus className="w-5 h-5" /> NOVO MEMBRO
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input 
          type="text" 
          placeholder="Buscar por nome, CPF ou matrícula..." 
          className="block w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-xl leading-5 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent sm:text-sm shadow-sm transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Member Grid */}
      {filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-gray-300">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
             <User className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-900">Nenhum membro encontrado.</p>
          <p className="text-gray-500 text-sm">Tente buscar outro termo ou cadastre um novo membro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredMembers.map((member) => (
            <div key={member.id} className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:border-green-200 transition-all duration-300 flex items-start gap-5">
              
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-inner">
                  {member.photo ? (
                    <img src={member.photo} alt={member.fullName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                   #{member.registrationNumber}
                </div>
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0 py-1">
                <div className="flex items-start justify-between">
                   <div>
                      <h3 className="font-bold text-gray-900 truncate text-base group-hover:text-green-700 transition-colors uppercase">{member.fullName}</h3>
                      <p className="text-sm font-medium text-green-600 mb-1">{member.role}</p>
                   </div>
                   <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(member.status)}`}>
                      {member.status}
                   </span>
                </div>
                
                <p className="text-xs text-gray-400 mb-4 truncate">{member.congregation}</p>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto">
                  <button 
                    onClick={() => onGenerateCard(member)}
                    className="flex-1 bg-gray-50 hover:bg-green-50 text-gray-700 hover:text-green-700 py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 border border-gray-200 hover:border-green-200"
                    title="Carteira"
                  >
                    <CreditCard className="w-4 h-4" /> Carteira
                  </button>
                  <button 
                    onClick={() => generateMemberSheet(member)}
                    className="p-2 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors"
                    title="Ficha PDF"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onEdit(member)}
                    className="p-2 bg-gray-50 hover:bg-orange-50 text-gray-600 hover:text-orange-600 rounded-lg border border-gray-200 hover:border-orange-200 transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if(confirm("Tem certeza que deseja excluir este membro?")) {
                        onDelete(member.id);
                      }
                    }}
                    className="p-2 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg border border-gray-200 hover:border-red-200 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};