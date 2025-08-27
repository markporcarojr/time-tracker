import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.user.update({
    where: { email: "markporcarojr@gmail.com" }, // or { clerkId: "user_311DmKrnVVr7UyvNhpCXx0sBILm" }
    data: { role: "ADMIN" },
  });

  console.log("Promoted Mark:", updated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
