import React, { useRef, useEffect, useMemo } from "react";
import { Member } from "../types";
import {
  Camera,
  Upload,
  User,
  Calendar,
  MapPin,
  Users,
  Save,
  Phone,
  Mail,
  Home,
  Activity,
  Droplets,
  CreditCard,
  Navigation,
} from "lucide-react";
import { CONGREGATIONS_LIST } from "../constants";

interface FormProps {
  data: Member;
  onChange: (data: Member) => void;
  onSubmit: () => void;
}

const ROLES_ECLESIASTICOS = [
  "Membro",
  "Músico",
  "Cooperador",
  "Diácono",
  "Presbítero",
  "Evangelista",
  "Pastor",
  "Missionário",
];

const ROLES_ADMINISTRATIVOS = [
  "Presidente de Honra",
  "Presidente",
  "Vice-Presidente",
  "1° Tesoureiro",
  "2° Tesoureiro",
  "1° Secretário",
  "2° Secretário",
];

const STATUS_OPTIONS = ["ATIVO", "SUSPENSO", "DESLIGADO", "INATIVO", "FALECIDO"];

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const InputGroup = ({
  label,
  icon: Icon,
  children,
  className = "mb-4",
}: any) => (
  <div className={className}>
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
      {label}
    </label>
    <div className="relative group">
      {Icon && (
        <Icon className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
      )}
      {children}
    </div>
  </div>
);

function getBaseRegNumber(reg: string) {
  const v = String(reg || "").trim();
  return v ? v.split("-")[0].trim() : "";
}

function applyFemaleRole(role: string) {
  let r = role;
  if (r === "Diácono") r = "Diaconisa";
  if (r === "Cooperador") r = "Cooperadora";
  if (r === "Missionário") r = "Missionária";
  if (r.includes("Tesoureiro")) r = r.replace("Tesoureiro", "Tesoureira");
  if (r.includes("Secretário")) r = r.replace("Secretário", "Secretária");
  return r;
}

function applyMaleRole(role: string) {
  let r = role;
  if (r === "Diaconisa") r = "Diácono";
  if (r === "Cooperadora") r = "Cooperador";
  if (r === "Missionária") r = "Missionário";
  if (r.includes("Tesoureira")) r = r.replace("Tesoureira", "Tesoureiro");
  if (r.includes("Secretária")) r = r.replace("Secretária", "Secretário");
  return r;
}

function getAdminSuffix(role: string) {
  if (role.includes("Presidente") && !role.includes("Vice")) return "PRE";
  if (role.includes("Vice-Presidente")) return "VIC";
  if (role.includes("Tesoureir")) return "TES";
  if (role.includes("Secretári")) return "SEC";
  return "";
}

export const Form: React.FC<FormProps> = ({ data, onChange, onSubmit }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ((!data.id || data.fullName === "") && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  const computed = useMemo(() => {
    const isFemale = data.sex === "Feminino";
    const normalizedRole = isFemale ? applyFemaleRole(data.role) : applyMaleRole(data.role);
    const base = getBaseRegNumber(data.registrationNumber);
    const suffix = getAdminSuffix(normalizedRole);
    return {
      normalizedRole,
      normalizedReg: suffix ? `${base}-${suffix}` : base,
    };
  }, [data.sex, data.role, data.registrationNumber]);

  useEffect(() => {
    if (
      computed.normalizedRole !== data.role ||
      computed.normalizedReg !== data.registrationNumber
    ) {
      onChange({
        ...data,
        role: computed.normalizedRole,
        registrationNumber: computed.normalizedReg,
      });
    }
  }, [computed, data, onChange]);

  const handleChange = (field: keyof Member, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => handleChange("photo", reader.result as string);
    reader.readAsDataURL(file);
  };

  const inputClass =
    "w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-800 font-medium";

  const selectClass =
    "w-full pl-10 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-800 font-medium appearance-none";

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-green-700 px-4 py-5 sm:px-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between text-white">
        <div>
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <User className="w-6 h-6" />
            {data.id ? "Editar Membro" : "Novo Cadastro"}
          </h2>
          <p className="text-green-100 text-sm mt-1">
            Preencha os dados para gerar a carteira.
          </p>
        </div>

        <div className="bg-white/10 px-4 py-2 rounded-lg text-center self-start sm:self-auto">
          <span className="block text-[10px] uppercase font-bold text-green-200">
            Matrícula
          </span>
          <span className="block text-xl font-black">
            {data.registrationNumber || "---"}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-8">
        {/* Foto */}
        <div className="flex flex-col items-center">
          <div
            className="w-36 h-48 sm:w-40 sm:h-52 bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center overflow-hidden cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {data.photo ? (
              <img src={data.photo} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-10 h-10 text-gray-400" />
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handlePhotoUpload}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 text-sm font-bold text-green-700 bg-green-50 px-4 py-2 rounded-lg"
          >
            <Upload className="inline w-4 h-4 mr-1" />
            Alterar Foto
          </button>
        </div>

        {/* Conteúdo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputGroup label="Nome Completo" icon={User} className="md:col-span-2">
            <input
              ref={nameInputRef}
              value={data.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              className={inputClass}
            />
          </InputGroup>

          <InputGroup label="CPF" icon={CreditCard}>
            <input value={data.cpf} onChange={(e) => handleChange("cpf", e.target.value)} className={inputClass} />
          </InputGroup>

          <InputGroup label="RG" icon={CreditCard}>
            <input value={data.rg} onChange={(e) => handleChange("rg", e.target.value)} className={inputClass} />
          </InputGroup>

          <InputGroup label="Data Nascimento" icon={Calendar}>
            <input type="date" value={data.birthDate} onChange={(e) => handleChange("birthDate", e.target.value)} className={inputClass} />
          </InputGroup>

          <InputGroup label="Sexo" icon={User}>
            <select value={data.sex} onChange={(e) => handleChange("sex", e.target.value)} className={selectClass}>
              <option>Masculino</option>
              <option>Feminino</option>
            </select>
          </InputGroup>
        </div>

        <button
          onClick={onSubmit}
          className="w-full bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg text-lg"
        >
          <Save className="inline w-6 h-6 mr-2" />
          SALVAR DADOS
        </button>
      </div>
    </div>
  );
};
