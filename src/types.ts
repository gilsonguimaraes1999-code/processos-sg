/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Tutorial {
  id: string | number;
  category: string;
  subcategory: string;
  title: string;
  primaryQuestion: string;
  keywords: string[];
  objective: string;
  steps: string; // The user specified "Descrição / Passo a passo completo"
}

export interface City {
  name: string;
  icon: string;
  invite: string;
}

export interface ApiResponse {
  tutorials: Tutorial[];
  cities: City[];
}

export type Language = 'pt' | 'en' | 'es';

export interface Translations {
  searchPlaceholder: string;
  updateButton: string;
  categoriesLabel: string;
  allCategories: string;
  languageLabel: string;
  objectiveLabel: string;
  stepsLabel: string;
  noResults: string;
  backToTop: string;
  loading: string;
  enterSite: string;
  brandingMain: string;
  brandingSub: string;
  foundStats: string;
  footerTag: string;
  statusLabel: string;
  statusOnline: string;
  expandImage: string;
  openManual: string;
  close: string;
}

export const translations: Record<Language, Translations> = {
  pt: {
    searchPlaceholder: 'Pesquisar tutoriais...',
    updateButton: 'Atualizar',
    categoriesLabel: 'Categorias',
    allCategories: 'Todas as Categorias',
    languageLabel: 'Idioma',
    objectiveLabel: 'Objetivo',
    stepsLabel: 'Passo a Passo',
    noResults: 'Nenhum tutorial encontrado.',
    backToTop: 'Voltar ao Início',
    loading: 'Carregando dados...',
    enterSite: 'Clique para entrar',
    brandingMain: 'BASE DE CONHECIMENTO',
    brandingSub: 'PORTAL DE PROCESSOS',
    foundStats: 'tutoriais encontrados',
    footerTag: 'Portal de Gestão',
    statusLabel: 'Status',
    statusOnline: 'Online',
    expandImage: 'Clique para ampliar',
    openManual: 'Abrir Manual Completo →',
    close: 'Fechar',
  },
  en: {
    searchPlaceholder: 'Search tutorials...',
    updateButton: 'Update',
    categoriesLabel: 'Categories',
    allCategories: 'All Categories',
    languageLabel: 'Language',
    objectiveLabel: 'Objective',
    stepsLabel: 'Step by Step',
    noResults: 'No tutorials found.',
    backToTop: 'Back to Home',
    loading: 'Loading data...',
    enterSite: 'Click to enter',
    brandingMain: 'KNOWLEDGE BASE',
    brandingSub: 'PROCESSES PORTAL',
    foundStats: 'tutorials found',
    footerTag: 'Management Portal',
    statusLabel: 'Status',
    statusOnline: 'Online',
    expandImage: 'Click to expand',
    openManual: 'Open Full Manual →',
    close: 'Close',
  },
  es: {
    searchPlaceholder: 'Buscar tutoriales...',
    updateButton: 'Actualizar',
    categoriesLabel: 'Categorías',
    allCategories: 'Todas las categorías',
    languageLabel: 'Idioma',
    objectiveLabel: 'Objetivo',
    stepsLabel: 'Paso a paso',
    noResults: 'No se encontraron tutoriales.',
    backToTop: 'Volver al Inicio',
    loading: 'Cargando datos...',
    enterSite: 'Haz clic para entrar',
    brandingMain: 'BASE DE CONOCIMIENTOS',
    brandingSub: 'PORTAL DE PROCESOS',
    foundStats: 'tutoriales encontrados',
    footerTag: 'Portal de Gestión',
    statusLabel: 'Estado',
    statusOnline: 'En línea',
    expandImage: 'Haz clic para ampliar',
    openManual: 'Abrir Manual Completo →',
    close: 'Cerrar',
  },
};
