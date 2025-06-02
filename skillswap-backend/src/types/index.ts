export interface User {
  uid: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: 'student' | 'mentor' | 'admin';
  skills_offered: string[];
  skills_wanted: string[];
  availability: {
    days: string[];
    times: string[];
  };
  badge_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  avatar_url?: string;
  role?: 'student' | 'mentor';
  skills_offered?: string[];
  skills_wanted?: string[];
  availability?: {
    days: string[];
    times: string[];
  };
}

export interface UpdateProfileRequest {
  name?: string;
  avatar_url?: string;
  skills_offered?: string[];
  skills_wanted?: string[];
  availability?: {
    days: string[];
    times: string[];
  };
}

export interface UserMatch {
  uid: string;
  name: string;
  skills_offered: string[];
  skills_wanted: string[];
  badge_count: number;
  availability: {
    days: string[];
    times: string[];
  };
  match_score: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface MatchParams extends PaginationParams {
  skill_filter?: string;
  availability_filter?: string[];
}