"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDefaultAdminRoute } from "@/features/admin/config/admin-nav.config";
import { ProtectedRoute } from "@/features/auth";
import { useAuth } from "@/features/auth/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

function AdminDashboardRedirect() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user?.role) {
      return;
    }

    router.replace(getDefaultAdminRoute(user.role));
  }, [user, router]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6">
      <Skeleton className="h-8 w-64" />
      <p className="text-sm text-muted-foreground">Opening admin workspace...</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRole={["admin", "rta_admin", "amc_admin"]}>
      <AdminDashboardRedirect />
    </ProtectedRoute>
  );
}
