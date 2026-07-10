'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, Paper, Switch, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface Course {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    sessions: number;
    enrollments: number;
  };
}

export default function PanitiaCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/panitia/courses');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memuat course.');
      setCourses(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat course.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setSelectedCourse(null);
    setError('');
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCreate = async () => {
    setFormLoading(true);
    setError('');
    try {
      const res = await fetch('/api/panitia/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formTitle, description: formDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal membuat course.');
      setCreateOpen(false);
      resetForm();
      showSuccess('Course berhasil dibuat.');
      fetchCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat course.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditOpen = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCourse(course);
    setFormTitle(course.title);
    setFormDescription(course.description || '');
    setError('');
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedCourse) return;
    setFormLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/panitia/courses/${selectedCourse.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formTitle, description: formDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengupdate course.');
      setEditOpen(false);
      resetForm();
      showSuccess('Course berhasil diupdate.');
      fetchCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengupdate course.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    setError('');
    try {
      const res = await fetch(`/api/panitia/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !course.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengubah status course.');
      fetchCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah status course.');
    }
  };

  const handleDeleteOpen = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCourse(course);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCourse) return;
    setFormLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/panitia/courses/${selectedCourse.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menghapus course.');
      setDeleteOpen(false);
      resetForm();
      showSuccess('Course berhasil dihapus.');
      fetchCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus course.');
    } finally {
      setFormLoading(false);
    }
  };

  const renderCourseForm = () => (
    <>
      <TextField
        label="Nama Course"
        fullWidth
        required
        value={formTitle}
        onChange={(event) => setFormTitle(event.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        label="Deskripsi"
        fullWidth
        multiline
        minRows={3}
        value={formDescription}
        onChange={(event) => setFormDescription(event.target.value)}
      />
    </>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a201b' }}>
            Course Pembelajaran (Panitia)
          </Typography>
          <Typography variant="body2" sx={{ color: '#78867a' }}>
            Kelola materi pembelajaran, sesi, dan lakukan pendaftaran peserta.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setCreateOpen(true);
          }}
          sx={{ borderRadius: '12px' }}
        >
          Buat Course Baru
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #e8e6df', boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#faf9f6' }}>
                <TableCell sx={{ fontWeight: 700 }}>Course</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Materi</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Peserta</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Dibuat</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    Belum ada course.
                  </TableCell>
                </TableRow>
              ) : courses.map((course) => (
                <TableRow
                  key={course.id}
                  hover
                  onClick={() => router.push(`/panitia/courses/${course.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>{course.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {course.description || 'Tidak ada deskripsi'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={course.isActive ? 'Aktif' : 'Nonaktif'}
                      color={course.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">{course._count.sessions}</TableCell>
                  <TableCell align="center">{course._count.enrollments}</TableCell>
                  <TableCell>{new Date(course.createdAt).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell align="right">
                    <Switch checked={course.isActive} onClick={(e) => handleToggleActive(course, e)} color="success" />
                    <IconButton color="primary" onClick={(e) => handleEditOpen(course, e)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={(e) => handleDeleteOpen(course, e)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog Create */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Buat Course Baru</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>{renderCourseForm()}</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleCreate} disabled={formLoading || !formTitle.trim()}>
            Simpan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Edit */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Course</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>{renderCourseForm()}</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleEdit} disabled={formLoading || !formTitle.trim()}>
            Simpan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Delete */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Hapus Course</DialogTitle>
        <DialogContent>
          <Typography>
            Yakin ingin menghapus course <strong>{selectedCourse?.title}</strong>? Semua sesi dan enrollment akan ikut terhapus.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Batal</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={formLoading}>
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
