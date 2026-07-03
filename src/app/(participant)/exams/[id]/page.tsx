'use client';

import React, { useEffect, useState, use } from 'react';
import { Box, Typography, Card, CardContent, Button, Alert, CircularProgress, Grid, Divider } from '@mui/material';
import { useRouter } from 'next/navigation';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface ExamPrep {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  durationMinutes: number;
  _count: { questions: number };
}

export default function ExamPreparationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: examId } = use(params);
  
  const [exam, setExam] = useState<ExamPrep | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await fetch(`/api/exams/${examId}`);
        const data = await res.json();
        if (res.ok) {
          setExam(data);
        } else {
          setError(data.message || 'Gagal memuat detail ujian');
        }
      } catch {
        setError('Terjadi kesalahan jaringan');
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [examId]);

  const handleStartExam = async () => {
    setStarting(true);
    setError('');
    try {
      const res = await fetch(`/api/exams/${examId}/start`, {
        method: 'POST',
      });
      if (res.ok) {
        // Berhasil absen, lanjut ke halaman soal
        router.push(`/exams/${examId}/take`);
      } else {
        const data = await res.json();
        setError(data.message || 'Gagal memulai ujian');
        setStarting(false);
      }
    } catch {
      setError('Terjadi kesalahan jaringan');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !exam) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/exams')} sx={{ mb: 3 }}>
          Kembali
        </Button>
        <Alert severity="error">{error || 'Data tidak ditemukan'}</Alert>
      </Box>
    );
  }

  const startDate = new Date(exam.startTime);
  const isReady = startDate <= new Date();

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/exams')} sx={{ mb: 3 }}>
        Kembali ke Daftar Ujian
      </Button>

      <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a201b', mb: 2, textAlign: 'center' }}>
            {exam.title}
          </Typography>
          
          <Typography variant="body1" sx={{ color: '#5c6b5e', mb: 4, textAlign: 'center', px: { md: 4 } }}>
            {exam.description || 'Tidak ada deskripsi ujian.'}
          </Typography>

          <Divider sx={{ mb: 4 }} />

          <Grid container spacing={3} sx={{ mb: 5 }}>
            <Grid size={{ xs: 12, sm: 4 }} sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#78867a', mb: 1, fontWeight: 600, textTransform: 'uppercase' }}>
                Waktu Mulai
              </Typography>
              <Typography variant="h6" sx={{ color: '#789276', fontWeight: 700 }}>
                {startDate.toLocaleString('id-ID', { timeStyle: 'short', dateStyle: 'medium' })}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }} sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#78867a', mb: 1, fontWeight: 600, textTransform: 'uppercase' }}>
                Durasi
              </Typography>
              <Typography variant="h6" sx={{ color: '#789276', fontWeight: 700 }}>
                {exam.durationMinutes} Menit
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }} sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#78867a', mb: 1, fontWeight: 600, textTransform: 'uppercase' }}>
                Jumlah Soal
              </Typography>
              <Typography variant="h6" sx={{ color: '#789276', fontWeight: 700 }}>
                {exam._count.questions} Soal
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ bgcolor: '#faf9f6', p: 3, borderRadius: '12px', mb: 4, border: '1px solid #e8e6df' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#2c352d' }}>
              Perhatian:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#5c6b5e', fontSize: '0.875rem' }}>
              <li>Pastikan koneksi internet stabil sebelum memulai.</li>
              <li>Waktu (timer) akan langsung berjalan setelah Anda menekan tombol "Mulai Ujian".</li>
              <li>Ujian akan tersubmit otomatis apabila waktu telah habis.</li>
              <li>Dilarang melakukan kecurangan dalam bentuk apapun.</li>
            </ul>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              color="primary"
              disabled={!isReady || starting}
              onClick={handleStartExam}
              startIcon={<PlayArrowIcon />}
              sx={{ px: 6, py: 1.5, borderRadius: '12px', fontWeight: 700, fontSize: '1.1rem' }}
            >
              {starting ? 'Memproses...' : isReady ? 'Mulai Ujian Sekarang' : 'Ujian Belum Dimulai'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
