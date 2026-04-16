export interface User {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
