'use client';

import React, { useEffect, useState, use } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GradingIcon from '@mui/icons-material/Grading';

interface Participant {
  id: string;
  name: string;
  email: string;
  pendingEssaysCount: number;
  pgScore: number;
}

interface GradingExamData {
  exam: {
    title: string;
  };
  participants: Participant[];
}

export default function PengawasGradingParticipantsPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params);
  const [data, setData] = useState<GradingExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const res = await fetch(`/api/pengawas/grading/${examId}`);
        const result = await res.json();
        if (res.ok) {
          setData(result);
        } else {
          setError(result.message || 'Gagal memuat peserta');
        }
      } catch (err) {
        setError('Terjadi kesalahan jaringan');
      } finally {
        setLoading(false);
      }
    };
    fetchParticipants();
  }, [examId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box>
        <Button component={Link} href="/pengawas/grading" startIcon={<ArrowBackIcon />} sx={{ mb: 3 }}>
          Kembali ke Daftar Penilaian
        </Button>
        <Alert severity="error">{error || 'Data tidak ditemukan'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button component={Link} href="/pengawas/grading" startIcon={<ArrowBackIcon />} sx={{ width: 'fit-content', mb: 1, color: '#78867a' }}>
          Kembali
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a201b', letterSpacing: '-0.02em' }}>
          Peserta yang Perlu Dinilai
        </Typography>
        <Typography variant="h6" sx={{ color: '#d4b886', fontWeight: 600 }}>
          {data.exam.title}
        </Typography>
      </Box>

      <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e8e6df' }}>
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#faf9f6' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#5c6b5e' }}>Peserta</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#5c6b5e' }}>Skor PG</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#5c6b5e' }}>Esai Pending</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#5c6b5e' }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.participants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#78867a' }}>
                    Semua peserta telah dinilai esainya.
                  </TableCell>
                </TableRow>
              ) : (
                data.participants.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c352d' }}>{p.name}</Typography>
                      <Typography variant="caption" sx={{ color: '#78867a' }}>{p.email}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a201b' }}>
                        {Math.round(p.pgScore)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#d4b886' }}>
                        {p.pendingEssaysCount}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        component={Link}
                        href={`/pengawas/grading/${examId}/${p.id}`}
                        variant="outlined"
                        color="secondary"
                        size="small"
                        startIcon={<GradingIcon />}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                      >
                        Nilai
                      </Button>
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
