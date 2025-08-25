// app/components/AppSidebarServer.tsx
import { checkUser } from "@/lib/auth/checkUser";
import AppSidebarClient from "./AppSideBarClient";

export default async function AppSidebarServer() {
  const user = await checkUser();
  return <AppSidebarClient />;
}
