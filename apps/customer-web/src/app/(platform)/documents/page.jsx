import { ProtectedRoute } from "@/features/auth";
import { DocumentsScreen } from "@/features/documents";

export default function DocumentsPage() {
  return (
    <ProtectedRoute>
      <DocumentsScreen />
    </ProtectedRoute>
  );
}
