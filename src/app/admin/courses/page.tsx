'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { toast } from 'react-hot-toast';

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

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');

  
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

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/courses');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memuat course.');
      setCourses(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat course.');
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
  };

  const handleCreate = async () => {
    setFormLoading(true);
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formTitle, description: formDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal membuat course.');
      setCreateOpen(false);
      resetForm();
      toast.success('Course berhasil dibuat.');
      fetchCourses();
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat course.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditOpen = (course: Course) => {
    setSelectedCourse(course);
    setFormTitle(course.title);
    setFormDescription(course.description || '');
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedCourse) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${selectedCourse.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formTitle, description: formDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengupdate course.');
      setEditOpen(false);
      resetForm();
      toast.success('Course berhasil diupdate.');
      fetchCourses();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengupdate course.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (course: Course) => {
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !course.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengubah status course.');
      fetchCourses();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status course.');
    }
  };

  const handleDelete = async () => {
    if (!selectedCourse) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${selectedCourse.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menghapus course.');
      setDeleteOpen(false);
      resetForm();
      toast.success('Course berhasil dihapus.');
      fetchCourses();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus course.');
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
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a201b' }}>
            Course
          </Typography>
          <Typography variant="body2" sx={{ color: '#78867a' }}>
            Kelola course pembelajaran, status aktif, jumlah materi, dan peserta.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setCreateOpen(true);
          }}
        >
          Buat Course
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Course</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Materi</TableCell>
                <TableCell align="center">Peserta</TableCell>
                <TableCell>Dibuat</TableCell>
                <TableCell align="right">Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    Belum ada course.
                  </TableCell>
                </TableRow>
              ) : courses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((course) => (
                <TableRow key={course.id} hover>
                  <TableCell>
                    <Typography 
                      sx={{ fontWeight: 700, color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                      onClick={() => window.location.href = `/admin/courses/${course.id}`}
                    >
                      {course.title}
                    </Typography>
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
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={() => window.location.href = `/admin/courses/${course.id}`}
                      sx={{ mr: 1, borderRadius: '8px' }}
                    >
                      Kelola Sesi
                    </Button>
                    <Switch checked={course.isActive} onChange={() => handleToggleActive(course)} />
                    <IconButton color="primary" onClick={() => handleEditOpen(course)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => {
                        setSelectedCourse(course);
                        setDeleteOpen(true);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
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
      )}

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Buat Course</DialogTitle>
        <DialogContent>{renderCourseForm()}</DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleCreate} disabled={formLoading || !formTitle.trim()}>
            {formLoading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Course</DialogTitle>
        <DialogContent>{renderCourseForm()}</DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleEdit} disabled={formLoading || !formTitle.trim()}>
            {formLoading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Hapus Course</DialogTitle>
        <DialogContent>
          <Typography>
            Yakin ingin menghapus course <strong>{selectedCourse?.title}</strong>? Materi dan enrollment terkait ikut terhapus.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Batal</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={formLoading}>
            Hapus
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
