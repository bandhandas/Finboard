import { DashboardGate, ProtectedRoute } from "@/features/auth";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardGate />
    </ProtectedRoute>
  );
}
