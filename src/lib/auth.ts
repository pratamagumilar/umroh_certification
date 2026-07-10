import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          // Check if there's a pending/rejected registration
          const pendaftaran = await prisma.pendaftaran.findUnique({
            where: { email: credentials.email },
            select: { status: true },
          });

          if (pendaftaran?.status === "PENDING") {
            throw new Error(
              "Akun Anda masih menunggu persetujuan admin. Silakan coba lagi nanti."
            );
          }

          if (pendaftaran?.status === "REJECTED") {
            throw new Error(
              "Pendaftaran Anda ditolak. Silakan hubungi admin untuk informasi lebih lanjut."
            );
          }

          throw new Error("Email atau password salah.");
        }

        if (!user.isActive) {
          throw new Error("Akun Anda telah dinonaktifkan. Silakan hubungi admin.");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Email atau password salah.');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

/**
 * Mengembalikan path dashboard sesuai role user.
 */
export function getDashboardByRole(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "PENGAWAS":
      return "/pengawas/dashboard";
    case "PANITIA":
      return "/panitia/dashboard";
    case "PESERTA":
    default:
      return "/dashboard";
  }
}
