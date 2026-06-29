import { ProtectedRoute } from "@/features/auth";
import AdminKycDetailScreen from "@/features/admin/kyc/screens/admin-kyc-detail-screen";

export default async function AdminKycDetailPage({ params }) {
  const { id } = await params;

  return (
    <ProtectedRoute requiredRole={["admin", "rta_admin"]}>
      <AdminKycDetailScreen applicationId={id} />
    </ProtectedRoute>
  );
}
