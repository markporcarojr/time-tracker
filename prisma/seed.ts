import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Ensure a test user exists (adjust to your real user or Clerk sync)
  const user = await prisma.user.upsert({
    where: { email: "dev@example.com" },
    update: {},
    create: {
      email: "dev@example.com",
      name: "Dev User",
      clerkId: "test_clerk_123", // <-- change if you already use Clerk
      role: "USER",
    },
  });

  // Create an admin user for testing
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      clerkId: "test_clerk_admin",
      role: "ADMIN",
    },
  });

  const now = new Date();
  const minutes = (n: number) => n * 60_000;
  const hours = (n: number) => n * 3_600_000;

  // Three realistic jobs with different timer states
  await prisma.job.createMany({
    data: [
      {
        userId: user.id,
        customerName: "Test Customer A",
        description: 'Turn 3/4" CRS to Ø0.708", 20 pcs. Tool: CNMG-432.',
        // paused, never started yet
        startedAt: null,
        stoppedAt: null,
        totalMs: 0,
        status: "PAUSED",
      },
      {
        userId: user.id,
        customerName: "Test Customer B",
        description: "Face + drill + contour. Work offset G54. Coolant on.",
        // currently running: started 25 min ago, already had 2h15m accumulated
        startedAt: new Date(now.getTime() - minutes(25)),
        stoppedAt: null,
        totalMs: hours(2) + minutes(15),
        status: "ACTIVE",
      },
      {
        userId: user.id,
        customerName: "Test Customer C",
        description: 'Chamfer edges, check ±0.001" on ID, bag & tag.',
        // paused: was running earlier, stopped 5 min ago with 45m accumulated
        startedAt: null,
        stoppedAt: new Date(now.getTime() - minutes(5)),
        totalMs: minutes(45),
        status: "PAUSED",
      },
      {
        userId: adminUser.id,
        customerName: "Admin Project X",
        description: "Administrative oversight and coordination tasks.",
        startedAt: null,
        stoppedAt: null,
        totalMs: hours(8) + minutes(30),
        status: "DONE",
      },
      {
        userId: adminUser.id,
        customerName: "System Maintenance",
        description: "Database cleanup and system optimization.",
        startedAt: new Date(now.getTime() - minutes(15)),
        stoppedAt: null,
        totalMs: minutes(45),
        status: "ACTIVE",
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seeded 5 jobs for 2 users (1 regular, 1 admin).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
