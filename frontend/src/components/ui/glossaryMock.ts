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

export const glossaryMap: Record<
  string,
  { icon: React.ElementType; description: string }
> = {
  Agriculture: {
    icon: Sprout,
    description:
      'Terms covering farming, livestock, and agricultural production processes.',
  },
  'Business Enterprises': {
    icon: Building2,
    description:
      'Concepts related to business management, entrepreneurship, and company operations.',
  },
  Construction: {
    icon: Hammer,
    description:
      'Terminology for construction methods, materials, and project management.',
  },
  Demography: {
    icon: Users,
    description:
      'Key terms describing population characteristics and social statistics.',
  },
  Education: {
    icon: GraduationCap,
    description: 'Terms relating to learning, training, and academic systems.',
  },
  Energy: {
    icon: Zap,
    description:
      'Concepts and terminology related to power generation and energy systems.',
  },
  Environment: {
    icon: Leaf,
    description:
      'Terms describing environmental conservation, ecology, and sustainability.',
  },
  'General Demography': {
    icon: BarChart3,
    description:
      'Broader demographic statistics including age, gender, and migration.',
  },
  Geography: {
    icon: Globe,
    description: 'Geospatial, regional, and mapping-related terminology.',
  },
  'Health and Vital Statistics': {
    icon: HeartPulse,
    description:
      'Definitions and data terms for health, wellbeing, and vital statistics.',
  },
  'Household Income and Expenditure': {
    icon: Home,
    description:
      'Concepts covering household budgets, expenses, and living standards.',
  },
  'Housing and Services': {
    icon: Building2,
    description:
      'Terminology around housing infrastructure and essential urban services.',
  },
  'Income, Pensions, Spending and Wealth': {
    icon: Coins,
    description:
      'Economic terms about income distribution, pensions, and household wealth.',
  },
  'Industry and Trade': {
    icon: Factory,
    description:
      'Terms related to manufacturing, exports, and industrial production.',
  },
  Labour: {
    icon: BriefcaseBusiness,
    description:
      'Employment-related terminology including workforce, wages, and labour markets.',
  },
  'Law or Justice': {
    icon: Scale,
    description:
      'Terms describing legal systems, rights, and justice administration.',
  },
  Manufacturing: {
    icon: Factory,
    description:
      'Concepts about industrial manufacturing, production processes, and supply chains.',
  },
  'National Accounts': {
    icon: FileBarChart,
    description:
      'Core economic indicators including GDP, national income, and financial statistics.',
  },
  'National, Provincial and Local Government': {
    icon: Landmark,
    description:
      'Terms covering governance structures, administration, and public institutions.',
  },
  'Population Census': {
    icon: Users2,
    description:
      'Census-related terminology for population data collection and demographic analysis.',
  },
  Poverty: {
    icon: HandCoins,
    description:
      'Concepts and indicators measuring poverty, inequality, and social development.',
  },
  Prices: {
    icon: Coins,
    description:
      'Economic terms related to inflation, consumer prices, and purchasing power.',
  },
  'Private Sector': {
    icon: Building2,
    description:
      'Terminology around private enterprise, investment, and corporate activity.',
  },
  'Public Finance': {
    icon: Coins,
    description:
      'Terms covering government budgets, taxation, and fiscal management.',
  },
  'Science and Technology': {
    icon: Microscope,
    description:
      'Scientific and technological concepts including research and innovation.',
  },
  'Social conditions or Personal services': {
    icon: Users,
    description:
      'Terms describing community welfare, social services, and living conditions.',
  },
  'Statistical Processes or Methodology or Metadata': {
    icon: Layers,
    description:
      'Technical terms covering statistical standards, metadata, and data methodologies.',
  },
  'System of Business Registers': {
    icon: ClipboardList,
    description:
      'Concepts related to maintaining and updating national business register systems.',
  },
  Tourism: {
    icon: Plane,
    description:
      'Terms related to travel, leisure industries, and visitor statistics.',
  },
  'Tourism and Migration': {
    icon: Globe,
    description:
      'Terminology describing tourism flows, migration trends, and mobility statistics.',
  },
  Trade: {
    icon: ShoppingCart,
    description:
      'Concepts covering imports, exports, and international commerce.',
  },
  'Transport and Communication': {
    icon: Truck,
    description:
      'Terms describing logistics, infrastructure, and communication networks.',
  },
};
