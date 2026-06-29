"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDefaultAdminRoute } from "@/features/admin/config/admin-nav.config";
import { useAuth } from "@/features/auth/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminIndexPage() {
  const { token, user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    if (["admin", "rta_admin", "amc_admin"].includes(user?.role)) {
      router.replace(getDefaultAdminRoute(user.role));
      return;
    }

    router.replace("/dashboard");
  }, [ready, token, user, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6">
      <Skeleton className="h-8 w-64" />
      <p className="text-sm text-muted-foreground">Opening admin workspace...</p>
    </div>
  );
}
