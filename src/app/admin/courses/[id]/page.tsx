'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Card, CardContent, Chip, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, Paper,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Switch, IconButton, FormControl, InputLabel, Select, MenuItem, Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LinkIcon from '@mui/icons-material/Link';
import { getFileUrl } from '@/lib/getFileUrl';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
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
import SettingsIcon from '@mui/icons-material/Settings';

// Sortable Item Component
function SortableSessionItem({ session, onToggleLock, onEdit, onDelete }: any) {
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
            <Typography sx={{ fontWeight: 700, color: '#596d58' }}>{session.material?.title || 'Materi Dihapus'}</Typography>
            {session.isLocked ? (
              <Chip icon={<LockIcon fontSize="small" />} label="Terkunci" size="small" color="error" variant="outlined" />
            ) : (
              <Chip icon={<LockOpenIcon fontSize="small" />} label="Terbuka" size="small" color="success" variant="outlined" />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {session.material?.description || 'Tidak ada deskripsi.'}
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
          {session.assignments && session.assignments.length > 0 && (
            <Box sx={{ mt: 1.5, p: 2, bgcolor: '#fbfbfb', borderRadius: '8px', border: '1px solid #f1f0ea' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block' }}>TUGAS ESAI:</Typography>
              <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{session.assignments[0].title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>{session.assignments[0].prompt}</Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <IconButton color="primary" onClick={() => onEdit(session)} size="small" title="Pengaturan Sesi">
            <SettingsIcon />
          </IconButton>
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


interface Session {
  id: string;
  order: number;
  isActive: boolean;
  isLocked: boolean;
  material: {
    id: string;
    title: string;
    description: string | null;
    pdfUrl: string;
  };
  assignments: {
    id: string;
    title: string;
    prompt: string;
    maxScore: number;
    submissions: {
      id: string;
      answer: string;
      submittedAt: string;
      status: string;
      userId: string;
      user: {
        id: string;
        name: string;
        email: string;
      };
      grades: {
        id: string;
        score: number;
        feedback: string | null;
        grader: {
          name: string;
        };
      }[];
    }[];
  }[];
}

interface Enrollment {
  id: string;
  userId: string;
  status: string;
  enrolledAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface CourseExam {
  id: string;
  examId: string;
  isRequired: boolean;
  exam: {
    id: string;
    title: string;
    isActive: boolean;
  };
}

interface CourseDetail {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  sessions: Session[];
  enrollments: Enrollment[];
  courseExams: CourseExam[];
}

interface UserDropdownItem {
  id: string;
  name: string;
  email: string;
}

interface ExamDropdownItem {
  id: string;
  title: string;
}

export default function AdminCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState(0);

  // Dialogs
  const [sessionOpen, setSessionOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [examOpen, setExamOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      if (!course) return;
      const oldIndex = course.sessions.findIndex((s) => s.id === active.id);
      const newIndex = course.sessions.findIndex((s) => s.id === over?.id);
      
      const newSessions = arrayMove(course.sessions, oldIndex, newIndex);
      
      // Update local state for immediate feedback
      setCourse({ ...course, sessions: newSessions });
      
      // Calculate new orders (1-indexed)
      const updates = newSessions.map((s, index) => ({ id: s.id, order: index + 1 }));
      
      try {
        const url = '/Users/gumilar/Documents/Learning/umroh_certification/src/app/admin/courses/[id]/page.tsx'.includes('panitia') ? `/api/panitia/courses/${courseId}/sessions/reorder` : `/api/admin/courses/${courseId}/sessions/reorder`;
        await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates })
        });
      } catch (err) {
        console.error(err);
        fetchCourse();
      }
    }
  };

  const handleAddMaterialToCourse = async (material: any) => {
    if (!course) return;
    setFormLoading(true);
    try {
      const payload = {
        materialId: material.id,
        order: course.sessions.length + 1,
        isLocked: false
      };
      const res = await fetch(`/api/panitia/courses/${courseId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchCourse();
      } else {
        const data = await res.json();
        setError(data.message || 'Gagal menambahkan materi ke course');
      }
    } catch (e) {
      setError('Gagal menambahkan materi.');
    } finally {
      setFormLoading(false);
    }
  };

  // Session Form States
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [masterMaterials, setMasterMaterials] = useState<any[]>([]);
  const [sessionOrder, setSessionOrder] = useState('0');
  const [sessionLocked, setSessionLocked] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentPrompt, setAssignmentPrompt] = useState('');
  const [hasAssignment, setHasAssignment] = useState(false);

  // Enrollment Form States
  const [users, setUsers] = useState<UserDropdownItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  // Exam Mapping Form States
  const [exams, setExams] = useState<ExamDropdownItem[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');

  // Grade Moderation States
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [selectedSubForAdjust, setSelectedSubForAdjust] = useState<any>(null);
  const [adjustScore, setAdjustScore] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`);
      if (!res.ok) throw new Error("Course tidak ditemukan");
      const data = await res.json();
      setCourse(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat course.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const loadMasterMaterials = async () => {
    try {
      const res = await fetch('/api/admin/materials?active=true');
      if (res.ok) {
        const data = await res.json();
        setMasterMaterials(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCourse();
    loadMasterMaterials();
  }, [fetchCourse]);

  // Load Users for Enrollment
  const loadUsersForEnroll = async () => {
    try {
      const res = await fetch('/api/admin/users?role=PESERTA');
      if (res.ok) {
        const data = await res.json();
        // Filter out users already enrolled
        const enrolledUserIds = course?.enrollments.map(e => e.userId) || [];
        setUsers(data.filter((u: any) => !enrolledUserIds.includes(u.id)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Load Exams for mapping
  const loadExamsForMapping = async () => {
    try {
      const res = await fetch('/api/admin/exams');
      if (res.ok) {
        const data = await res.json();
        const mappedExamIds = course?.courseExams.map(ce => ce.examId) || [];
        setExams(data.filter((ex: any) => !mappedExamIds.includes(ex.id)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEnroll = async () => {
    if (!selectedUserId) return;
    setFormLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess('Peserta berhasil didaftarkan');
      setEnrollOpen(false);
      setSelectedUserId('');
      fetchCourse();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal enroll peserta.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUnenroll = async (userId: string) => {
    if (!confirm('Keluarkan peserta dari course ini?')) return;
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/enrollments/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSuccess('Peserta berhasil dikeluarkan');
        fetchCourse();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (e) {
      setError('Gagal mengeluarkan peserta.');
    }
  };

  const handleMapExam = async () => {
    if (!selectedExamId) return;
    setFormLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId: selectedExamId, isRequired: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess('Ujian berhasil dikaitkan ke Course');
      setExamOpen(false);
      setSelectedExamId('');
      fetchCourse();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal memetakan ujian.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUnmapExam = async (examId: string) => {
    if (!confirm('Hapus kaitan ujian ini dari course?')) return;
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/exams/${examId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSuccess('Ujian berhasil dilepas');
        fetchCourse();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (e) {
      setError('Gagal melepas ujian.');
    }
  };

  const handleSaveSession = async () => {
    if (!selectedSessionId) return;
    setFormLoading(true);
    setError('');
    try {
      const payload = {
        isLocked: sessionLocked,
        hasAssignment,
        assignmentTitle: assignmentTitle || undefined,
        assignmentPrompt: assignmentPrompt || undefined
      };
      const res = await fetch(`/api/panitia/sessions/${selectedSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess('Pengaturan sesi berhasil disimpan.');
      setSessionOpen(false);
      fetchCourse();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan pengaturan sesi.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleLockSession = async (session: Session) => {
    try {
      const res = await fetch(`/api/panitia/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLocked: !session.isLocked })
      });
      if (res.ok) {
        fetchCourse();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Yakin ingin menghapus sesi ini? Tugas & kemajuan peserta akan hilang.')) return;
    try {
      const res = await fetch(`/api/panitia/sessions/${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('Sesi berhasil dihapus');
        fetchCourse();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (e) {
      setError('Gagal menghapus sesi.');
    }
  };

  const handleOpenEditSession = (session: Session) => {
    setSelectedSessionId(session.id);
    setSelectedMaterialId(session.material.id);
    setSessionOrder(String(session.order));
    setSessionLocked(session.isLocked);
    if (session.assignments && session.assignments.length > 0) {
      setHasAssignment(true);
      setAssignmentTitle(session.assignments[0].title);
      setAssignmentPrompt(session.assignments[0].prompt);
    } else {
      setHasAssignment(false);
      setAssignmentTitle('');
      setAssignmentPrompt('');
    }
    loadMasterMaterials();
    setSessionOpen(true);
  };

  const handleOpenCreateSession = () => {
    setSelectedSessionId(null);
    setSelectedMaterialId('');
    setSessionOrder(String(course?.sessions.length || 0));
    setSessionLocked(false);
    setHasAssignment(false);
    setAssignmentTitle('');
    setAssignmentPrompt('');
    loadMasterMaterials();
    setSessionOpen(true);
  };

  const handleAdjustGrade = async () => {
    if (!selectedSubForAdjust || !adjustScore || !adjustReason.trim()) return;
    setFormLoading(true);
    setError('');
    try {
      const origScore = selectedSubForAdjust.grades[0]?.score || 0;
      const res = await fetch('/api/admin/grade-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedSubForAdjust.userId,
          courseId,
          originalScore: origScore,
          adjustedScore: parseFloat(adjustScore),
          reason: adjustReason
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess('Penyesuaian nilai berhasil disimpan!');
      setAdjustmentOpen(false);
      setSelectedSubForAdjust(null);
      setAdjustScore('');
      setAdjustReason('');
      fetchCourse();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan penyesuaian nilai.');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!course) {
    return <Alert severity="error">Course tidak ditemukan atau error memuat data.</Alert>;
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/admin/courses')} sx={{ mb: 3 }}>
        Kembali ke Daftar Course
      </Button>

      <Card sx={{ mb: 4, borderRadius: '16px' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#1a201b' }}>
            {course.title}
          </Typography>
          {course.description && (
            <Typography variant="body1" sx={{ color: '#78867a', mb: 3 }}>
              {course.description}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip label={`${course.sessions?.length || 0} Sesi`} color="primary" />
            <Chip label={`${course.enrollments?.length || 0} Peserta`} color="secondary" />
            <Chip
              label={course.isActive ? 'Aktif' : 'Nonaktif'}
              color={course.isActive ? 'success' : 'default'}
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>

      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
          <Tab label="Materi & Sesi" />
          <Tab label="Peserta" />
          <Tab label="Ujian Terkait" />
          <Tab label="Nilai & Moderasi" />
        </Tabs>
      </Box>

      {/* Tab 1: Materi & Sesi */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Kolom Kiri: Master Materi */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c352d', mb: 2 }}>
              Daftar Master Materi
            </Typography>
            <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #e8e6df', boxShadow: 'none', maxHeight: '600px', overflowY: 'auto' }}>
              {masterMaterials.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Belum ada master materi terdaftar.</Typography>
              ) : (
                masterMaterials.map(mat => (
                  <Card key={mat.id} sx={{ mb: 2, border: '1px solid #f1f0ea', boxShadow: 'none', borderRadius: '8px' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography sx={{ fontWeight: 700, color: '#2c352d', mb: 0.5 }}>{mat.title}</Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddMaterialToCourse(mat)}
                        disabled={formLoading}
                        fullWidth
                        sx={{ mt: 1, borderRadius: '6px' }}
                      >
                        Tambah ke Course
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </Paper>
          </Grid>

          {/* Kolom Kanan: Course Sessions */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c352d' }}>
                Sesi Pembelajaran (Drag untuk urutkan)
              </Typography>
            </Box>
            
            {course.sessions.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '12px', bgcolor: '#faf9f6', color: '#78867a' }}>
                <Typography>Belum ada sesi pembelajaran di course ini. Tambahkan dari kolom kiri.</Typography>
              </Paper>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={course.sessions.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {course.sessions.map((session) => (
                    <SortableSessionItem 
                      key={session.id} 
                      session={session} 
                      onToggleLock={handleToggleLockSession} 
                      onEdit={handleOpenEditSession} 
                      onDelete={handleDeleteSession} 
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </Grid>
        </Grid>
      )}

      {/* Tab 2: Peserta */}
      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c352d' }}>
              Peserta Terdaftar
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                loadUsersForEnroll();
                setEnrollOpen(true);
              }}
              sx={{ borderRadius: '12px' }}
            >
              Enroll Peserta
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #e8e6df', boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#faf9f6' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Nama</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tanggal Terdaftar</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {course.enrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Belum ada peserta yang didaftarkan pada course ini.
                    </TableCell>
                  </TableRow>
                ) : course.enrollments.map((enr) => (
                  <TableRow key={enr.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{enr.user.name}</TableCell>
                    <TableCell>{enr.user.email}</TableCell>
                    <TableCell>
                      {new Date(enr.enrolledAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="error" onClick={() => handleUnenroll(enr.user.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Tab 3: Ujian Terkait */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c352d' }}>
              Ujian Tersertifikasi Terkait
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                loadExamsForMapping();
                setExamOpen(true);
              }}
              sx={{ borderRadius: '12px' }}
            >
              Kaitkan Ujian
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #e8e6df', boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#faf9f6' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Judul Ujian</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {course.courseExams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      Belum ada ujian yang dikaitkan dengan course ini.
                    </TableCell>
                  </TableRow>
                ) : course.courseExams.map((ce) => (
                  <TableRow key={ce.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{ce.exam.title}</TableCell>
                    <TableCell>
                      <Chip
                        label={ce.exam.isActive ? 'Aktif' : 'Nonaktif'}
                        color={ce.exam.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="error" onClick={() => handleUnmapExam(ce.exam.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Edit Session Settings Dialog */}
      <Dialog open={sessionOpen} onClose={() => setSessionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Pengaturan Sesi</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography sx={{ flex: 1, fontWeight: 600 }}>Kunci Sesi Ini</Typography>
            <Switch checked={sessionLocked} onChange={(e) => setSessionLocked(e.target.checked)} />
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ flex: 1, fontWeight: 600 }}>Memiliki Tugas Esai</Typography>
            <Switch checked={hasAssignment} onChange={(e) => setHasAssignment(e.target.checked)} />
          </Box>
          {hasAssignment && (
            <Box>
              <TextField
                label="Judul Tugas"
                fullWidth
                value={assignmentTitle}
                onChange={(e) => setAssignmentTitle(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Petunjuk Tugas (Prompt)"
                fullWidth
                multiline
                minRows={2}
                value={assignmentPrompt}
                onChange={(e) => setAssignmentPrompt(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSessionOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleSaveSession} disabled={formLoading}>
            Simpan Pengaturan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enroll Peserta Dialog */}
      <Dialog open={enrollOpen} onClose={() => setEnrollOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Enroll Peserta</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <FormControl fullWidth>
            <InputLabel>Pilih Peserta</InputLabel>
            <Select
              value={selectedUserId}
              label="Pilih Peserta"
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>{u.name} ({u.email})</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEnrollOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleEnroll} disabled={formLoading || !selectedUserId}>
            Daftarkan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Map Exam Dialog */}
      <Dialog open={examOpen} onClose={() => setExamOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Kaitkan Ujian</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <FormControl fullWidth>
            <InputLabel>Pilih Ujian</InputLabel>
            <Select
              value={selectedExamId}
              label="Pilih Ujian"
              onChange={(e) => setSelectedExamId(e.target.value)}
            >
              {exams.map((ex) => (
                <MenuItem key={ex.id} value={ex.id}>{ex.title}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setExamOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleMapExam} disabled={formLoading || !selectedExamId}>
            Kaitkan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tab 4: Nilai & Moderasi */}
      {activeTab === 3 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c352d', mb: 3 }}>
            Moderasi Nilai Tugas Pembelajaran
          </Typography>

          <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid #e8e6df', boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#faf9f6' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Peserta</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Sesi & Tugas</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Jawaban</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Nilai Pengawas</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  const subs = course.sessions.flatMap(session => 
                    session.assignments.flatMap(assignment => 
                      assignment.submissions.map(sub => ({
                        ...sub,
                        sessionTitle: session.material?.title || session.masterAssignment?.title || 'Sesi Tanpa Judul',
                        assignmentTitle: assignment.title,
                        assignmentId: assignment.id,
                        maxScore: assignment.maxScore
                      }))
                    )
                  );

                  if (subs.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          Belum ada tugas yang dikumpulkan untuk course ini.
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return subs.map((sub: any) => {
                    const grade = sub.grades[0] || null;
                    return (
                      <TableRow key={sub.id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600 }}>{sub.user.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{sub.user.email}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600 }}>{sub.sessionTitle}</Typography>
                          <Typography variant="body2" color="text.secondary">{sub.assignmentTitle}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                            {sub.answer}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {grade ? (
                            <Box>
                              <Typography sx={{ fontWeight: 700 }}>{grade.score} / {sub.maxScore}</Typography>
                              <Typography variant="caption" color="text.secondary">Oleh: {grade.grader?.name || 'Pengawas'}</Typography>
                            </Box>
                          ) : (
                            <Chip label="Belum Dinilai" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              setSelectedSubForAdjust(sub);
                              setAdjustScore(grade ? String(grade.score) : '0');
                              setAdjustmentOpen(true);
                            }}
                            sx={{ borderRadius: '8px' }}
                          >
                            Moderasi Nilai
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  });
                })()}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Moderation Dialog */}
      <Dialog open={adjustmentOpen} onClose={() => setAdjustmentOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Moderasi Nilai Tugas</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          {selectedSubForAdjust && (
            <Box>
              <Typography sx={{ mb: 2 }}>
                Lakukan penyesuaian nilai tugas untuk <strong>{selectedSubForAdjust.user.name}</strong> pada sesi{' '}
                <strong>{selectedSubForAdjust.sessionTitle}</strong>.
              </Typography>
              <Paper sx={{ p: 2, bgcolor: '#fafafa', mb: 3 }}>
                <Typography variant="caption" color="text.secondary">Jawaban Peserta:</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>{selectedSubForAdjust.answer}</Typography>
              </Paper>
              <TextField
                label="Nilai Penyesuaian (Adjusted Score)"
                type="number"
                fullWidth
                required
                value={adjustScore}
                onChange={(e) => setAdjustScore(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Alasan Moderasi"
                fullWidth
                required
                multiline
                minRows={2}
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAdjustmentOpen(false)}>Batal</Button>
          <Button
            variant="contained"
            onClick={handleAdjustGrade}
            disabled={formLoading || !adjustScore || !adjustReason.trim()}
          >
            {formLoading ? 'Menyimpan...' : 'Simpan Penyesuaian'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
