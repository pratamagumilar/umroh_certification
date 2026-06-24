'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Chip, CircularProgress, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import QuizIcon from '@mui/icons-material/Quiz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface Exam {
  id: string;
  title: string;
  startTime: string;
  durationMinutes: number;
}

interface Result {
  id: string;
  exam: { title: string };
  pgScore: number;
  essayScore: number;
  finalStatus: string;
  createdAt: string;
}

interface Certificate {
  id: string;
  exam: { title: string };
  pdfUrl: string;
}

interface DashboardData {
  activeExams: Exam[];
  results: Result[];
  certificates: Certificate[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard');
        const resData = await res.json();
        if (res.ok) {
          setData(resData);
        } else {
          setError(resData.message || 'Gagal memuat dashboard');
        }
      } catch {
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

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 4, color: '#0f172a' }}>
        Dashboard Peserta
      </Typography>

      <Grid container spacing={4}>
        {/* Active Exams */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}>
            Ujian Tersedia
          </Typography>
          
          {data?.activeExams.length === 0 ? (
            <Card sx={{ borderRadius: '12px', boxShadow: 'none', border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
              <CardContent sx={{ py: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">Belum ada ujian yang tersedia untuk Anda saat ini.</Typography>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {data?.activeExams.map((exam) => (
                <Card key={exam.id} sx={{ borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0ea5e9', mb: 0.5 }}>
                        {exam.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, color: '#64748b' }}>
                        <Typography variant="body2">⏰ {exam.durationMinutes} Menit</Typography>
                        <Typography variant="body2">📅 {new Date(exam.startTime).toLocaleString('id-ID')}</Typography>
                      </Box>
                    </Box>
                    <Button 
                      variant="contained" 
                      color="primary"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => router.push(`/exams/${exam.id}`)}
                      sx={{ borderRadius: '8px', textTransform: 'none' }}
                    >
                      Mulai Ujian
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Grid>

        {/* Certificates & Results */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}>
            Sertifikat Saya
          </Typography>
          
          {data?.certificates.length === 0 ? (
            <Card sx={{ borderRadius: '12px', boxShadow: 'none', border: '1px solid #e2e8f0', bgcolor: '#f8fafc', mb: 4 }}>
              <CardContent sx={{ py: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">Belum ada sertifikat.</Typography>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
              {data?.certificates.map((cert) => (
                <Card key={cert.id} sx={{ borderRadius: '12px', bgcolor: '#ecfdf5', border: '1px solid #10b981' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#047857', mb: 1 }}>
                      {cert.exam.title}
                    </Typography>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      color="success" 
                      startIcon={<DownloadIcon />}
                      fullWidth
                      onClick={() => window.open(cert.pdfUrl, '_blank')}
                      sx={{ borderRadius: '8px', textTransform: 'none', bgcolor: '#ffffff' }}
                    >
                      Download
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#1e293b' }}>
            Riwayat Ujian
          </Typography>

          {data?.results.length === 0 ? (
            <Card sx={{ borderRadius: '12px', boxShadow: 'none', border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
              <CardContent sx={{ py: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">Belum ada riwayat ujian.</Typography>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {data?.results.map((res) => (
                <Card key={res.id} sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      {res.exam.title}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Skor PG: <strong>{res.pgScore}</strong>
                      </Typography>
                      <Chip 
                        label={res.finalStatus} 
                        size="small"
                        color={res.finalStatus === 'LULUS' ? 'success' : res.finalStatus === 'TIDAK_LULUS' ? 'error' : 'warning'}
                        sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
