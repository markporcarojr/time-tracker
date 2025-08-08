import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  // Check if user already exists in DB
  const existingUser = await prisma.user.findUnique({
    where: {
      clerkId: user.id,
    },
  });

  // Return existing user if found
  if (existingUser) return existingUser;

  // Otherwise, create and return new user
  const newUser = await prisma.user.create({
    data: {
      clerkId: user.id,
      name: `${user.firstName} ${user.lastName} `,
      // imageUrl : user.imageUrl,
      email: user.emailAddresses[0]?.emailAddress,
    },
  });

  return newUser;
};
