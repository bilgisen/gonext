// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { organizationClient, adminClient } from "better-auth/client/plugins";
import { polarClient } from "@polar-sh/better-auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    organizationClient(), 
    polarClient(),
    adminClient()
  ],
});

// authClient nesnesinden hook'ları doğrudan export edin
export const { useSession } = authClient; // Gerekli diğer hook'ları da buraya ekleyebilirsiniz
// Örnek: export const { useSession, useSignOut, useSignIn, useUser } = authClient;