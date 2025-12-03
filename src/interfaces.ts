export interface Article {
  id: number;
  title: string;
  body: string;
  category: string;
  submitted_by: number;
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

export interface PostWithUser extends Article {
  username: string;
  email: string;
}
