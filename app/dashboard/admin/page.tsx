// app/dashboard/admin/page.tsx
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  // 1. Oturumu al (sadece session bilgisi gelir)
  const sessionResult = await auth.api.getSession({
    headers: await headers(),
  });

  const session = sessionResult?.session;
  if (!session?.userId) {
    redirect("/sign-in");
  }

  // 2. Kullanıcıyı userId ile doğrudan veritabanından al
  const [dbUser] = await db.select().from(user).where(eq(user.id, session.userId));

  // 3. Kullanıcı yoksa veya admin değilse, dashboard'a yönlendir
  if (!dbUser || dbUser.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <section className="flex flex-col items-start justify-start p-6 w-full">
      <div className="w-full">
        <div className="flex flex-col items-start justify-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            This is a protected admin area.
          </p>
        </div>
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Admin içerikleri buraya */}
          </div>
        </div>
      </div>
    </section>
  );
}