import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo course data...");

  // 1. Dapatkan user admin dan peserta
  const admin = await prisma.user.findUnique({ where: { email: "admin@umroh.com" } });
  const peserta = await prisma.user.findUnique({ where: { email: "peserta@umroh.com" } });

  if (!admin || !peserta) {
    console.error("Admin atau Peserta tidak ditemukan. Pastikan sudah menjalankan prisma db seed.");
    return;
  }

  // 2. Buat Course
  const course = await prisma.course.create({
    data: {
      title: "Panduan Lengkap Umroh 2026",
      description: "Materi sertifikasi pembimbing ibadah umroh komprehensif.",
      createdById: admin.id,
      isActive: true,
    }
  });

  console.log(`Course created: ${course.title}`);

  // 3. Buat Master Material (PDF)
  const material1 = await prisma.material.create({
    data: {
      title: "1. Fiqih Umroh Dasar",
      description: "Memahami rukun, wajib, dan sunnah umroh sesuai sunnah.",
      pdfUrl: "/dummy-fiqih.pdf", // dummy URL
      createdById: admin.id,
    }
  });
  
  const material2 = await prisma.material.create({
    data: {
      title: "2. Adab Ziarah Madinah",
      description: "Adab dan tata cara berkunjung ke masjid Nabawi dan tempat bersejarah.",
      pdfUrl: "/dummy-ziarah.pdf",
      createdById: admin.id,
    }
  });

  console.log(`Materials created: ${material1.title}, ${material2.title}`);

  // 4. Buat Master Assignment
  const assignment1 = await prisma.masterAssignment.create({
    data: {
      title: "Tugas Esai Fiqih Umroh",
      prompt: "Jelaskan secara singkat perbedaan antara rukun umroh dan wajib umroh. Berikan contoh kasus pelanggaran wajib umroh beserta dam (denda) yang harus dibayar.",
      maxScore: 100,
      createdById: admin.id,
    }
  });

  console.log(`Assignment created: ${assignment1.title}`);

  // 5. Buat Sesi (CourseSessions) -> Sesi 1: Materi, Sesi 2: Tugas, Sesi 3: Materi
  await prisma.courseSession.create({
    data: {
      courseId: course.id,
      materialId: material1.id,
      order: 1,
      isLocked: false,
    }
  });

  await prisma.courseSession.create({
    data: {
      courseId: course.id,
      masterAssignmentId: assignment1.id,
      order: 2,
      isLocked: false, // Bebas akses untuk demo
    }
  });

  await prisma.courseSession.create({
    data: {
      courseId: course.id,
      materialId: material2.id,
      order: 3,
      isLocked: false,
    }
  });

  console.log("Sessions mapped to course.");

  // 6. Enroll Peserta
  await prisma.courseEnrollment.create({
    data: {
      courseId: course.id,
      userId: peserta.id,
      status: "ENROLLED"
    }
  });

  console.log(`User ${peserta.name} enrolled to course ${course.title}.`);
  console.log("Seeding complete! You can now login as peserta@umroh.com / peserta123 to check it.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
