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
};
