import AdminNavbar from "@/features/layout/components/admin-navbar";

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      {children}
    </div>
  );
}
