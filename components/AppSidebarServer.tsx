import { AppSidebar } from "@/components/app-sidebar";
import { checkUser } from "@/lib/auth/checkUser";

export default async function AppSidebarServer() {
  const user = await checkUser();
  return <AppSidebar user={user} />;
}
