// frontend/src/types/term.ts

export interface TermTranslation {
  term: string;
  definition: string;
  language: string;
  original_term_id?: string;
}

export interface TermApplicationCreate {
  term: string;
  definition: string;
  domain: string;
  language: string;
  example?: string;
  translations?: string[]; // Corrected to expect a list of UUID strings
  original_term_id?: string; // For edits
}

export interface UserBase {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface TermApplicationRead {
  id: string;
  term_id: string;
  submitted_by_user_id: string;
  proposed_content: TermApplicationCreate;
  status: string;
  submitted_at: string;

  linguist_verified_by_user_id?: string;
  admin_approved_by_user_id?: string;
  reviewed_at?: string;
  is_edit_for_term_id?: string;

  // Nested user details
  submitted_by_user?: UserBase;
  linguist_verifier?: UserBase;
  admin_approver?: UserBase;

  // Related term details (optional)
  term_details?: {
    id: string;
    term: string;
    definition: string;
    domain: string;
    language: string;
    example?: string;
  };

  // Voting and review info
  crowd_votes_count?: number;
  review?: string; // feedback when rejected
}

export interface TermApplicationReject {
  review: string; // required feedback when rejecting
}
