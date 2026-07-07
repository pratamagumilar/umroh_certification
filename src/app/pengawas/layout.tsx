import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PengawasSidebar, { DRAWER_WIDTH } from "@/components/PengawasSidebar";
import Box from "@mui/material/Box";
import PageTransition from "@/components/PageTransition";

export default async function PengawasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "PENGAWAS") {
    redirect("/login");
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#faf9f6" }}>
      <PengawasSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${DRAWER_WIDTH}px`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ p: 4, flexGrow: 1 }}>
          <PageTransition>
            {children}
          </PageTransition>
        </Box>
      </Box>
    </Box>
  );
}
