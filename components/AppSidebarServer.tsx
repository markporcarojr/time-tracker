// app/components/AppSidebarServer.tsx
import { checkUser } from "@/lib/auth/checkUser";
import AppSidebarClient from "./AppSideBarClient";

export default async function AppSidebarServer() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const user = await checkUser();
  return <AppSidebarClient />;
}
