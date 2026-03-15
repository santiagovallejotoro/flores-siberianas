import { SupabaseClient } from "@supabase/supabase-js";

export enum ClientType {
  SERVER = "server",
  SPA = "spa",
}

export class SassClient {
  private client: SupabaseClient;
  private clientType: ClientType;

  constructor(client: SupabaseClient, clientType: ClientType) {
    this.client = client;
    this.clientType = clientType;
  }

  async loginEmail(email: string, password: string) {
    return this.client.auth.signInWithPassword({ email, password });
  }

  async registerEmail(email: string, password: string, metadata?: object) {
    return this.client.auth.signUp({
      email,
      password,
      options: { data: metadata || {} },
    });
  }

  async exchangeCodeForSession(code: string) {
    return this.client.auth.exchangeCodeForSession(code);
  }

  async resendVerificationEmail(email: string) {
    return this.client.auth.resend({ email, type: "signup" });
  }

  async logout() {
    const { error } = await this.client.auth.signOut({ scope: "local" });
    if (error) throw error;
    if (this.clientType === ClientType.SPA) {
      window.location.href = "/auth/clientes/login";
    }
  }

  getSupabaseClient() {
    return this.client;
  }
}
