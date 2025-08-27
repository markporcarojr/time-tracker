import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

interface AdminUserResult {
  user: {
    id: number;
    clerkId: string;
    email: string | null;
    name: string | null;
    role: string;
  };
  isAdmin: boolean;
}

export async function checkAdminUser(): Promise<AdminUserResult | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await prisma.user.findUnique({ 
      where: { clerkId: userId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        role: true,
      }
    });

    if (!user) return null;

    return {
      user,
      isAdmin: user.role === "ADMIN"
    };
  } catch (error) {
    console.error("Error checking admin user:", error);
    return null;
  }
}

export async function requireAdmin() {
  const result = await checkAdminUser();
  if (!result || !result.isAdmin) {
    throw new Error("Admin access required");
  }
  return result.user;
}