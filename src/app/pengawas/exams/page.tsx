'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Alert, Button, Chip } from '@mui/material';
import Link from 'next/link';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Exam {
  id: string;
  title: string;
  startTime: string;
  durationMinutes: number;
  isActive: boolean;
  _count: {
    attendances: number;
  };
}

export default function PengawasExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await fetch('/api/pengawas/exams');
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, letterSpacing: '-0.02em' }}>
            Pengawasan Ujian
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Pilih ujian untuk memonitor kehadiran dan status peserta.
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {exams.length === 0 && !error && (
        <Alert severity="info" sx={{ borderRadius: '12px' }}>Belum ada ujian yang tersedia.</Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {exams.map((exam) => (
          <Card key={exam.id} sx={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {exam.title}
                  </Typography>
                  <Chip 
                    label={exam.isActive ? 'AKTIF' : 'SELESAI'} 
                    size="small" 
                    color={exam.isActive ? 'success' : 'default'}
                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                  Waktu: {format(new Date(exam.startTime), "d MMMM yyyy, HH:mm", { locale: id })} WIB
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Durasi: {exam.durationMinutes} Menit &nbsp;|&nbsp; Peserta Hadir: {exam._count.attendances}
                </Typography>
              </Box>
              
              <Button
                component={Link}
                href={`/pengawas/exams/${exam.id}/monitor`}
                variant="contained"
                color="primary"
                startIcon={<VisibilityIcon />}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 3 }}
              >
                Monitor
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
