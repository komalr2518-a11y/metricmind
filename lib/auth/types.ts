export interface PublicUser {
  id: string;
  username: string;
  createdAt: string;
}

export interface AuthSuccessResponse {
  user: PublicUser;
}

export interface AuthErrorResponse {
  error: string;
}
