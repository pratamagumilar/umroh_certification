'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Grid, Card, CardContent, Button,
  CircularProgress, Alert, Paper, Chip
} from '@mui/material';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';

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

  // Array of gradient classes for varied course covers
  const gradients = [
    'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
    'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
    'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
  ];

  return (
    <Box sx={{ pb: 6 }}>
      
      {/* Header Section */}
      <Box sx={{ mb: 5, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1, letterSpacing: '-0.02em' }}>
            Materi & Kelas Pembelajaran
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600 }}>
            Tingkatkan pengetahuan Anda tentang Umroh melalui modul interaktif dan panduan komprehensif.
          </Typography>
        </Box>
        <Chip 
          icon={<SchoolRoundedIcon fontSize="small" />} 
          label={`${courses.length} Kelas Tersedia`}
          sx={{ bgcolor: 'rgba(5, 150, 105, 0.1)', color: '#059669', fontWeight: 700, borderRadius: '12px', px: 1, py: 2.5 }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: '12px' }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress size={48} thickness={4} />
        </Box>
      ) : courses.length === 0 ? (
        <Paper sx={{ 
          p: 8, textAlign: 'center', borderRadius: '24px', 
          bgcolor: 'background.paper', border: '1px dashed #cbd5e1', boxShadow: 'none'
        }}>
          <Box sx={{ 
            width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(15, 23, 42, 0.04)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3
          }}>
            <SchoolRoundedIcon sx={{ fontSize: 40, color: '#94a3b8' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>Belum Ada Kelas</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
            Anda belum terdaftar di kelas manapun saat ini. Silakan hubungi panitia untuk informasi pendaftaran.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={4}>
          {courses.map((course, index) => {
            const gradient = gradients[index % gradients.length];
            return (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={course.id}>
                <Card sx={{ 
                  borderRadius: '24px', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                  }
                }}>
                  {/* Decorative Cover Image/Pattern */}
                  <Box sx={{ 
                    height: 160, 
                    background: gradient,
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Abstract overlapping circles */}
                    <Box sx={{ position: 'absolute', top: -30, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                    <Box sx={{ position: 'absolute', bottom: -40, left: 20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                    
                    <Box sx={{ 
                      position: 'absolute', bottom: 16, left: 20, 
                      bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)',
                      px: 1.5, py: 0.5, borderRadius: '8px',
                      display: 'flex', alignItems: 'center', gap: 1
                    }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <MenuBookRoundedIcon fontSize="small" />
                        {course.sessions?.length || 0} Modul
                      </Typography>
                    </Box>
                  </Box>

                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'text.secondary' }}>
                      <AccessTimeRoundedIcon fontSize="small" />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Terbaru
                      </Typography>
                    </Box>
                    
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 1.5, lineHeight: 1.3 }}>
                      {course.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4, flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {course.description || 'Pelajari berbagai aspek penting dalam pelaksanaan ibadah Umroh mulai dari persiapan hingga kembali ke tanah air.'}
                    </Typography>
                    
                    <Button
                      variant="contained"
                      endIcon={<PlayArrowRoundedIcon />}
                      onClick={() => router.push(`/courses/${course.id}`)}
                      sx={{ 
                        borderRadius: '12px', 
                        textTransform: 'none',
                        py: 1.2,
                        bgcolor: 'rgba(5, 150, 105, 0.1)',
                        color: '#059669',
                        boxShadow: 'none',
                        '&:hover': {
                          bgcolor: 'rgba(5, 150, 105, 0.15)',
                          boxShadow: 'none'
                        }
                      }}
                      fullWidth
                    >
                      Mulai Belajar
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
