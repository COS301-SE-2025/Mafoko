export interface TermDetail {
  id: string;
  term: string;
  translation: string;
  definition: string;
  partOfSpeech: string;
  source: string;
  example: string;
  relatedTerms: {
    id: string;
    term: string;
  }[];
}

export interface Comment {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  timeAgo: string;
  votes: number;
  upvotes: number;
  downvotes: number;
  userVote: 'upvote' | 'downvote' | null;
  isReply: boolean;
  replies: Comment[];
  isDeleted: boolean;
}
