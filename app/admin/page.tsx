import { checkAdminUser } from "@/lib/auth/admin";
import { redirect } from "next/navigation";
import { AdminJobsTable } from "./AdminJobsTable";

export default async function AdminPage() {
  const result = await checkAdminUser();

  if (!result) {
    redirect("/dashboard");
  }

  if (!result.isAdmin) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h1>
          <p>You do not have admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-3 py-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-muted-foreground">
          Welcome, {result.user.name || result.user.email}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-center">
          All User Jobs
        </h2>
        <AdminJobsTable />
      </div>
    </div>
  );
}
