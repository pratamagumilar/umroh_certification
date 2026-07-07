'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Card, CardContent, Chip, Grid,
  Alert, CircularProgress, Paper,
  IconButton, FormControl, Select, MenuItem
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LinkIcon from '@mui/icons-material/Link';
import { getFileUrl } from '@/lib/getFileUrl';
import useSWR from 'swr';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Sortable Item Component
function SortableSessionItem({ session, onToggleLock, onDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: session.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} sx={{ borderRadius: '12px', border: '1px solid #e8e6df', boxShadow: 'none', mb: 2 }}>
      <CardContent sx={{ p: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box {...attributes} {...listeners} sx={{ cursor: 'grab', color: 'text.secondary', display: 'flex', mt: 1 }}>
          <DragIndicatorIcon />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Typography sx={{ fontWeight: 700, color: '#596d58' }}>
              {session.material?.title || session.masterAssignment?.title || 'Item Dihapus'}
            </Typography>
            {session.isLocked ? (
              <Chip icon={<LockIcon fontSize="small" />} label="Terkunci" size="small" color="error" variant="outlined" />
            ) : (
              <Chip icon={<LockOpenIcon fontSize="small" />} label="Terbuka" size="small" color="success" variant="outlined" />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {session.material?.description || session.masterAssignment?.description || 'Tidak ada deskripsi.'}
          </Typography>
          {session.material?.pdfUrl && (
            <Button
              component="a"
              href={getFileUrl(session.material.pdfUrl)}
              target="_blank"
              startIcon={<LinkIcon />}
              size="small"
              variant="outlined"
              sx={{ borderRadius: '8px' }}
            >
              Lihat PDF
            </Button>
          )}
          {session.masterAssignment && (
            <Chip size="small" label="Tugas Esai" color="primary" variant="outlined" />
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <IconButton onClick={() => onToggleLock(session)} size="small" title="Toggle Kunci">
            {session.isLocked ? <LockIcon color="error" /> : <LockOpenIcon color="success" />}
          </IconButton>
          <IconButton color="error" onClick={() => onDelete(session.id)} size="small" title="Hapus dari Course">
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function PanitiaCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const { data: course, error: courseError, mutate: mutateCourse } = useSWR<any>(`/api/panitia/courses/${courseId}`, fetcher);
  const { data: masterMaterialsData } = useSWR<any[]>('/api/panitia/materials?active=true', fetcher);
  const { data: masterAssignmentsData } = useSWR<any[]>('/api/admin/assignments?active=true', fetcher);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  
  const masterMaterials = masterMaterialsData || [];
  const masterAssignments = masterAssignmentsData || [];

  const [activeMasterTab, setActiveMasterTab] = useState<'MATERIAL' | 'ASSIGNMENT'>('MATERIAL');
  const [localSessions, setLocalSessions] = useState<any[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (course?.sessions && !isDirty) {
      setLocalSessions(course.sessions);
    }
  }, [course, isDirty]);

  const availableMaterials = masterMaterials.filter((mat: any) => !localSessions.some(s => s.material?.id === mat.id));
  const availableAssignments = masterAssignments.filter((ass: any) => !localSessions.some(s => s.masterAssignment?.id === ass.id));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAddSessionToCourse = (item: any, type: 'MATERIAL' | 'ASSIGNMENT') => {
    if (!course) return;
    const newSession = {
      id: `temp-${Date.now()}`,
      courseId,
      materialId: type === 'MATERIAL' ? item.id : null,
      masterAssignmentId: type === 'ASSIGNMENT' ? item.id : null,
      material: type === 'MATERIAL' ? item : null,
      masterAssignment: type === 'ASSIGNMENT' ? item : null,
      order: localSessions.length + 1,
      isLocked: false,
      isActive: true
    };
    setLocalSessions([...localSessions, newSession]);
    setIsDirty(true);
  };

  const handleToggleLockSession = (session: any) => {
    setLocalSessions(localSessions.map(s => s.id === session.id ? { ...s, isLocked: !s.isLocked } : s));
    setIsDirty(true);
  };

  const handleDeleteSession = (sessionId: string) => {
    setLocalSessions(localSessions.filter(s => s.id !== sessionId));
    setIsDirty(true);
  };

  const handleSaveSessions = async () => {
    setFormLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/panitia/courses/${courseId}/sessions/bulk`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions: localSessions })
      });
      if (res.ok) {
        setSuccess('Sesi berhasil disimpan secara masal');
        setIsDirty(false);
        mutateCourse();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Gagal menyimpan sesi');
      }
    } catch (e) {
      setError('Gagal menyimpan sesi');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelSessions = () => {
    setLocalSessions(course?.sessions || []);
    setIsDirty(false);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = localSessions.findIndex((item) => item.id === active.id);
      const newIndex = localSessions.findIndex((item) => item.id === over.id);
      const newSessions = arrayMove(localSessions, oldIndex, newIndex);
      setLocalSessions(newSessions);
      setIsDirty(true);
    }
  };

  if (courseError) return <Alert severity="error">{courseError.message || 'Gagal memuat'}</Alert>;
  if (!course) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/panitia/courses')} sx={{ mb: 3 }}>
        Kembali ke Daftar Course
      </Button>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#2c352d', mb: 1 }}>
          {course.title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Kelola sesi pembelajaran untuk course ini.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>{success}</Alert>}

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid #e8e6df', boxShadow: 'none', bgcolor: '#faf9f6' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c352d' }}>
                Tambahkan Sesi
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={activeMasterTab}
                  onChange={(e) => setActiveMasterTab(e.target.value as 'MATERIAL' | 'ASSIGNMENT')}
                  sx={{ borderRadius: '8px', fontSize: '0.875rem' }}
                >
                  <MenuItem value="MATERIAL">Materi PDF</MenuItem>
                  <MenuItem value="ASSIGNMENT">Tugas Esai</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {activeMasterTab === 'MATERIAL' && (
              availableMaterials.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>Belum ada master materi terdaftar atau semua materi sudah ditambahkan.</Typography>
              ) : (
                availableMaterials.map((mat: any) => (
                  <Card key={mat.id} sx={{ mb: 1, border: '1px solid #e8e6df', boxShadow: 'none', borderRadius: '8px' }}>
                    <CardContent sx={{ p: '12px !important', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 600, color: '#2c352d', fontSize: '0.875rem' }}>{mat.title}</Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddSessionToCourse(mat, 'MATERIAL')}
                        disabled={formLoading}
                        sx={{ borderRadius: '6px', fontSize: '0.75rem', py: 0.5 }}
                      >
                        Tambah
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )
            )}

            {activeMasterTab === 'ASSIGNMENT' && (
              availableAssignments.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>Belum ada master tugas terdaftar atau semua tugas sudah ditambahkan.</Typography>
              ) : (
                availableAssignments.map((ass: any) => (
                  <Card key={ass.id} sx={{ mb: 1, border: '1px solid #e8e6df', boxShadow: 'none', borderRadius: '8px' }}>
                    <CardContent sx={{ p: '12px !important', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 600, color: '#2c352d', fontSize: '0.875rem' }}>{ass.title}</Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddSessionToCourse(ass, 'ASSIGNMENT')}
                        disabled={formLoading}
                        sx={{ borderRadius: '6px', fontSize: '0.75rem', py: 0.5 }}
                      >
                        Tambah
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c352d' }}>
              Sesi Pembelajaran (Drag untuk urutkan)
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {localSessions.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '12px', bgcolor: '#faf9f6', color: '#78867a' }}>
                <Typography>Belum ada sesi pembelajaran di course ini. Tambahkan dari kolom kiri.</Typography>
              </Paper>
            ) : (
              <>
                {isDirty && (
                  <Paper sx={{ p: 2, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff3e0', border: '1px solid #ffcc80', borderRadius: '12px' }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: '#e65100', fontWeight: 700 }}>
                        Terdapat Perubahan yang Belum Disimpan
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ef6c00' }}>
                        Anda telah mengubah susunan, menambah, atau menghapus sesi.
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="outlined" color="warning" onClick={handleCancelSessions} disabled={formLoading} size="small">Batal</Button>
                      <Button variant="contained" color="warning" onClick={handleSaveSessions} disabled={formLoading} size="small" sx={{ boxShadow: 'none' }}>Simpan</Button>
                    </Box>
                  </Paper>
                )}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={localSessions.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {localSessions.map((session) => (
                      <SortableSessionItem 
                        key={session.id} 
                        session={session} 
                        onToggleLock={handleToggleLockSession} 
                        onDelete={handleDeleteSession} 
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
