import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, getDashboardByRole } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role) {
    redirect(getDashboardByRole(session.user.role));
  }

  redirect("/login");
}
