import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      email: "admin@umroh.com",
      password: "admin123",
      name: "Administrator",
      role: "ADMIN",
    },
    {
      email: "pengawas@umroh.com",
      password: "pengawas123",
      name: "Pengawas",
      role: "PENGAWAS",
    },
    {
      email: "peserta@umroh.com",
      password: "peserta123",
      name: "Peserta",
      role: "PESERTA",
    },
    {
      email: "panitia@umroh.com",
      password: "panitia123",
      name: "Panitia Pembelajaran",
      role: "PANITIA",
    },
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    const seededUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        password: hashedPassword,
        role: user.role,
        isActive: true,
      },
      create: {
        email: user.email,
        name: user.name,
        password: hashedPassword,
        role: user.role,
      },
    });

    console.log(`Seeded ${seededUser.role.toLowerCase()} user: ${seededUser.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
