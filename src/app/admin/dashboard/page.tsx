import { prisma } from "@/lib/prisma";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

async function getStats() {
  const [totalPeserta, totalPengawas, totalExams, activeExams] =
    await Promise.all([
      prisma.user.count({ where: { role: "PESERTA" } }),
      prisma.user.count({ where: { role: "PENGAWAS" } }),
      prisma.exam.count(),
      prisma.exam.count({ where: { isActive: true } }),
    ]);

  return { totalPeserta, totalPengawas, totalExams, activeExams };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    {
      label: "Total Peserta",
      value: stats.totalPeserta,
      icon: <PeopleRoundedIcon sx={{ fontSize: 32 }} />,
      color: "#059669",
      bgColor: "rgba(5, 150, 105, 0.1)",
    },
    {
      label: "Total Pengawas",
      value: stats.totalPengawas,
      icon: <SupervisorAccountRoundedIcon sx={{ fontSize: 32 }} />,
      color: "#8b5cf6",
      bgColor: "rgba(139, 92, 246, 0.1)",
    },
    {
      label: "Total Ujian",
      value: stats.totalExams,
      icon: <QuizRoundedIcon sx={{ fontSize: 32 }} />,
      color: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.1)",
    },
    {
      label: "Ujian Aktif",
      value: stats.activeExams,
      icon: <CheckCircleRoundedIcon sx={{ fontSize: 32 }} />,
      color: "#0ea5e9",
      bgColor: "rgba(14, 165, 233, 0.1)",
    },
  ];

  return (
    <Box sx={{ pb: 6 }}>
      {/* Premium Welcome Banner */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
        borderRadius: '24px',
        p: { xs: 3, md: 5 },
        color: 'white',
        mb: 5,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.2), 0 8px 10px -6px rgba(15, 23, 42, 0.1)'
      }}>
        {/* Abstract shapes for premium feel */}
        <Box sx={{
          position: 'absolute', top: -50, right: -20, width: 250, height: 250,
          borderRadius: '50%', background: 'rgba(255,255,255,0.05)', filter: 'blur(30px)'
        }} />
        <Box sx={{
          position: 'absolute', bottom: -50, right: 150, width: 150, height: 150,
          borderRadius: '50%', background: 'rgba(255,255,255,0.05)', filter: 'blur(20px)'
        }} />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em' }}>
            Dashboard Admin
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: '600px', fontSize: '1.1rem' }}>
            Selamat datang di Panel Admin Sertifikasi Umroh. Pantau aktivitas pengguna, ujian, dan kelola master data sistem di sini.
          </Typography>
        </Box>
      </Box>

      {/* Metric Cards */}
      <Grid container spacing={3}>
        {statCards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
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
                    bgcolor: card.bgColor,
                    color: card.color,
                  }}
                >
                  {card.icon}
                </Box>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1 }}>
                    {card.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600, mt: 0.5 }}>
                    {card.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
