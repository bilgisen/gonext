// app/components/UserProfile.server.tsx
'use server';

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import UserProfileClient from './UserProfile.client';

interface DatabaseUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  emailVerified: boolean;
  role: string | null;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionResult {
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    impersonatedBy?: string | null;
    user: DatabaseUser;
  } | null;
}

export default async function UserProfile({ mini }: { mini?: boolean }) {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    }) as unknown as SessionResult;

    const sessionUser = result?.session?.user;
    
    if (!sessionUser) {
      return <UserProfileClient user={null} mini={mini} />;
    }

    const user = {
      id: sessionUser.id,
      name: sessionUser.name || '',
      email: sessionUser.email || '',
      image: sessionUser.image || null,
      emailVerified: sessionUser.emailVerified || false,
      createdAt: sessionUser.createdAt || new Date(),
      updatedAt: sessionUser.updatedAt || new Date(),
      role: sessionUser.role || 'user'
    };

    return <UserProfileClient user={user} mini={mini} />;
  } catch (error) {
    console.error('Error in UserProfile:', error);
    return <UserProfileClient user={null} mini={mini} />;
  }
}