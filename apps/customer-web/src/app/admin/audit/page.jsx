import { ProtectedRoute } from "@/features/auth";
import { AdminAuditScreen } from "@/features/audit";

export default function AdminAuditPage() {
  return (
    <ProtectedRoute requiredRole={["admin", "rta_admin"]}>
      <AdminAuditScreen />
    </ProtectedRoute>
  );
}
