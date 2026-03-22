export type AuthUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
};
