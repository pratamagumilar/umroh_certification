import { prisma } from "@/lib/prisma";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import PeopleIcon from "@mui/icons-material/People";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import QuizIcon from "@mui/icons-material/Quiz";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

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
      icon: <PeopleIcon sx={{ fontSize: 36 }} />,
      color: "#789276",
      bgColor: "#f4f6f4",
    },
    {
      label: "Total Pengawas",
      value: stats.totalPengawas,
      icon: <SupervisorAccountIcon sx={{ fontSize: 36 }} />,
      color: "#8b5cf6",
      bgColor: "#f5f3ff",
    },
    {
      label: "Total Ujian",
      value: stats.totalExams,
      icon: <QuizIcon sx={{ fontSize: 36 }} />,
      color: "#f59e0b",
      bgColor: "#fffbeb",
    },
    {
      label: "Ujian Aktif",
      value: stats.activeExams,
      icon: <CheckCircleIcon sx={{ fontSize: 36 }} />,
      color: "#10b981",
      bgColor: "#ecfdf5",
    },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, color: "#1a201b" }}>
        Dashboard
      </Typography>
      <Typography variant="body2" sx={{ color: "#78867a", mb: 4 }}>
        Selamat datang di Panel Admin Portal Sertifikasi Umroh.
      </Typography>

      <Grid container spacing={3}>
        {statCards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                borderRadius: '12px',
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                border: "1px solid #f1f5f9",
                transition: "transform 0.15s, box-shadow 0.15s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: "#78867a", fontWeight: 500, mb: 1 }}>
                      {card.label}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a201b" }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: card.bgColor,
                      color: card.color,
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
