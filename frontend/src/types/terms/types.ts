export type TermPageProps = {
  id: string;
  term: string;
  language: string;
  domain: string;
  definition: string;
  upvotes: number;
  downvotes: number;
};

export type Term = {
  id: string;
  term: string;
  language: string;
  domain: string;
  definition: string;
  upvotes: number;
  downvotes: number;
  status: string;
  user_vote: 'upvote' | 'downvote' | null;
};
