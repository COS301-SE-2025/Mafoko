import { Term } from '../terms/types.ts';

export type VoteApiResponse = {
  term_id: string;
  upvotes: number;
  downvotes: number;
  user_vote: 'up' | 'down' | null;
};

export type TermCardProps = {
  id: string;
  term: string;
  language: string;
  domain: string;
  upvotes: number;
  downvotes: number;
  definition: string;
  onView?: () => void;
};

export const LanguageColorMap: Record<string, string> = {
  Afrikaans: 'blue',
  English: 'yellow',
  isiNdebele: 'pink',
  isiXhosa: 'green',
  isiZulu: 'green',
  Sesotho: 'yellow',
  Setswana: 'orange',
  siSwati: 'teal',
  Tshivenda: 'indigo',
  Xitsonga: 'lime',
  Sepedi: 'cyan',
};

export const LanguageClassMap: Record<string, string> = {
  Afrikaans: 'bg-teal-500',
  English: 'bg-yellow-500',
  isiNdebele: 'bg-pink-500',
  isiXhosa: 'bg-green-500',
  isiZulu: 'bg-green-500',
  Sesotho: 'bg-yellow-500',
  Setswana: 'bg-orange-500',
  siSwati: 'bg-teal-500',
  Tshivenda: 'bg-indigo-500',
  Xitsonga: 'bg-lime-500',
  Sepedi: 'bg-cyan-500',
};

export type SearchResponseType = {
  items: Term[];
  results: Term[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type SearchResponse = {
  items: Term[];
  total: number;
};

export type Suggestion = {
  id: string;
  label: string;
};

export const LANGUAGES = [
  'Afrikaans',
  'English',
  'isiNdebele',
  'isiXhosa',
  'isiZulu',
  'Sesotho',
  'Setswana',
  'siSwati',
  'Tshivenda',
  'Xitsonga',
  'Sepedi',
];
