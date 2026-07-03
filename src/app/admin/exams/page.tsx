'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useRouter } from 'next/navigation';

interface Exam {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
  _count: { questions: number };
}

export default function AdminExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formDuration, setFormDuration] = useState('60');

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/exams');
      const data = await res.json();
      setExams(data);
    } catch {
      setError('Gagal memuat data ujian.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const resetForm = () => {
    setFormTitle('');
    setFormDesc('');
    setFormStartTime('');
    setFormDuration('60');
    setError('');
  };

  const handleCreate = async () => {
    setFormLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDesc,
          startTime: formStartTime,
          durationMinutes: formDuration,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
      } else {
        setSuccess('Ujian berhasil dibuat!');
        setCreateOpen(false);
        resetForm();
        fetchExams();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Gagal membuat ujian.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditOpen = (exam: Exam) => {
    setSelectedExam(exam);
    setFormTitle(exam.title);
    setFormDesc(exam.description || '');
    // Format datetime for input
    setFormStartTime(new Date(exam.startTime).toISOString().slice(0, 16));
    setFormDuration(exam.durationMinutes.toString());
    setError('');
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedExam) return;
    setFormLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/exams/${selectedExam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDesc,
          startTime: formStartTime,
          durationMinutes: formDuration,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
      } else {
        setSuccess('Ujian berhasil diupdate!');
        setEditOpen(false);
        resetForm();
        fetchExams();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Gagal mengupdate ujian.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (exam: Exam) => {
    try {
      await fetch(`/api/admin/exams/${exam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !exam.isActive }),
      });
      fetchExams();
    } catch {
      setError('Gagal mengubah status ujian.');
    }
  };

  const handleDelete = async () => {
    if (!selectedExam) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/exams/${selectedExam.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
      } else {
        setSuccess('Ujian berhasil dihapus!');
        setDeleteOpen(false);
        setSelectedExam(null);
        fetchExams();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch {
      setError('Gagal menghapus ujian.');
    } finally {
      setFormLoading(false);
    }
  };

  const renderExamFormFields = () => (
    <>
      <TextField label="Judul Ujian" fullWidth value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required sx={{ mb: 2 }} />
      <TextField label="Deskripsi (opsional)" fullWidth multiline rows={3} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} sx={{ mb: 2 }} />
      <TextField
        label="Waktu Mulai"
        type="datetime-local"
        fullWidth
        value={formStartTime}
        onChange={(e) => setFormStartTime(e.target.value)}
        required
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ mb: 2 }}
      />
      <TextField
        label="Durasi (menit)"
        type="number"
        fullWidth
        value={formDuration}
        onChange={(e) => setFormDuration(e.target.value)}
        required
      />
    </>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a201b' }}>
            Kelola Ujian
          </Typography>
          <Typography variant="body2" sx={{ color: '#78867a' }}>
            Buat dan kelola jadwal ujian sertifikasi.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { resetForm(); setCreateOpen(true); }}
          sx={{ borderRadius: '12px' }}
        >
          Buat Ujian
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#faf9f6' }}>
              <TableCell sx={{ fontWeight: 700 }}>Judul</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Waktu Mulai</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Durasi</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Soal</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : exams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#a3aca4' }}>
                  Belum ada ujian.
                </TableCell>
              </TableRow>
            ) : (
              exams.map((exam) => (
                <TableRow key={exam.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{exam.title}</TableCell>
                  <TableCell>
                    {new Date(exam.startTime).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>{exam.durationMinutes} menit</TableCell>
                  <TableCell>
                    <Chip label={`${exam._count.questions} soal`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={exam.isActive}
                      onChange={() => handleToggleActive(exam)}
                      size="small"
                      color="success"
                    />
                    <Typography variant="caption" sx={{ ml: 0.5, color: exam.isActive ? '#10b981' : '#a3aca4' }}>
                      {exam.isActive ? 'Aktif' : 'Nonaktif'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="info" onClick={() => router.push(`/admin/exams/${exam.id}`)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="primary" onClick={() => handleEditOpen(exam)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => { setSelectedExam(exam); setDeleteOpen(true); }}>
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
        <DialogTitle sx={{ fontWeight: 700 }}>Buat Ujian Baru</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {renderExamFormFields()}
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
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Ujian</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {renderExamFormFields()}
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
            Yakin ingin menghapus ujian <strong>{selectedExam?.title}</strong>?
            Semua soal dalam ujian ini juga akan terhapus.
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
