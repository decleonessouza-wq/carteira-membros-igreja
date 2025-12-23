import React, { useRef, useEffect } from 'react';
import { Member } from '../types';
import { Camera, Upload, User, Calendar, MapPin, Users, Save, Phone, Mail, Home, Activity, Droplets, CreditCard, Navigation } from 'lucide-react';
import { CONGREGATIONS_LIST } from '../constants';

interface FormProps {
  data: Member;
  onChange: (data: Member) => void;
  onSubmit: () => void;
}

const ROLES_ECLESIASTICOS = [
  "Membro", "Músico", "Cooperador", "Diácono", "Presbítero", "Evangelista", "Pastor", "Missionário"
];

const ROLES_ADMINISTRATIVOS = [
  "Presidente de Honra", 
  "Presidente", 
  "Vice-Presidente", 
  "1° Tesoureiro", 
  "2° Tesoureiro", 
  "1° Secretário", 
  "2° Secretário"
];

const STATUS_OPTIONS = [
  "ATIVO", "SUSPENSO", "DESLIGADO", "INATIVO", "FALECIDO"
];

const UF_LIST = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

// Moved outside to prevent re-mounting on every render
const InputGroup = ({ label, icon: Icon, children, className = "mb-4" }: any) => (
  <div className={className}>
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
    <div className="relative group">
      {Icon && <Icon className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />}
      {children}
    </div>
  </div>
);

export const Form: React.FC<FormProps> = ({ data, onChange, onSubmit }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus on name input only once when component mounts and name is empty
  useEffect(() => {
    if ((!data.id || data.fullName === "") && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []); // Empty dependency array ensures this only runs on mount

  // Effect to handle gender-based roles and Administrative suffix logic
  useEffect(() => {
    const isFemale = data.sex === 'Feminino';
    let newRole = data.role;
    let newRegistrationNumber = data.registrationNumber;

    // 1. Handle Gender Logic for Ecclesiastical Roles
    if (isFemale) {
      if (newRole === "Diácono") newRole = "Diaconisa";
      if (newRole === "Cooperador") newRole = "Cooperadora";
      if (newRole === "Missionário") newRole = "Missionária";
      if (newRole.includes("Tesoureiro")) newRole = newRole.replace("Tesoureiro", "Tesoureira");
      if (newRole.includes("Secretário")) newRole = newRole.replace("Secretário", "Secretária");
    } else {
      if (newRole === "Diaconisa") newRole = "Diácono";
      if (newRole === "Cooperadora") newRole = "Cooperador";
      if (newRole === "Missionária") newRole = "Missionário";
      if (newRole.includes("Tesoureira")) newRole = newRole.replace("Tesoureira", "Tesoureiro");
      if (newRole.includes("Secretária")) newRole = newRole.replace("Secretária", "Secretário");
    }

    // 2. Handle Registration Number Suffix for Administrative Roles
    // Get the base number (e.g., '001' from '001-PRE' or '001')
    const baseNumber = data.registrationNumber.split('-')[0].trim();
    let suffix = '';

    // Check if current role is Administrative to determine suffix
    // We check against the base logic names (masculine/default) or current value
    const isPresidente = newRole.includes("Presidente") && !newRole.includes("Vice");
    const isVice = newRole.includes("Vice-Presidente");
    const isTesoureiro = newRole.includes("Tesoureir");
    const isSecretario = newRole.includes("Secretári");

    if (isPresidente) suffix = "PRE";
    else if (isVice) suffix = "VIC";
    else if (isTesoureiro) suffix = "TES";
    else if (isSecretario) suffix = "SEC";

    if (suffix) {
        newRegistrationNumber = `${baseNumber}-${suffix}`;
    } else {
        // If not administrative, revert to base number
        newRegistrationNumber = baseNumber;
    }

    // Apply changes if needed
    if (newRole !== data.role || newRegistrationNumber !== data.registrationNumber) {
        onChange({ 
            ...data, 
            role: newRole,
            registrationNumber: newRegistrationNumber
        });
    }

  }, [data.sex, data.role]); // Dependencies: run when sex or role selection changes

  const handleChange = (field: keyof Member, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('photo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-800 font-medium placeholder-gray-400";
  const selectClass = "w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-800 font-medium appearance-none cursor-pointer";
  
  // Input class without icon padding
  const simpleInputClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-800 font-medium placeholder-gray-400";
  const simpleSelectClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-800 font-medium appearance-none cursor-pointer";

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      
      {/* Form Header */}
      <div className="bg-green-700 px-6 py-6 text-white flex justify-between items-center">
        <div>
           <h2 className="text-xl font-bold flex items-center gap-2">
             <User className="w-6 h-6" />
             {data.id ? 'Editar Membro' : 'Novo Cadastro'}
           </h2>
           <p className="text-green-100 text-sm mt-1 opacity-90">Preencha os dados completos para gerar a carteira.</p>
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-lg text-center backdrop-blur-sm">
           <span className="block text-[10px] uppercase font-bold text-green-200">Matrícula</span>
           <span className="block text-xl font-black">{data.registrationNumber || "---"}</span>
        </div>
      </div>
      
      <div className="p-6 md:p-8 space-y-8">
        
        {/* Photo Upload Section - Centered */}
        <div className="flex flex-col items-center justify-center">
          <div 
            className="w-40 h-52 bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:bg-green-50 hover:border-green-400 transition-all relative group shadow-inner"
            onClick={() => fileInputRef.current?.click()}
          >
            {data.photo ? (
              <img src={data.photo} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Camera className="w-6 h-6" />
                </div>
                <span className="text-xs text-gray-500 font-medium">Clique para<br/>adicionar foto</span>
              </div>
            )}
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 text-sm font-bold text-green-700 bg-green-50 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Alterar Foto
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            
            <div className="md:col-span-2">
              <h3 className="text-sm font-black text-gray-900 border-b-2 border-green-100 pb-2 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                DADOS PESSOAIS
              </h3>
            </div>

            <div className="md:col-span-2">
               <InputGroup label="Nome Completo" icon={User}>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={data.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    className={inputClass}
                    placeholder="Nome completo do membro"
                  />
               </InputGroup>
            </div>

            <InputGroup label="CPF" icon={CreditCard}>
               <input
                type="text"
                value={data.cpf}
                onChange={(e) => handleChange('cpf', e.target.value)}
                className={inputClass}
                placeholder="000.000.000-00"
              />
            </InputGroup>

            <InputGroup label="RG" icon={CreditCard}>
               <input
                type="text"
                value={data.rg}
                onChange={(e) => handleChange('rg', e.target.value)}
                className={inputClass}
                placeholder="000000 SSP/MT"
              />
            </InputGroup>

            <InputGroup label="Data de Nascimento" icon={Calendar}>
              <input
                type="date"
                value={data.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                className={inputClass}
              />
            </InputGroup>

            <InputGroup label="Sexo" icon={User}>
               <select 
                value={data.sex}
                onChange={(e) => handleChange('sex', e.target.value)}
                className={selectClass}
              >
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </InputGroup>

            <InputGroup label="Naturalidade" icon={MapPin}>
               <input
                type="text"
                value={data.naturalness}
                onChange={(e) => handleChange('naturalness', e.target.value)}
                className={inputClass}
                placeholder="Cidade - UF"
              />
            </InputGroup>

            <div className="md:col-span-2">
               <InputGroup label="Filiação (Pai)" icon={Users}>
                  <input
                    type="text"
                    value={data.fatherName}
                    onChange={(e) => handleChange('fatherName', e.target.value)}
                    className={inputClass}
                    placeholder="Nome do Pai"
                  />
               </InputGroup>
            </div>

            <div className="md:col-span-2">
               <InputGroup label="Filiação (Mãe)" icon={Users}>
                  <input
                    type="text"
                    value={data.motherName}
                    onChange={(e) => handleChange('motherName', e.target.value)}
                    className={inputClass}
                    placeholder="Nome da Mãe"
                  />
               </InputGroup>
            </div>

            <div className="md:col-span-2 mt-4">
              <h3 className="text-sm font-black text-gray-900 border-b-2 border-green-100 pb-2 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                CONTATO & ENDEREÇO
              </h3>
            </div>

             <InputGroup label="Celular / WhatsApp" icon={Phone}>
                <input
                  type="tel"
                  value={data.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={inputClass}
                  placeholder="(00) 00000-0000"
                />
             </InputGroup>

             <InputGroup label="Email" icon={Mail}>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={inputClass}
                  placeholder="exemplo@email.com"
                />
             </InputGroup>

             {/* SPLIT ADDRESS FIELDS */}
             <div className="md:col-span-2 grid grid-cols-12 gap-3">
                <div className="col-span-12 md:col-span-3">
                   <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">CEP</label>
                      <input
                        type="text"
                        value={data.addressCep}
                        onChange={(e) => handleChange('addressCep', e.target.value)}
                        className={simpleInputClass}
                        placeholder="00000-000"
                      />
                   </div>
                </div>

                <div className="col-span-8 md:col-span-7">
                   <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Rua / Avenida</label>
                      <input
                        type="text"
                        value={data.addressStreet}
                        onChange={(e) => handleChange('addressStreet', e.target.value)}
                        className={simpleInputClass}
                        placeholder="Nome da Rua"
                      />
                   </div>
                </div>

                <div className="col-span-4 md:col-span-2">
                   <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Número</label>
                      <input
                        type="text"
                        value={data.addressNumber}
                        onChange={(e) => handleChange('addressNumber', e.target.value)}
                        className={simpleInputClass}
                        placeholder="Nº"
                      />
                   </div>
                </div>

                <div className="col-span-12 md:col-span-5">
                   <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Bairro</label>
                      <input
                        type="text"
                        value={data.addressNeighborhood}
                        onChange={(e) => handleChange('addressNeighborhood', e.target.value)}
                        className={simpleInputClass}
                        placeholder="Bairro"
                      />
                   </div>
                </div>

                <div className="col-span-9 md:col-span-5">
                   <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Cidade</label>
                      <input
                        type="text"
                        value={data.addressCity}
                        onChange={(e) => handleChange('addressCity', e.target.value)}
                        className={simpleInputClass}
                        placeholder="Cidade"
                      />
                   </div>
                </div>

                <div className="col-span-3 md:col-span-2">
                   <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">UF</label>
                      <select
                        value={data.addressState}
                        onChange={(e) => handleChange('addressState', e.target.value)}
                        className={simpleSelectClass}
                      >
                        {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                      </select>
                   </div>
                </div>

                <div className="col-span-12">
                   <InputGroup label="Complemento / Ponto de Referência" icon={Navigation}>
                      <input
                        type="text"
                        value={data.addressComplement}
                        onChange={(e) => handleChange('addressComplement', e.target.value)}
                        className={inputClass}
                        placeholder="Ex: Próximo ao mercado, Apto 101"
                      />
                   </InputGroup>
                </div>
             </div>

             <div className="md:col-span-2 mt-4">
              <h3 className="text-sm font-black text-gray-900 border-b-2 border-green-100 pb-2 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                DADOS ECLESIÁSTICOS
              </h3>
            </div>

            <InputGroup label="Congregação" icon={Home}>
               <select 
                value={data.congregation}
                onChange={(e) => handleChange('congregation', e.target.value)}
                className={selectClass}
              >
                {CONGREGATIONS_LIST.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </InputGroup>

            <InputGroup label="Cargo" icon={User}>
               <select 
                value={data.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className={selectClass}
              >
                <optgroup label="Cargos Eclesiásticos">
                  {ROLES_ECLESIASTICOS.map(role => {
                    let displayRole = role;
                    if (data.sex === 'Feminino') {
                       if (role === "Diácono") displayRole = "Diaconisa";
                       if (role === "Cooperador") displayRole = "Cooperadora";
                       if (role === "Missionário") displayRole = "Missionária";
                    }
                    return <option key={role} value={displayRole}>{displayRole}</option>
                  })}
                </optgroup>
                <optgroup label="Cargos Administrativos">
                  {ROLES_ADMINISTRATIVOS.map(role => {
                    let displayRole = role;
                    if (data.sex === 'Feminino') {
                       if (role.includes("Tesoureiro")) displayRole = role.replace("Tesoureiro", "Tesoureira");
                       if (role.includes("Secretário")) displayRole = role.replace("Secretário", "Secretária");
                    }
                    return <option key={role} value={displayRole}>{displayRole}</option>
                  })}
                </optgroup>
              </select>
            </InputGroup>

            <InputGroup label="Situação" icon={Activity}>
               <select 
                value={data.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className={selectClass}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </InputGroup>

            <InputGroup label="Data Batismo (Águas)" icon={Droplets}>
               <input
                type="date"
                value={data.baptismDate}
                onChange={(e) => handleChange('baptismDate', e.target.value)}
                className={inputClass}
              />
            </InputGroup>
        </div>

        <hr className="border-gray-100" />

        <button
          onClick={onSubmit}
          className="w-full bg-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-green-200 hover:bg-green-800 hover:shadow-xl transition-all flex items-center justify-center gap-3 text-lg transform active:scale-95"
        >
          <Save className="w-6 h-6" />
          SALVAR DADOS
        </button>
      </div>
    </div>
  );
};