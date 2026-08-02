import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[seed] Nothing to seed yet — Phase 1 baseline has no fixture data.");
  console.log("[seed] Later phases (shop items, achievements, themes) will seed catalog data here.");
}

main()
  .catch((err) => {
    console.error("[seed] Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
