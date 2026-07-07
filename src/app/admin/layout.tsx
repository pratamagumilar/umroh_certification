import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar, { DRAWER_WIDTH } from "@/components/AdminSidebar";
import Box from "@mui/material/Box";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#faf9f6" }}>
      <AdminSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${DRAWER_WIDTH}px`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ p: 4, flexGrow: 1 }}>{children}</Box>
      </Box>
    </Box>
  );
}
