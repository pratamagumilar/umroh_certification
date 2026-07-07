import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Box, Typography, Grid, Card, CardContent } from "@mui/material";
import ClassRoundedIcon from "@mui/icons-material/ClassRounded";
import PanitiaCharts from "./PanitiaCharts";

async function getPanitiaStats(userId: string) {
  // Total Course managed by Panitia
  const totalCourse = await prisma.course.count({
    where: { createdById: userId }
  });

  // Calculate daily progress (mocked for last 7 days since real implementation would require complex grouping or we can fetch last 30 SessionProgresses and map them in JS)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const progresses = await prisma.sessionProgress.findMany({
    where: {
      session: {
        course: { createdById: userId }
      },
      completedAt: { gte: sevenDaysAgo }
    },
    select: { completedAt: true }
  });

  const dailyMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dailyMap[d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })] = 0;
  }

  progresses.forEach(p => {
    const dateStr = p.completedAt.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    if (dailyMap[dateStr] !== undefined) {
      dailyMap[dateStr]++;
    }
  });

  const dailyProgress = Object.keys(dailyMap).map(date => ({
    date,
    count: dailyMap[date]
  }));

  return { totalCourse, dailyProgress };
}

export default async function PanitiaDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "PANITIA") {
    redirect("/login");
  }

  const stats = await getPanitiaStats(session.user.id);
  
  return (
    <Box sx={{ pb: 6 }}>
      {/* Premium Banner */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        borderRadius: '24px',
        p: { xs: 3, md: 5 },
        color: 'white',
        mb: 5,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(5, 150, 105, 0.2), 0 8px 10px -6px rgba(5, 150, 105, 0.1)'
      }}>
        <Box sx={{
          position: 'absolute', top: -50, right: -20, width: 250, height: 250,
          borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(30px)'
        }} />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em' }}>
            Dashboard Panitia
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: '600px', fontSize: '1.1rem' }}>
            Selamat datang, {session.user.name}! Pantau tren penyelesaian materi dan tugas peserta di sini.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              borderRadius: '20px',
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.02), 0 4px 6px -4px rgba(0,0,0,0.02)",
              border: "1px solid #f1f5f9",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.02)",
              },
            }}
          >
            <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "rgba(5, 150, 105, 0.1)",
                  color: "#059669",
                }}
              >
                <ClassRoundedIcon sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1 }}>
                  {stats.totalCourse}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600, mt: 0.5 }}>
                  Course Dikelola
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Render Charts */}
        <Grid size={{ xs: 12, md: 8 }}>
          <PanitiaCharts dailyProgress={stats.dailyProgress} />
        </Grid>
      </Grid>
    </Box>
  );
}
