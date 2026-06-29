import { ProtectedRoute } from "@/features/auth";
import { KycScreen } from "@/features/kyc";

export default function KycPage() {
  return (
    <ProtectedRoute>
      <KycScreen />
    </ProtectedRoute>
  );
}
