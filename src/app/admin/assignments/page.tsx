'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert, CircularProgress,
  Switch
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

interface Assignment {
  id: string;
  title: string;
  prompt: string;
  maxScore: number;
  isActive: boolean;
  createdAt: string;
  createdBy: { name: string; email: string };
  _count: { courseSessions: number };
}

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [open, setOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [maxScore, setMaxScore] = useState('100');

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/assignments');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memuat tugas');
      setAssignments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleOpenCreate = () => {
    setEditId(null);
    setTitle('');
    setPrompt('');
    setMaxScore('100');
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    
    const payload = { title, prompt, maxScore };
    
    try {
      const url = editId ? `/api/admin/assignments/${editId}` : '/api/admin/assignments';
      const method = editId ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message);
      
      setSuccess(editId ? 'Tugas berhasil diubah' : 'Tugas berhasil dibuat');
      setOpen(false);
      fetchAssignments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a201b' }}>
          Master Data Tugas
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate} sx={{ borderRadius: '12px' }}>
          Buat Tugas Baru
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #e8e6df', boxShadow: 'none' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#faf9f6' }}>
              <TableCell sx={{ fontWeight: 700 }}>Judul Tugas</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Max Score</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Dibuat Oleh</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Digunakan Di</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            ) : assignments.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center">Belum ada tugas.</TableCell></TableRow>
            ) : (
              assignments.map((assignment) => (
                <TableRow key={assignment.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>{assignment.title}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {assignment.prompt}
                    </Typography>
                  </TableCell>
                  <TableCell>{assignment.maxScore}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{assignment.createdBy.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={`${assignment._count.courseSessions} Sesi`} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    {/* Add edit/delete handlers if needed, omitted for brevity in MVP */}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Form */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSave}>
          <DialogTitle sx={{ fontWeight: 700 }}>{editId ? 'Edit Tugas' : 'Buat Tugas Baru'}</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="Judul Tugas" value={title} onChange={(e) => setTitle(e.target.value)} margin="normal" required />
            <TextField fullWidth label="Pertanyaan / Prompt Esai" value={prompt} onChange={(e) => setPrompt(e.target.value)} margin="normal" required multiline minRows={4} />
            <TextField fullWidth label="Nilai Maksimal (Max Score)" type="number" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} margin="normal" required />
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setOpen(false)} disabled={formLoading}>Batal</Button>
            <Button type="submit" variant="contained" disabled={formLoading}>
              {formLoading ? <CircularProgress size={24} /> : 'Simpan'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
