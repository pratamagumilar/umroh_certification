'use client';

import React, { useEffect, useState, use } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button , TablePagination} from '@mui/material';
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

export default function AdminMonitorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = use(params);
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  
  // Pagination States
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const fetchMonitorData = async () => {
    try {
      const res = await fetch(`/api/admin/exams/${examId}/monitor`);
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

  const handleReset = async (userId: string) => {
    if (!confirm('Yakin ingin mereset sesi peserta ini? Semua nilai akan terhapus dan mereka harus mengulang dari awal.')) return;
    try {
      const res = await fetch(`/api/admin/exams/${examId}/monitor/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        alert('Sesi berhasil direset.');
        fetchMonitorData();
      } else {
        const err = await res.json();
        alert(err.message || 'Gagal mereset sesi.');
      }
    } catch {
      alert('Terjadi kesalahan.');
    }
  };

  const handleAddTime = async (userId: string) => {
    const min = prompt('Berapa menit waktu yang ingin ditambahkan? (Misal: 10)');
    if (!min) return;
    const minutes = parseInt(min);
    if (isNaN(minutes) || minutes <= 0) {
      alert('Masukkan angka menit yang valid.');
      return;
    }
    
    try {
      const res = await fetch(`/api/admin/exams/${examId}/monitor/add-time`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, minutes })
      });
      if (res.ok) {
        alert(`Berhasil menambahkan ${minutes} menit.`);
        fetchMonitorData();
      } else {
        const err = await res.json();
        alert(err.message || 'Gagal menambahkan waktu.');
      }
    } catch {
      alert('Terjadi kesalahan.');
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
        <Button component={Link} href="/admin/exams" startIcon={<ArrowBackIcon />} sx={{ mb: 3 }}>
          Kembali ke Daftar Ujian
        </Button>
        <Alert severity="error">{error || 'Data tidak ditemukan'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button component={Link} href="/admin/exams" startIcon={<ArrowBackIcon />} sx={{ width: 'fit-content', mb: 1, color: '#78867a' }}>
          Kembali
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a201b', letterSpacing: '-0.02em' }}>
            Monitoring Ujian
          </Typography>
          <Chip 
            label={data.exam.isActive ? 'AKTIF' : 'SELESAI'} 
            color={data.exam.isActive ? 'success' : 'default'} 
            size="small" 
            sx={{ fontWeight: 700 }}
          />
        </Box>
        <Typography variant="h6" sx={{ color: '#425045', fontWeight: 600 }}>
          {data.exam.title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#78867a' }}>
          Halaman ini diperbarui otomatis setiap 10 detik.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e8e6df' }}>
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#faf9f6' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#5c6b5e' }}>Peserta</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#5c6b5e' }}>Waktu Mulai</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#5c6b5e' }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#5c6b5e' }}>Skor PG</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#5c6b5e' }}>Total Skor</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#5c6b5e' }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.participants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#78867a' }}>
                    Belum ada peserta yang memulai ujian ini.
                  </TableCell>
                </TableRow>
              ) : (
                data.participants.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c352d' }}>{p.name}</Typography>
                      <Typography variant="caption" sx={{ color: '#78867a' }}>{p.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#425045' }}>
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
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a201b' }}>
                        {p.pgScore !== null ? Math.round(p.pgScore) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 800, color: p.status === 'Selesai' ? '#15803d' : '#a3aca4' }}>
                        {p.totalScore !== null ? Math.round(p.totalScore) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="error" 
                          onClick={() => handleReset(p.id)}
                        >
                          Reset
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="primary" 
                          onClick={() => handleAddTime(p.id)}
                          disabled={p.status === 'Selesai'}
                        >
                          +10M
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={-1}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Baris per halaman:"
            labelDisplayedRows={({ from, to }) => `${from}-${to}`}
          />
        </TableContainer>
      </Card>
    </Box>
  );
}
