// lib/check-user.ts
import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const checkUser = async () => {
  try {
    const user = await currentUser();
    if (!user) return null;

    const email =
      user.emailAddresses?.[0]?.emailAddress ??
      user.primaryEmailAddress?.emailAddress ??
      null;

    const first = (user.firstName ?? "").trim();
    const last = (user.lastName ?? "").trim();
    const name = [first, last].filter(Boolean).join(" ") || null;

    // Avoid race conditions on first write
    const dbUser = await prisma.user.upsert({
      where: { clerkId: user.id },
      update: {
        // keep minimal updates here to avoid clobbering user edits
        email: email ?? undefined,
        name: name ?? undefined,
      },
      create: {
        clerkId: user.id,
        email,
        name,
        role: "USER",
      },
    });

    return dbUser;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error in checkUser:", error);
    }
    return null;
  }
};
