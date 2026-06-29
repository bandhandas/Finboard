import { ProtectedRoute } from "@/features/auth";
import { StockDetailScreen } from "@/features/investments";

export default function StockDetailPage() {
  return (
    <ProtectedRoute>
      <StockDetailScreen />
    </ProtectedRoute>
  );
}
