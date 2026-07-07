'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import GradingRoundedIcon from '@mui/icons-material/GradingRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import SupervisorAccountRoundedIcon from '@mui/icons-material/SupervisorAccountRounded';

interface DashboardData {
  activeExamsCount: number;
  completedExamsCount: number;
  pendingEssaysCount: number;
  averageSlaHours: string;
}

export default function PengawasDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/pengawas/dashboard');
        const result = await res.json();
        if (res.ok) {
          setData(result);
        } else {
          setError(result.message || 'Gagal memuat data dashboard');
        }
      } catch (err) {
        setError('Terjadi kesalahan jaringan');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={48} thickness={4} />
      </Box>
    );
  }

  if (error || !data) {
    return <Alert severity="error" sx={{ borderRadius: '12px', mt: 2 }}>{error || 'Data tidak ditemukan'}</Alert>;
  }

  const statCards = [
    {
      title: 'Ujian Sedang Aktif',
      value: data.activeExamsCount,
      icon: <VisibilityRoundedIcon sx={{ fontSize: 32 }} />,
      color: '#0ea5e9',
      bgColor: 'rgba(14, 165, 233, 0.1)',
    },
    {
      title: 'Esai Belum Dinilai',
      value: data.pendingEssaysCount,
      icon: <GradingRoundedIcon sx={{ fontSize: 32 }} />,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
    {
      title: 'Total Ujian Selesai',
      value: data.completedExamsCount,
      icon: <CheckCircleRoundedIcon sx={{ fontSize: 32 }} />,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      title: 'SLA Penilaian (Jam)',
      value: data.averageSlaHours,
      icon: <GradingRoundedIcon sx={{ fontSize: 32 }} />,
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
    },
  ];

  return (
    <Box sx={{ pb: 6 }}>
      {/* Premium Welcome Banner tailored for Pengawas */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
        borderRadius: '24px',
        p: { xs: 3, md: 5 },
        color: 'white',
        mb: 5,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(217, 119, 6, 0.2), 0 8px 10px -6px rgba(217, 119, 6, 0.1)'
      }}>
        {/* Abstract shapes for premium feel */}
        <Box sx={{
          position: 'absolute', top: -50, right: -20, width: 250, height: 250,
          borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(30px)'
        }} />
        <Box sx={{
          position: 'absolute', bottom: -50, right: 150, width: 150, height: 150,
          borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(20px)'
        }} />

        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ 
            width: 80, height: 80, borderRadius: '50%', 
            bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <SupervisorAccountRoundedIcon sx={{ fontSize: 40 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em' }}>
              Dashboard Pengawas
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: '600px', fontSize: '1.1rem' }}>
              Ringkasan tugas pengawasan Anda hari ini. Segera berikan penilaian pada esai yang belum diperiksa.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Metric Cards */}
      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
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
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
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
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, color: "text.primary", lineHeight: 1, mb: 1 }}>
                  {card.value}
                </Typography>
                <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  {card.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
