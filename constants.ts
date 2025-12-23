import React from 'react';
import { ChurchInfo, Member, CongregationData } from './types';

export const CHURCH_DATA: ChurchInfo = {
  name: "IGREJA EVANGÉLICA PENTECOSTAL - JARDIM DE ORAÇÃO INDEPENDENTE - SÉDE",
  honorPresident: "Pr. José Hilário do Nascimento",
  nationalPresident: "Pr. Odair Barbosa Fernandes",
  vicePresident: "Pr. Nelson Ramos de Oliveira",
  address: "Rua da Felicidade, 226 - Bairro São Sebastião II - CEP: 78.730-280 - Rondonópolis/MT",
  cnpj: "06.098.136/0001-62"
};

export const CONGREGATIONS_LIST = ["SEDE", "PEDRA 90", "PEDRA PRETA"];

export const CONGREGATION_DETAILS: Record<string, CongregationData> = {
  "SEDE": {
    name: "IGREJA EVANGÉLICA PENTECOSTAL JARDIM DE ORAÇÃO INDEPENDENTE SÉDE",
    address: "Rua da Felicidade, 226 - Bairro São Sebastião II - CEP: 78.730-280 - Rondonópolis/MT",
    pastor: "Pr. Odair Barbosa Fernandes"
  },
  "PEDRA 90": {
    name: "IGREJA EV. PENTECOSTAL JARDIM DE ORAÇÃO INDEPENDENTE PEDRA 90",
    address: "Rua A6, 3076 - Bairro: Pedra 90 - Rondonópolis/MT",
    pastor: "Pb. Ednaldo Silva Souza"
  },
  "PEDRA PRETA": {
    name: "IGREJA EV. PENTECOSTAL JARDIM DE ORAÇÃO INDEPENDENTE PEDRA PRETA",
    address: "Rua Arcanjo Felipe Meira, S/N° - Bairro: Jardim Morumbi - Pedra Preta/MT",
    pastor: "Pb. Neterson Oliveira de Souza"
  }
};

export const INITIAL_MEMBER_STATE: Member = {
  id: "",
  registrationNumber: "",
  fullName: "",
  cpf: "",
  rg: "",
  sex: "Masculino",
  fatherName: "",
  motherName: "",
  naturalness: "Rondonópolis - MT",
  birthDate: "",
  registrationDate: new Date().toLocaleDateString('pt-BR'),
  role: "Membro",
  congregation: "SEDE",
  baptismDate: "",
  photo: null,
  phone: "",
  email: "",
  addressStreet: "",
  addressNumber: "",
  addressNeighborhood: "",
  addressCity: "Rondonópolis",
  addressState: "MT",
  addressCep: "",
  addressComplement: "",
  status: "ATIVO"
};

/**
 * ✅ Assets do /public
 * (Vite serve /public direto pela raiz "/")
 */
export const APP_LOGO_SRC = "/logo_app.png";
export const CARD_WATERMARK_SRC = "/marca_dagua.png";

/**
 * ✅ Mantido: SVG antigo (fallback/uso opcional)
 */
export const ChurchLogo = () =>
  React.createElement(
    "svg",
    { viewBox: "0 0 100 100", className: "w-full h-full text-green-700 fill-current" },
    React.createElement("circle", { cx: "50", cy: "50", r: "45", stroke: "currentColor", strokeWidth: "2", fill: "none" }),
    React.createElement("path", { d: "M50 20 L50 80 M20 50 L80 50", stroke: "currentColor", strokeWidth: "1", opacity: "0.2" }),
    React.createElement("path", { d: "M50 15 L60 40 L85 40 L65 55 L75 80 L50 65 L25 80 L35 55 L15 40 L40 40 Z", fill: "none", stroke: "currentColor", strokeWidth: "2" }),
    React.createElement("text", { x: "50", y: "92", fontSize: "8", textAnchor: "middle", fontWeight: "bold" }, "JARDIM DE ORAÇÃO")
  );
