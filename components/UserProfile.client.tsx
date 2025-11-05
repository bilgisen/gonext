"use client";

import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import the UserProfileMenu with no SSR
const UserProfileMenu = dynamic(
  () => import('./UserProfileMenu.client'),
  { ssr: false }
);

interface UserInfo {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  role?: string;
}

interface UserProfileProps {
  user: UserInfo | null;
  mini?: boolean;
}

export default function UserProfileClient({ user, mini }: UserProfileProps) {
  if (!user) {
    // Fallback UI when user is not logged in
    return (
      <Link
        href="/sign-in"
        className={`flex gap-2 justify-start items-center w-full rounded ${mini ? "" : "px-4 pt-2 pb-3"}`}
      >
        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-500 dark:text-gray-400"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        {!mini && (
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Sign In
          </span>
        )}
      </Link>
    );
  }

  return <UserProfileMenu user={user} mini={mini} />;
}
