import GuestRoute from "@/features/auth/components/guest-route";

export default function AuthLayout({ children }) {
  return (
    <div className="auth-theme min-h-screen bg-background text-foreground">
      <GuestRoute>{children}</GuestRoute>
    </div>
  );
}
