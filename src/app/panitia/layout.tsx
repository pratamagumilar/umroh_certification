'use client';

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Box } from "@mui/material";
import PanitiaSidebar, { DRAWER_WIDTH } from "@/components/PanitiaSidebar";
import PageTransition from "@/components/PageTransition";

export default function PanitiaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    } else if (status === "authenticated" && session?.user?.role !== "PANITIA") {
      if (session?.user?.role !== "ADMIN") {
        redirect("/dashboard");
      }
    }
  }, [status, session]);

  if (status === "loading") {
    return <Box sx={{ p: 4 }}>Loading...</Box>;
  }

  return (
    <Box sx={{ display: "flex", minHeight: '100vh', bgcolor: 'background.default' }}>
      <PanitiaSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          maxWidth: 1200,
          mx: 'auto'
        }}
      >
        <PageTransition>
          {children}
        </PageTransition>
      </Box>
    </Box>
  );
}
