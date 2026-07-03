'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Chip, CircularProgress, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AssessmentIcon from '@mui/icons-material/Assessment';

interface Exam {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  durationMinutes: number;
  _count: { questions: number };
}

export default function ExamsListPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await fetch('/api/exams/active');
        const data = await res.json();
        if (res.ok) {
          setExams(data);
        } else {
          setError(data.message || 'Gagal memuat ujian aktif');
        }
      } catch {
        setError('Terjadi kesalahan jaringan');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
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
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#1a201b' }}>
        Daftar Ujian
      </Typography>
      <Typography variant="body1" sx={{ color: '#78867a', mb: 4 }}>
        Pilih ujian yang tersedia untuk Anda kerjakan.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {exams.length === 0 ? (
        <Card sx={{ borderRadius: '16px', boxShadow: 'none', border: '1px solid #e8e6df', bgcolor: '#faf9f6' }}>
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              Tidak Ada Ujian Aktif
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Saat ini belum ada ujian yang ditugaskan kepada Anda atau belum masuk waktunya.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {exams.map((exam) => {
            const startDate = new Date(exam.startTime);
            const isReady = startDate <= new Date(); // Apakah sudah waktunya?

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={exam.id}>
                <Card sx={{ 
                  borderRadius: '16px', 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }
                }}>
                  <CardContent sx={{ p: 3, flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#789276', mb: 1, lineHeight: 1.3 }}>
                      {exam.title}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ color: '#78867a', mb: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {exam.description || 'Tidak ada deskripsi'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#5c6b5e' }}>
                        <ScheduleIcon fontSize="small" />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {startDate.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#5c6b5e' }}>
                        <ScheduleIcon fontSize="small" />
                        <Typography variant="body2">Durasi: {exam.durationMinutes} Menit</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#5c6b5e' }}>
                        <AssessmentIcon fontSize="small" />
                        <Typography variant="body2">Jumlah: {exam._count.questions} Soal</Typography>
                      </Box>
                    </Box>

                    {isReady ? (
                      <Chip label="Sedang Berlangsung" color="success" size="small" sx={{ fontWeight: 600 }} />
                    ) : (
                      <Chip label="Akan Datang" color="warning" size="small" sx={{ fontWeight: 600 }} />
                    )}
                  </CardContent>
                  <Box sx={{ p: 3, pt: 0 }}>
                    <Button 
                      variant="contained" 
                      color="primary"
                      fullWidth
                      startIcon={<PlayArrowIcon />}
                      onClick={() => router.push(`/exams/${exam.id}`)}
                      sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, py: 1.5 }}
                    >
                      Buka Ujian
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
