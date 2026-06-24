'use client';

import React, { useEffect, useState, use } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button } from '@mui/material';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Participant {
  id: string;
  name: string;
  email: string;
  scanTime: string;
  status: string;
  pgScore: number | null;
  totalScore: number | null;
}

interface MonitorData {
  exam: {
    title: string;
    isActive: boolean;
  };
  participants: Participant[];
}

export default function PengawasMonitorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = use(params);
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMonitorData = async () => {
    try {
      const res = await fetch(`/api/pengawas/exams/${examId}/monitor`);
      const result = await res.json();
      if (res.ok) {
        setData(result);
      } else {
        setError(result.message || 'Gagal memuat data');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitorData();
    // Auto refresh every 10 seconds
    const interval = setInterval(() => {
      fetchMonitorData();
    }, 10000);
    return () => clearInterval(interval);
  }, [examId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box>
        <Button component={Link} href="/pengawas/exams" startIcon={<ArrowBackIcon />} sx={{ mb: 3 }}>
          Kembali ke Daftar Ujian
        </Button>
        <Alert severity="error">{error || 'Data tidak ditemukan'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button component={Link} href="/pengawas/exams" startIcon={<ArrowBackIcon />} sx={{ width: 'fit-content', mb: 1, color: '#64748b' }}>
          Kembali
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Monitoring Ujian
          </Typography>
          <Chip 
            label={data.exam.isActive ? 'AKTIF' : 'SELESAI'} 
            color={data.exam.isActive ? 'success' : 'default'} 
            size="small" 
            sx={{ fontWeight: 700 }}
          />
        </Box>
        <Typography variant="h6" sx={{ color: '#334155', fontWeight: 600 }}>
          {data.exam.title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Halaman ini diperbarui otomatis setiap 10 detik.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Peserta</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Waktu Mulai</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>Skor PG</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>Total Skor</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.participants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#64748b' }}>
                    Belum ada peserta yang memulai ujian ini.
                  </TableCell>
                </TableRow>
              ) : (
                data.participants.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>{p.name}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>{p.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#334155' }}>
                        {format(new Date(p.scanTime), "HH:mm:ss", { locale: id })} WIB
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={p.status} 
                        size="small"
                        color={
                          p.status === 'Mengerjakan' ? 'primary' :
                          p.status === 'Selesai' ? 'success' : 'warning'
                        }
                        sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        {p.pgScore !== null ? Math.round(p.pgScore) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 800, color: p.status === 'Selesai' ? '#15803d' : '#94a3b8' }}>
                        {p.totalScore !== null ? Math.round(p.totalScore) : '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
