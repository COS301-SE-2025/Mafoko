// TypeScript interfaces matching the backend feedback schemas

export enum FeedbackType {
  SUGGESTION = 'suggestion',
  COMPLAINT = 'complaint',
  COMPLIMENT = 'compliment',
}

export enum FeedbackStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum FeedbackPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface FeedbackBase {
  type: FeedbackType;
  message: string;
  name?: string | null;
  email?: string | null;
  priority?: FeedbackPriority;
}

export type FeedbackCreate = FeedbackBase;

export interface FeedbackUpdate {
  status?: FeedbackStatus;
  priority?: FeedbackPriority;
  admin_response?: string | null;
}

export interface Feedback extends FeedbackBase {
  id: string;
  user_id?: string | null;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  created_at: string; // ISO datetime string
  admin_response?: string | null;
  resolved_at?: string | null; // ISO datetime string
  resolved_by_user_id?: string | null;
}

export interface FeedbackAdmin extends Feedback {
  user_email?: string | null;
  resolved_by_email?: string | null;
}

export interface FeedbackStats {
  total_feedback: number;
  open_feedback: number;
  resolved_feedback: number;
  by_type: Record<string, number>;
  recent_feedback: Feedback[];
}

// Frontend-specific interfaces for UI
export interface FeedbackFilters {
  type: string; // 'all' | FeedbackType
  status: string; // 'all' | FeedbackStatus
  search: string;
}

export interface FeedbackApiParams {
  skip?: number;
  limit?: number;
  status?: FeedbackStatus;
  feedback_type?: FeedbackType;
}
