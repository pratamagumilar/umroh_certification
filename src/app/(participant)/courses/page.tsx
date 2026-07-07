'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Grid, Card, CardContent, Button,
  CircularProgress, Alert, Paper, LinearProgress
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface Course {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  sessions: { id: string }[];
}

export default function PesertaCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/courses');
      if (!res.ok) throw new Error('Gagal memuat daftar course.');
      const data = await res.json();
      setCourses(data);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a201b', mb: 1 }}>
          Materi & Kelas Pembelajaran
        </Typography>
        <Typography variant="body1" sx={{ color: '#78867a' }}>
          Akses modul materi PDF dan kumpulkan tugas pembelajaran Anda di sini.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : courses.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: '#faf9f6', color: '#78867a' }}>
          <SchoolIcon sx={{ fontSize: 60, color: '#a3aca4', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Belum Ada Kelas</Typography>
          <Typography variant="body2">Anda belum terdaftar di kelas manapun saat ini. Silakan hubungi panitia.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid size={{ xs: 12, md: 6 }} key={course.id}>
              <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid #e8e6df', boxShadow: 'none' }}>
                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#2c352d', mb: 1 }}>
                    {course.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                    {course.description || 'Tidak ada deskripsi.'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#78867a' }}>
                      {course.sessions?.length || 0} Modul Sesi
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => router.push(`/courses/${course.id}`)}
                      sx={{ borderRadius: '12px', textTransform: 'none' }}
                    >
                      Buka Materi
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
