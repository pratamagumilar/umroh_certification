/*
  Warnings:

  - You are about to drop the column `assignmentId` on the `AssignmentSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `CourseSession` table. All the data in the column will be lost.
  - You are about to drop the column `pdfUrl` on the `CourseSession` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `CourseSession` table. All the data in the column will be lost.
  - You are about to drop the `SessionAssignment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[submissionId]` on the table `AssignmentGrade` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sessionId,userId]` on the table `AssignmentSubmission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,examId]` on the table `Certificate` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,questionId]` on the table `ExamAnswer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sessionId` to the `AssignmentSubmission` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AssignmentSubmission" DROP CONSTRAINT "AssignmentSubmission_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "SessionAssignment" DROP CONSTRAINT "SessionAssignment_sessionId_fkey";

-- DropIndex
DROP INDEX "AssignmentSubmission_assignmentId_userId_key";

-- AlterTable
ALTER TABLE "AssignmentSubmission" DROP COLUMN "assignmentId",
ADD COLUMN     "sessionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CourseSession" DROP COLUMN "description",
DROP COLUMN "pdfUrl",
DROP COLUMN "title",
ADD COLUMN     "masterAssignmentId" TEXT,
ADD COLUMN     "materialId" TEXT;

-- DropTable
DROP TABLE "SessionAssignment";

-- CreateTable
CREATE TABLE "MasterAssignment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "prompt" TEXT NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "pdfUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentGrade_submissionId_key" ON "AssignmentGrade"("submissionId");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_status_idx" ON "AssignmentSubmission"("status");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_userId_idx" ON "AssignmentSubmission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentSubmission_sessionId_userId_key" ON "AssignmentSubmission"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "Certificate_userId_idx" ON "Certificate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_userId_examId_key" ON "Certificate"("userId", "examId");

-- CreateIndex
CREATE INDEX "Course_isActive_idx" ON "Course"("isActive");

-- CreateIndex
CREATE INDEX "CourseEnrollment_status_idx" ON "CourseEnrollment"("status");

-- CreateIndex
CREATE INDEX "CourseEnrollment_userId_courseId_idx" ON "CourseEnrollment"("userId", "courseId");

-- CreateIndex
CREATE INDEX "Exam_isActive_idx" ON "Exam"("isActive");

-- CreateIndex
CREATE INDEX "Exam_startTime_idx" ON "Exam"("startTime");

-- CreateIndex
CREATE INDEX "ExamAnswer_score_idx" ON "ExamAnswer"("score");

-- CreateIndex
CREATE INDEX "ExamAnswer_userId_questionId_idx" ON "ExamAnswer"("userId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAnswer_userId_questionId_key" ON "ExamAnswer"("userId", "questionId");

-- CreateIndex
CREATE INDEX "ExamResult_finalStatus_idx" ON "ExamResult"("finalStatus");

-- CreateIndex
CREATE INDEX "ExamResult_userId_examId_idx" ON "ExamResult"("userId", "examId");

-- CreateIndex
CREATE INDEX "GradeAdjustment_userId_idx" ON "GradeAdjustment"("userId");

-- CreateIndex
CREATE INDEX "GradeAdjustment_courseId_idx" ON "GradeAdjustment"("courseId");

-- CreateIndex
CREATE INDEX "SessionProgress_userId_idx" ON "SessionProgress"("userId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSession" ADD CONSTRAINT "CourseSession_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSession" ADD CONSTRAINT "CourseSession_masterAssignmentId_fkey" FOREIGN KEY ("masterAssignmentId") REFERENCES "MasterAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterAssignment" ADD CONSTRAINT "MasterAssignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CourseSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeAdjustment" ADD CONSTRAINT "GradeAdjustment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeAdjustment" ADD CONSTRAINT "GradeAdjustment_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
