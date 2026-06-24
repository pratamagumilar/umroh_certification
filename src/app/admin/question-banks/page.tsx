'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useRouter } from 'next/navigation';

interface QuestionBank {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  _count: { questions: number };
}

export default function AdminQuestionBanksPage() {
  const router = useRouter();
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const fetchBanks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/question-banks');
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Gagal memuat data bank soal.');
        setBanks([]);
      } else {
        setBanks(data);
      }
    } catch {
      setError('Gagal memuat data bank soal.');
      setBanks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const resetForm = () => {
    setFormTitle('');
    setFormDesc('');
    setError('');
  };

  const handleCreate = async () => {
    setFormLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/question-banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDesc,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
      } else {
        setSuccess('Bank Soal berhasil dibuat!');
        setCreateOpen(false);
        resetForm();
        fetchBanks();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Gagal membuat bank soal.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditOpen = (bank: QuestionBank) => {
    setSelectedBank(bank);
    setFormTitle(bank.title);
    setFormDesc(bank.description || '');
    setError('');
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedBank) return;
    setFormLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/question-banks/${selectedBank.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDesc,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
      } else {
        setSuccess('Bank Soal berhasil diupdate!');
        setEditOpen(false);
        resetForm();
        fetchBanks();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Gagal mengupdate bank soal.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBank) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/question-banks/${selectedBank.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
      } else {
        setSuccess('Bank Soal berhasil dihapus!');
        setDeleteOpen(false);
        setSelectedBank(null);
        fetchBanks();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Gagal menghapus bank soal.');
    } finally {
      setFormLoading(false);
    }
  };

  const renderFormFields = () => (
    <>
      <TextField label="Nama Bank Soal" fullWidth value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required sx={{ mb: 2 }} />
      <TextField label="Deskripsi (opsional)" fullWidth multiline rows={3} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} sx={{ mb: 2 }} />
    </>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Bank Soal (Master)
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Kelola kumpulan soal yang dapat digunakan ulang di berbagai ujian.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { resetForm(); setCreateOpen(true); }}
          sx={{ borderRadius: '12px' }}
        >
          Buat Bank Soal
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 700 }}>Nama Bank Soal</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Deskripsi</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Jumlah Soal</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : banks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                  Belum ada bank soal.
                </TableCell>
              </TableRow>
            ) : (
              banks.map((bank) => (
                <TableRow key={bank.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{bank.title}</TableCell>
                  <TableCell>{bank.description || '-'}</TableCell>
                  <TableCell>
                    <Chip label={`${bank._count.questions} soal`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="info" onClick={() => router.push(`/admin/question-banks/${bank.id}`)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="primary" onClick={() => handleEditOpen(bank)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => { setSelectedBank(bank); setDeleteOpen(true); }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Buat Bank Soal Baru</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {renderFormFields()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleCreate} disabled={formLoading}>
            {formLoading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Bank Soal</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {renderFormFields()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleEdit} disabled={formLoading}>
            {formLoading ? 'Menyimpan...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Konfirmasi Hapus</DialogTitle>
        <DialogContent>
          <Typography>
            Yakin ingin menghapus <strong>{selectedBank?.title}</strong>?
            Semua soal di dalam bank soal ini akan ikut terhapus dan hilang dari ujian yang menggunakannya.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Batal</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={formLoading}>
            {formLoading ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
