import { ProtectedRoute } from "@/features/auth";
import AdminAuditDetailScreen from "@/features/audit/screens/admin-audit-detail-screen";

export default async function AdminAuditDetailPage({ params }) {
  const { id } = await params;

  return (
    <ProtectedRoute requiredRole={["admin", "rta_admin"]}>
      <AdminAuditDetailScreen applicationId={id} />
    </ProtectedRoute>
  );
}
