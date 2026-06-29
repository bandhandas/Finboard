import { ProtectedRoute } from "@/features/auth";
import { AmcAdminScreen } from "@/features/admin";

export default function AmcAdminPage() {
  return (
    <ProtectedRoute requiredRole={["admin", "amc_admin"]}>
      <AmcAdminScreen />
    </ProtectedRoute>
  );
}
