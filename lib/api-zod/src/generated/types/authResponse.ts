import type { Profile } from "./profile";

export interface AuthResponse {
  user: Profile;
  token: string;
}
