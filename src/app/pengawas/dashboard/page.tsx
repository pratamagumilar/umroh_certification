'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GradingIcon from '@mui/icons-material/Grading';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface DashboardData {
  activeExamsCount: number;
  completedExamsCount: number;
  pendingEssaysCount: number;
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
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return <Alert severity="error">{error || 'Data tidak ditemukan'}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a201b', mb: 1, letterSpacing: '-0.02em' }}>
          Dashboard Pengawas
        </Typography>
        <Typography variant="body1" sx={{ color: '#78867a' }}>
          Ringkasan tugas pengawasan dan penilaian esai Anda hari ini.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: '16px', background: 'linear-gradient(135deg, #e9eee8 0%, #d3dcd2 100%)', boxShadow: 'none' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#789276', color: 'white', display: 'flex' }}>
                  <VisibilityIcon />
                </Box>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#596d58', mb: 1 }}>
                {data.activeExamsCount}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#475746' }}>
                Ujian Sedang Aktif
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: '16px', background: 'linear-gradient(135deg, #f5eedb 0%, #ebddc2 100%)', boxShadow: 'none' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#d4b886', color: 'white', display: 'flex' }}>
                  <GradingIcon />
                </Box>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#ab9267', mb: 1 }}>
                {data.pendingEssaysCount}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#8c7855' }}>
                Esai Belum Dinilai
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: '16px', background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', boxShadow: 'none' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#22c55e', color: 'white', display: 'flex' }}>
                  <CheckCircleIcon />
                </Box>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#15803d', mb: 1 }}>
                {data.completedExamsCount}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#166534' }}>
                Total Ujian Selesai
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
