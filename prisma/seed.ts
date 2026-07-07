import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Mulai melakukan seeding data E2E...");

  // 1. Buat Users
  const usersData = [
    { email: "admin@umroh.com", password: "password123", name: "Administrator", role: "ADMIN" },
    { email: "pengawas@umroh.com", password: "password123", name: "Pengawas Ujian", role: "PENGAWAS" },
    { email: "panitia@umroh.com", password: "password123", name: "Panitia Pembelajaran", role: "PANITIA" },
    { email: "budi@umroh.com", password: "password123", name: "Budi Santoso", role: "PESERTA" },
    { email: "siti@umroh.com", password: "password123", name: "Siti Aminah", role: "PESERTA" },
  ];

  const createdUsers: Record<string, any> = {};

  for (const user of usersData) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const seededUser = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, password: hashedPassword, role: user.role, isActive: true },
      create: { email: user.email, name: user.name, password: hashedPassword, role: user.role },
    });
    createdUsers[user.email] = seededUser;
    console.log(`- Seeded User: ${user.email} (${user.role})`);
  }

  const adminId = createdUsers["admin@umroh.com"].id;
  const panitiaId = createdUsers["panitia@umroh.com"].id;
  const budiId = createdUsers["budi@umroh.com"].id;
  const sitiId = createdUsers["siti@umroh.com"].id;

  // 2. Buat Master Materials & Assignments
  const material1 = await prisma.material.create({
    data: {
      title: "Panduan Dasar Ibadah Umroh",
      description: "Materi PDF tentang rukun dan wajib umroh",
      pdfUrl: "/uploads/panduan_dasar_umroh.pdf", // Dummy URL
      createdById: adminId
    }
  });

  const material2 = await prisma.material.create({
    data: {
      title: "Tata Cara Tawaf & Sa'i",
      description: "Materi PDF teknis pelaksanaan Tawaf dan Sa'i",
      pdfUrl: "/uploads/tawaf_sai.pdf",
      createdById: adminId
    }
  });

  const assignment1 = await prisma.masterAssignment.create({
    data: {
      title: "Tugas 1: Refleksi Rukun Umroh",
      prompt: "Sebutkan dan jelaskan secara singkat rukun-rukun umroh. Tuliskan minimal 3 paragraf mengenai rukun umroh.",
      maxScore: 100,
      createdById: adminId
    }
  });

  console.log("- Seeded Master Materials & Assignments");

  // 3. Buat Course
  const course = await prisma.course.create({
    data: {
      title: "Sertifikasi Pembimbing Umroh Angkatan 1",
      description: "Program sertifikasi komprehensif untuk calon pembimbing jamaah umroh.",
      createdById: adminId,
    }
  });
  console.log(`- Seeded Course: ${course.title}`);

  // 4. Enroll Peserta ke Course
  await prisma.courseEnrollment.createMany({
    data: [
      { courseId: course.id, userId: budiId, status: "ENROLLED" },
      { courseId: course.id, userId: sitiId, status: "ENROLLED" }
    ]
  });
  console.log("- Seeded Enrollments (Budi & Siti)");

  // 5. Buat Sesi Pembelajaran (Course Sessions)
  const sessionM1 = await prisma.courseSession.create({
    data: { courseId: course.id, materialId: material1.id, order: 1, isLocked: false }
  });
  const sessionA1 = await prisma.courseSession.create({
    data: { courseId: course.id, masterAssignmentId: assignment1.id, order: 2, isLocked: false }
  });
  const sessionM2 = await prisma.courseSession.create({
    data: { courseId: course.id, materialId: material2.id, order: 3, isLocked: false }
  });
  console.log("- Seeded Course Sessions");

  // 6. Buat Progress dan Assignment Submissions
  // Progress Materi 1
  await prisma.sessionProgress.createMany({
    data: [
      { sessionId: sessionM1.id, userId: budiId, status: "COMPLETED" },
      { sessionId: sessionM1.id, userId: sitiId, status: "COMPLETED" },
    ]
  });

  // Jawaban Tugas Budi
  const subBudi = await prisma.assignmentSubmission.create({
    data: {
      sessionId: sessionA1.id,
      userId: budiId,
      answer: "Rukun umroh ada lima: Ihram, Tawaf, Sa'i, Tahallul, dan Tertib. Semuanya harus dilakukan berurutan...",
      status: "GRADED"
    }
  });

  // Nilai Budi dari Panitia
  await prisma.assignmentGrade.create({
    data: {
      submissionId: subBudi.id,
      graderId: panitiaId,
      score: 90,
      feedback: "Jawaban sangat lengkap dan tepat."
    }
  });

  // Jawaban Tugas Siti
  const subSiti = await prisma.assignmentSubmission.create({
    data: {
      sessionId: sessionA1.id,
      userId: sitiId,
      answer: "Rukun umroh terdiri dari niat ihram di miqat, tawaf mengelilingi kabah, sai antara safa marwah, dan cukur rambut.",
      status: "GRADED"
    }
  });

  // Nilai Siti dari Panitia
  await prisma.assignmentGrade.create({
    data: {
      submissionId: subSiti.id,
      graderId: panitiaId,
      score: 80,
      feedback: "Jawaban cukup baik, tapi perlu sedikit dielaborasi di bagian tertib."
    }
  });

  console.log("- Seeded Session Progresses, Submissions, and Grades");

  // 7. Buat Question Bank + 5 Soal + Exam
  const bank = await prisma.questionBank.create({
    data: {
      title: "Bank Soal Sertifikasi Umroh",
      description: "Kumpulan soal pilihan ganda seputar ibadah umroh"
    }
  });

  const questionsData = [
    {
      type: "PG",
      text: "Apa yang dimaksud dengan Ihram dalam ibadah umroh?",
      options: JSON.stringify({ A: "Pakaian khusus berwarna putih", B: "Niat untuk memulai ibadah umroh di miqat", C: "Berdoa di depan Ka'bah", D: "Mencukur rambut setelah Sa'i" }),
      correctAnswer: "B"
    },
    {
      type: "PG",
      text: "Berapa kali putaran Tawaf yang harus dilakukan?",
      options: JSON.stringify({ A: "5 kali", B: "6 kali", C: "7 kali", D: "8 kali" }),
      correctAnswer: "C"
    },
    {
      type: "PG",
      text: "Sa'i dilakukan antara bukit apa saja?",
      options: JSON.stringify({ A: "Uhud dan Tsur", B: "Safa dan Marwah", C: "Arafah dan Muzdalifah", D: "Mina dan Arafah" }),
      correctAnswer: "B"
    },
    {
      type: "PG",
      text: "Apa hukum ibadah umroh menurut mayoritas ulama?",
      options: JSON.stringify({ A: "Sunnah Muakkadah", B: "Mubah", C: "Wajib sekali seumur hidup", D: "Makruh jika tidak mampu" }),
      correctAnswer: "C"
    },
    {
      type: "PG",
      text: "Tahallul dalam umroh dilakukan dengan cara?",
      options: JSON.stringify({ A: "Berwudu lalu sholat", B: "Mencukur atau memendekkan rambut", C: "Membaca talbiyah", D: "Melontar jumrah" }),
      correctAnswer: "B"
    },
  ];

  const createdQuestions = [];
  for (const q of questionsData) {
    const question = await prisma.question.create({
      data: { bankId: bank.id, ...q }
    });
    createdQuestions.push(question);
  }
  console.log("- Seeded Question Bank dengan 5 soal PG");

  const exam = await prisma.exam.create({
    data: {
      title: "Ujian Akhir Sertifikasi Umroh",
      description: "Ujian tertulis 5 soal pilihan ganda seputar ibadah umroh.",
      startTime: new Date(), // Sekarang, agar bisa langsung diakses
      durationMinutes: 60,
      passingGrade: 60,
    }
  });

  // Link semua soal ke exam
  for (const q of createdQuestions) {
    await prisma.examQuestion.create({
      data: { examId: exam.id, questionId: q.id }
    });
  }

  await prisma.courseExam.create({
    data: { courseId: course.id, examId: exam.id, isRequired: true }
  });
  console.log("- Seeded Exam + 5 soal terkait");

  console.log("Seeding E2E selesai!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
