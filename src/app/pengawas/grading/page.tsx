'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Alert, Button, Grid } from '@mui/material';
import Link from 'next/link';
import GradingIcon from '@mui/icons-material/Grading';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface GradingExam {
  id: string;
  title: string;
  startTime: string;
  pendingEssaysCount: number;
  pendingParticipantsCount: number;
}

export default function PengawasGradingPage() {
  const [exams, setExams] = useState<GradingExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGradingExams = async () => {
      try {
        const res = await fetch('/api/pengawas/grading');
        const data = await res.json();
        if (res.ok) {
          setExams(data);
        } else {
          setError(data.message || 'Gagal memuat ujian');
        }
      } catch (err) {
        setError('Terjadi kesalahan jaringan');
      } finally {
        setLoading(false);
      }
    };
    fetchGradingExams();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, letterSpacing: '-0.02em' }}>
          Penilaian Esai
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Daftar ujian yang memiliki jawaban esai untuk dinilai.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {exams.length === 0 && !error && (
        <Alert severity="success" sx={{ borderRadius: '12px' }}>Semua ujian sudah dinilai. Tidak ada antrean penilaian.</Alert>
      )}

      <Grid container spacing={3}>
        {exams.map((exam) => (
          <Grid size={{ xs: 12, md: 6 }} key={exam.id}>
            <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                  {exam.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                  {format(new Date(exam.startTime), "d MMMM yyyy, HH:mm", { locale: id })} WIB
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 3, mb: 3, bgcolor: '#f8fafc', p: 2, borderRadius: '12px' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Peserta (Pending)</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>{exam.pendingParticipantsCount}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Total Esai (Pending)</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#f43f5e' }}>{exam.pendingEssaysCount}</Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 'auto' }}>
                  <Button
                    component={Link}
                    href={`/pengawas/grading/${exam.id}`}
                    variant="contained"
                    fullWidth
                    color="secondary"
                    startIcon={<GradingIcon />}
                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                  >
                    Mulai Menilai
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
