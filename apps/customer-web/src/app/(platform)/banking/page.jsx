import { ProtectedRoute } from "@/features/auth";
import { BankingScreen } from "@/features/banking";

export default function BankingPage() {
  return (
    <ProtectedRoute requiredRole={["user"]}>
      <BankingScreen />
    </ProtectedRoute>
  );
}
