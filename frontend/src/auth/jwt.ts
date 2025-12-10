import { jwtDecode } from "jwt-decode";

export type JwtPayload = {
  sub: string;
  username: string;
  tenant_id: string;
  [key: string]: any;
};

export function parseJwt(token: string): JwtPayload | null {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
}
