import { ProtectedRoute } from "@/features/auth";
import { ProfileScreen } from "@/features/profile";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileScreen />
    </ProtectedRoute>
  );
}
