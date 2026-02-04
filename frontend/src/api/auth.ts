import { api } from "./client";

export interface Token {
  access_token: string;
  token_type: string;
}

export interface UserOut {
  username: string;
}

export async function login(username: string, password: string): Promise<Token> {
  return api<Token>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function me(): Promise<UserOut> {
  return api<UserOut>("/auth/me");
}
