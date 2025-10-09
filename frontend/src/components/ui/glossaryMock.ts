import {
  Sprout,
  Building2,
  Hammer,
  Users,
  GraduationCap,
  Zap,
  Leaf,
  BarChart3,
  Globe,
  HeartPulse,
  Home,
  Coins,
  Factory,
  Scale,
  BriefcaseBusiness,
  Landmark,
  FileBarChart,
  HandCoins,
  Microscope,
  Users2,
  Layers,
  ClipboardList,
  Plane,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function useGlossaryMap() {
  const { t } = useTranslation();

  return {
    Agriculture: {
      icon: Sprout,
      description: t('glossaryPage2.agriculture'),
    },
    'Business Enterprises': {
      icon: Building2,
      description: t('glossaryPage2.businessEnterprises'),
    },
    Construction: {
      icon: Hammer,
      description: t('glossaryPage2.construction'),
    },
    Demography: {
      icon: Users,
      description: t('glossaryPage2.demography'),
    },
    Education: {
      icon: GraduationCap,
      description: t('glossaryPage2.education'),
    },
    Energy: {
      icon: Zap,
      description: t('glossaryPage2.energy'),
    },
    Environment: {
      icon: Leaf,
      description: t('glossaryPage2.environment'),
    },
    'General Demography': {
      icon: BarChart3,
      description: t('glossaryPage2.generalDemography'),
    },
    Geography: {
      icon: Globe,
      description: t('glossaryPage2.geography'),
    },
    'Health and Vital Statistics': {
      icon: HeartPulse,
      description: t('glossaryPage2.healthVitalStats'),
    },
    'Household Income and Expenditure': {
      icon: Home,
      description: t('glossaryPage2.householdIncome'),
    },
    'Housing and Services': {
      icon: Building2,
      description: t('glossaryPage2.housingServices'),
    },
    'Income, Pensions, Spending and Wealth': {
      icon: Coins,
      description: t('glossaryPage2.incomeWealth'),
    },
    'Industry and Trade': {
      icon: Factory,
      description: t('glossaryPage2.industryTrade'),
    },
    Labour: {
      icon: BriefcaseBusiness,
      description: t('glossaryPage2.labour'),
    },
    'Law or Justice': {
      icon: Scale,
      description: t('glossaryPage2.lawJustice'),
    },
    Manufacturing: {
      icon: Factory,
      description: t('glossaryPage2.manufacturing'),
    },
    'National Accounts': {
      icon: FileBarChart,
      description: t('glossaryPage2.nationalAccounts'),
    },
    'National, Provincial and Local Government': {
      icon: Landmark,
      description: t('glossaryPage2.government'),
    },
    'Population Census': {
      icon: Users2,
      description: t('glossaryPage2.populationCensus'),
    },
    Poverty: {
      icon: HandCoins,
      description: t('glossaryPage2.poverty'),
    },
    Prices: {
      icon: Coins,
      description: t('glossaryPage2.prices'),
    },
    'Private Sector': {
      icon: Building2,
      description: t('glossaryPage2.privateSector'),
    },
    'Public Finance': {
      icon: Coins,
      description: t('glossaryPage2.publicFinance'),
    },
    'Science and Technology': {
      icon: Microscope,
      description: t('glossaryPage2.scienceTech'),
    },
    'Social conditions or Personal services': {
      icon: Users,
      description: t('glossaryPage2.socialConditions'),
    },
    'Statistical Processes or Methodology or Metadata': {
      icon: Layers,
      description: t('glossaryPage2.statisticalProcesses'),
    },
    'System of Business Registers': {
      icon: ClipboardList,
      description: t('glossaryPage2.businessRegisters'),
    },
    Tourism: {
      icon: Plane,
      description: t('glossaryPage2.tourism'),
    },
    'Tourism and Migration': {
      icon: Globe,
      description: t('glossaryPage2.tourismMigration'),
    },
    Trade: {
      icon: ShoppingCart,
      description: t('glossaryPage2.trade'),
    },
    'Transport and Communication': {
      icon: Truck,
      description: t('glossaryPage2.transportCommunication'),
    },
  };
}
