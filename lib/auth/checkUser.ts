import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const checkUser = async () => {
  try {
    const user = await currentUser();

    if (!user) {
      return null;
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId: user.id,
      },
    });

    if (existingUser) return existingUser;

    const newUser = await prisma.user.create({
      data: {
        clerkId: user.id,
        name: `${user.firstName} ${user.lastName} `,
        // imageUrl : user.imageUrl,
        email: user.emailAddresses[0]?.emailAddress,
        role: "USER", // Default role
      },
    });

    return newUser;
  } catch (error) {
    console.error("Error in checkUser:", error);
    return null;
  }
};
