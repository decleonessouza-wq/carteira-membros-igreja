import React, { useState } from "react";
import { Member } from "../types";
import { CHURCH_DATA, ChurchLogo, APP_LOGO_SRC } from "../constants";

interface CardProps {
  member: Member;
  id?: string;
}

export const Card: React.FC<CardProps> = ({ member, id }) => {
  const years = [2026, 2027, 2028, 2029, 2030, 2031];

  // ✅ garante o id esperado pelo html2canvas no App.tsx
  const printId = id || "member-card-print";

  // Logo (carteira) - fallback seguro
  const [cardLogoOk, setCardLogoOk] = useState(true);

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    if (dateString.includes("/")) return dateString;
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const Field = ({
    label,
    value,
    className = "",
    center = false,
  }: {
    label: string;
    value: string;
    className?: string;
    center?: boolean;
  }) => (
    <div
      className={`flex flex-col bg-white/85 border border-green-700 rounded-sm overflow-hidden box-border shadow-lg ${className}`}
    >
      {/* label (ligeiramente mais alto e com baseline mais “pra cima”) */}
      <div className="h-[0.26cm] px-1 flex items-start pt-[1px]">
        <span className="text-[6px] font-bold text-green-800 uppercase leading-none -mt-[1px]">
          {label}
        </span>
      </div>

      {/* valor (subindo 1~2px pra não “descer” no export) */}
      <div className="flex-1 px-1 pb-[1px] pt-0 flex items-start">
        <div
          className={`w-full text-[10px] font-bold text-gray-900 uppercase font-card leading-[1.02] ${
            center ? "text-center" : "text-left"
          }`}
          style={{
            textRendering: "geometricPrecision",
          }}
        >
          {value || "-"}
        </div>
      </div>
    </div>
  );

  const Header = () => (
    <div className="flex-1 text-center flex flex-col justify-center h-full relative z-20 pl-1">
      <h1 className="text-green-800 font-card-header font-black text-[11px] leading-[0.95] tracking-tight uppercase">
        {CHURCH_DATA.name}
      </h1>
      <p className="text-[7px] font-bold text-gray-600 mt-[1px] leading-none">
        CNPJ: {CHURCH_DATA.cnpj}
      </p>
      <div className="flex flex-col items-center justify-center mt-[2px] space-y-[1px]">
        <p className="text-[5px] text-green-900 font-bold uppercase leading-none">
          Pres. Honra: {CHURCH_DATA.honorPresident}
        </p>
        <p className="text-[5px] text-green-900 font-bold uppercase leading-none">
          Pres. Nacional: {CHURCH_DATA.nationalPresident}
        </p>
      </div>
    </div>
  );

  const Watermark = () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
      <img
        src="/marca_dagua.png"
        alt=""
        className="w-[92%] opacity-[0.08] select-none"
        style={{
          filter: "grayscale(100%) contrast(85%) brightness(105%)",
          transform: "scale(1.08)",
        }}
        draggable={false}
      />
    </div>
  );

  // ✅ Side wrapper: garante que cada lado é exatamente 10cm x 6.5cm
  const SideWrap = ({ children }: { children: React.ReactNode }) => (
    <div
      className="relative bg-white border-2 border-green-800 rounded-md overflow-hidden flex flex-col shadow-lg box-border"
      style={{ width: "10cm", height: "6.5cm", minWidth: "10cm", minHeight: "6.5cm" }}
    >
      {children}
    </div>
  );

  return (
    // ✅ modelo original: horizontal (frente e verso lado a lado)
    <div className="w-full flex items-center justify-center">
      <div className="w-full overflow-x-auto">
        <div
          id={printId}
          className="mx-auto flex flex-row items-start justify-center gap-3 bg-transparent p-0"
          style={{
            width: "20.3cm", // 10cm + 10cm + gap (~0.3cm)
            minWidth: "20.3cm",
            height: "6.5cm",
            minHeight: "6.5cm",
          }}
        >
          {/* ================= FRONT (10cm x 6.5cm) ================= */}
          <SideWrap>
            <Watermark />

            <div className="flex items-center p-1 h-[2.0cm] border-b-2 border-green-700 bg-white/90 relative z-10 box-border shadow-lg">
              <div className="w-[1.6cm] h-[1.6cm] flex-shrink-0 ml-1 shadow-lg rounded-sm overflow-hidden bg-white flex items-center justify-center">
                {cardLogoOk ? (
                  <img
                    src={APP_LOGO_SRC || "/logo_app.png"}
                    alt="Logo"
                    className="w-full h-full object-contain p-[2px]"
                    onError={() => setCardLogoOk(false)}
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-green-700">
                    <ChurchLogo />
                  </div>
                )}
              </div>

              <Header />
            </div>

            <div className="flex-1 p-[4px] flex gap-[4px] relative z-10">
              <div className="flex flex-col gap-1 w-[2.6cm]">
                <div className="w-[2.6cm] h-[3.4cm] border-2 border-green-700 rounded-sm bg-white/90 flex items-center justify-center overflow-hidden relative box-border shadow-lg">
                  {member.photo ? (
                    <img src={member.photo} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[8px] text-gray-400 font-bold text-center leading-tight">
                      FOTO<br />3x4
                    </span>
                  )}
                </div>

                {/* ✅ MATRÍCULA: sobe um pouco (label e número) */}
                <div className="bg-green-700 text-white text-center rounded-sm h-[0.5cm] flex flex-col justify-center box-border shadow-lg">
                  <span className="text-[5px] uppercase font-bold leading-none text-green-100 -mt-[10px]">
                    Matrícula
                  </span>
                  <span className="text-[12px] font-black leading-none -mt-[1px]">
                    {member.registrationNumber || "---"}
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between gap-[3px]">
                <Field label="Nome" value={member.fullName} className="h-[0.9cm]" />
                <Field label="Cargo" value={member.role} className="h-[0.9cm]" />
                <Field label="Congregação" value={member.congregation} className="h-[0.9cm]" />

                <div className="flex gap-[3px]">
                  <Field
                    label="Batismo"
                    value={formatDate(member.baptismDate)}
                    className="h-[0.9cm] flex-1"
                    center
                  />
                  <Field
                    label="Emissão"
                    value={formatDate(member.registrationDate)}
                    className="h-[0.9cm] flex-1"
                    center
                  />
                </div>
              </div>
            </div>

            {/* ✅ ENDEREÇO: sobe 1px (texto do rodapé) */}
            <div className="h-[0.4cm] bg-green-700 flex items-center justify-center z-10 relative box-border shadow-lg">
              <span className="text-white text-[7px] font-bold uppercase tracking-wider leading-none -mt-[10px]">
                {CHURCH_DATA.address.split(" - ")[0]} - São Sebastião II - Rondonópolis/MT
              </span>
            </div>
          </SideWrap>

          {/* ================= BACK (10cm x 6.5cm) ================= */}
          <SideWrap>
            <Watermark />

            {/* ✅ TEXTO SUPERIOR: sobe um pouco (top bar) */}
            <div className="h-[0.8cm] bg-white/90 border-b border-green-700 flex items-start px-2 pt-[1px] relative z-10 box-border shadow-lg">
              <p className="text-[6.5px] text-center font-bold leading-[1.12] text-gray-800 w-full -mt-[1px]">
                Este documento é válido somente com o carimbo da Igreja e visto do Pastor, enquanto o portador se
                mantiver fiel aos princípios da Palavra de Deus e Estatuto da igreja.
              </p>
            </div>

            <div className="flex-1 p-[4px] flex flex-col justify-start gap-[3px] relative z-10 box-border">
              <Field label="Pai" value={member.fatherName} className="h-[0.85cm]" />
              <Field label="Mãe" value={member.motherName} className="h-[0.85cm]" />

              <div className="flex gap-[3px]">
                <Field label="RG" value={member.rg} className="h-[0.85cm] w-1/2" />
                <Field label="CPF" value={member.cpf} className="h-[0.85cm] w-1/2" />
              </div>

              <div className="flex gap-[3px]">
                <Field label="Naturalidade" value={member.naturalness} className="h-[0.85cm] flex-1" />
                <Field
                  label="Nascimento"
                  value={formatDate(member.birthDate)}
                  className="h-[0.85cm] w-[2.8cm]"
                  center
                />
              </div>
            </div>

            {/* ✅ ANOS: sobe um pouco o texto e a faixa */}
            <div className="h-[1.5cm] flex flex-row relative z-10 border-t-2 border-green-800 w-full box-border shadow-lg">
              {years.map((year, i) => (
                <div
                  key={year}
                  className={`flex-1 flex flex-col h-full ${i < years.length - 1 ? "border-r border-green-800" : ""}`}
                >
                  <div className="h-[0.38cm] w-full flex items-center justify-center bg-green-800 border-b border-green-800 box-border">
                    <span className="text-white text-[8px] font-bold leading-none -mt-[10px]">
                      {year}
                    </span>
                  </div>
                  <div className="flex-1 bg-white/90 w-full" />
                </div>
              ))}
            </div>
          </SideWrap>
        </div>
      </div>
    </div>
  );
};
