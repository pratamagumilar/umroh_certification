'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TablePagination,
  TableHead, TableRow, Paper, Chip, IconButton, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, TextField,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

interface ExamResult {
  id: string;
  pgScore: number;
  essayScore: number;
  finalStatus: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  exam: {
    id: string;
    title: string;
    passingGrade: number;
  };
}

const statusColors: Record<string, 'default' | 'success' | 'error'> = {
  PENDING: 'default',
  LULUS: 'success',
  TIDAK_LULUS: 'error',
};

function AdminResultsContent() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [formStatus, setFormStatus] = useState('PENDING');
  const [formLoading, setFormLoading] = useState(false);

  
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

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/results');
      const data = await res.json();
      setResults(data);
    } catch {
      setError('Gagal memuat data hasil ujian.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleEditOpen = (result: ExamResult) => {
    setSelectedResult(result);
    setFormStatus(result.finalStatus);
    setError('');
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedResult) return;
    setFormLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/results/${selectedResult.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalStatus: formStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Gagal mengubah status.');
      } else {
        setSuccess('Status berhasil diupdate!');
        setEditOpen(false);
        fetchResults();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Gagal mengupdate status.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a201b' }}>
          Monitoring Hasil Ujian
        </Typography>
        <Typography variant="body2" sx={{ color: '#78867a' }}>
          Pantau nilai peserta dan tentukan status kelulusan secara manual jika diperlukan.
        </Typography>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}
      {error && !editOpen && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#faf9f6' }}>
              <TableCell sx={{ fontWeight: 700 }}>Peserta</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ujian</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">PG</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Esai</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Total Nilai</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#a3aca4' }}>
                  Belum ada data hasil ujian.
                </TableCell>
              </TableRow>
            ) : (
              results.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((result) => {
                const totalScore = result.pgScore + result.essayScore;
                return (
                  <TableRow key={result.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>{result.user.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{result.user.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>{result.exam.title}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Passing Grade: {result.exam.passingGrade}</Typography>
                    </TableCell>
                    <TableCell align="center">{result.pgScore}</TableCell>
                    <TableCell align="center">{result.essayScore}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{totalScore}</TableCell>
                    <TableCell>
                      <Chip
                        label={result.finalStatus.replace('_', ' ')}
                        color={statusColors[result.finalStatus] || 'default'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => handleEditOpen(result)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
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

      {/* Edit Status Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Ubah Status Kelulusan</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {selectedResult && (
            <Box sx={{ mb: 3, p: 2, bgcolor: '#faf9f6', borderRadius: 2 }}>
              <Typography variant="body2">Peserta: <strong>{selectedResult.user.name}</strong></Typography>
              <Typography variant="body2">Ujian: <strong>{selectedResult.exam.title}</strong></Typography>
              <Typography variant="body2">Total Nilai: <strong>{selectedResult.pgScore + selectedResult.essayScore}</strong></Typography>
              <Typography variant="body2">Batas Kelulusan: <strong>{selectedResult.exam.passingGrade}</strong></Typography>
            </Box>
          )}
          <TextField
            label="Status Kelulusan"
            select
            fullWidth
            value={formStatus}
            onChange={(e) => setFormStatus(e.target.value)}
          >
            <MenuItem value="PENDING">Menunggu (Pending)</MenuItem>
            <MenuItem value="LULUS">Lulus</MenuItem>
            <MenuItem value="TIDAK_LULUS">Tidak Lulus</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleEdit} disabled={formLoading}>
            {formLoading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function AdminResultsPage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}>
      <AdminResultsContent />
    </Suspense>
  );
}
