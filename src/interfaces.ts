export interface Article {
  id: number;
  title: string;
  category: string;
  submitted_by: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;

  password?: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
}
