'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Chip, CircularProgress, Alert, Avatar } from '@mui/material';
import { useRouter } from 'next/navigation';
import QuizRoundedIcon from '@mui/icons-material/QuizRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import { useSession } from 'next-auth/react';

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
  const { data: session } = useSession();
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={48} thickness={4} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2, borderRadius: '12px' }}>{error}</Alert>;
  }

  return (
    <Box sx={{ pb: 6 }}>
      
      {/* Welcome Banner */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        borderRadius: '24px',
        p: { xs: 3, md: 5 },
        color: 'white',
        mb: 4,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(5, 150, 105, 0.2), 0 8px 10px -6px rgba(5, 150, 105, 0.1)'
      }}>
        {/* Abstract shapes for premium feel */}
        <Box sx={{
          position: 'absolute', top: -50, right: -50, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(24px)'
        }} />
        <Box sx={{
          position: 'absolute', bottom: -50, right: 100, width: 150, height: 150,
          borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(20px)'
        }} />

        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'rgba(255,255,255,0.2)', fontSize: '2rem', border: '2px solid rgba(255,255,255,0.5)' }}>
            {session?.user?.name?.charAt(0).toUpperCase() || '👋'}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
              Selamat datang, {session?.user?.name?.split(' ')[0] || 'Peserta'}!
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: '600px' }}>
              Lanjutkan proses belajar Anda untuk meraih sertifikasi Umroh. Pantau materi dan ujian Anda di sini.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { title: 'Ujian Aktif', value: data?.activeExams.length || 0, icon: <QuizRoundedIcon />, color: '#0ea5e9' },
          { title: 'Sertifikat', value: data?.certificates.length || 0, icon: <EmojiEventsRoundedIcon />, color: '#f59e0b' },
          { title: 'Ujian Selesai', value: data?.results.length || 0, icon: <SchoolRoundedIcon />, color: '#10b981' }
        ].map((stat, i) => (
          <Grid size={{ xs: 12, sm: 4 }} key={i}>
            <Card sx={{ 
              borderRadius: '20px', 
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              display: 'flex', alignItems: 'center', p: 3, gap: 2,
              '&:hover': { transform: 'translateY(-2px)' }
            }}>
              <Box sx={{ 
                width: 56, height: 56, borderRadius: '16px', 
                bgcolor: `${stat.color}15`, color: stat.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                '& svg': { fontSize: 32 }
              }}>
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {stat.title}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Active Exams */}
        <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Ujian Tersedia
            </Typography>
          </Box>
          
          {data?.activeExams.length === 0 ? (
            <Card sx={{ borderRadius: '20px', border: '1px dashed #cbd5e1', bgcolor: 'transparent', boxShadow: 'none' }}>
              <CardContent sx={{ py: 6, textAlign: 'center' }}>
                <Box sx={{ color: '#94a3b8', mb: 2 }}><QuizRoundedIcon sx={{ fontSize: 48 }} /></Box>
                <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>Belum Ada Ujian</Typography>
                <Typography variant="body2" color="text.secondary">Tidak ada ujian yang sedang berlangsung atau ditugaskan kepada Anda.</Typography>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {data?.activeExams.map((exam) => (
                <Card key={exam.id} sx={{ borderRadius: '20px', overflow: 'visible' }}>
                  <CardContent sx={{ p: '0 !important' }}>
                    <Grid container>
                      <Grid size={{ xs: 12, sm: 8 }} sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', mb: 1 }}>
                          {exam.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 3, color: 'text.secondary', mt: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>⏱ {exam.durationMinutes} Menit</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>📅 {new Date(exam.startTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }} sx={{ 
                        bgcolor: 'rgba(5, 150, 105, 0.04)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3,
                        borderLeft: { sm: '1px solid #f1f5f9' },
                        borderTop: { xs: '1px solid #f1f5f9', sm: 'none' }
                      }}>
                        <Button 
                          variant="contained" 
                          color="primary"
                          endIcon={<PlayArrowRoundedIcon />}
                          onClick={() => router.push(`/exams/${exam.id}`)}
                          sx={{ borderRadius: '12px', textTransform: 'none', px: 3, py: 1.2 }}
                          fullWidth
                        >
                          Mulai Ujian
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Grid>

        {/* Certificates & Results side panel */}
        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          
          {/* Certificates */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
              Sertifikat Terbaru
            </Typography>
            
            {data?.certificates.length === 0 ? (
              <Card sx={{ borderRadius: '20px', border: '1px dashed #cbd5e1', bgcolor: 'transparent', boxShadow: 'none' }}>
                <CardContent sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Belum ada sertifikat.</Typography>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {data?.certificates.slice(0,2).map((cert) => (
                  <Card key={cert.id} sx={{ 
                    borderRadius: '20px', 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white'
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <EmojiEventsRoundedIcon sx={{ fontSize: 28, color: '#fbbf24' }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                          {cert.exam.title}
                        </Typography>
                      </Box>
                      <Button 
                        variant="contained" 
                        startIcon={<DownloadRoundedIcon />}
                        fullWidth
                        onClick={() => window.open(cert.pdfUrl, '_blank')}
                        sx={{ 
                          bgcolor: 'white', color: '#059669', 
                          '&:hover': { bgcolor: '#f8fafc' },
                          fontWeight: 700
                        }}
                      >
                        Unduh Sertifikat
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>

          {/* Results */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
              Riwayat Ujian
            </Typography>

            {data?.results.length === 0 ? (
              <Card sx={{ borderRadius: '20px', border: '1px dashed #cbd5e1', bgcolor: 'transparent', boxShadow: 'none' }}>
                <CardContent sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Belum ada riwayat ujian.</Typography>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {data?.results.map((res) => (
                  <Card key={res.id} sx={{ borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
                        {res.exam.title}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ 
                            px: 1.5, py: 0.5, borderRadius: '8px', 
                            bgcolor: 'rgba(15, 23, 42, 0.04)', 
                            fontWeight: 700, fontSize: '0.875rem' 
                          }}>
                            Skor: {res.pgScore}
                          </Box>
                        </Box>
                        <Chip 
                          label={res.finalStatus} 
                          size="small"
                          color={res.finalStatus === 'LULUS' ? 'success' : res.finalStatus === 'TIDAK_LULUS' ? 'error' : 'warning'}
                          sx={{ fontWeight: 700, px: 1, borderRadius: '8px' }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>

        </Grid>
      </Grid>
    </Box>
  );
}
