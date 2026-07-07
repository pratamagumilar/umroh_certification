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

import { getFileUrl } from '@/lib/getFileUrl';

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
            <Typography sx={{ fontWeight: 700, color: '#596d58' }}>
              {session.material ? session.material.title : (session.masterAssignment ? session.masterAssignment.title : 'Sesi Tanpa Data')}
            </Typography>
            {session.isLocked ? (
              <Chip icon={<LockIcon fontSize="small" />} label="Terkunci" size="small" color="error" variant="outlined" />
            ) : (
              <Chip icon={<LockOpenIcon fontSize="small" />} label="Terbuka" size="small" color="success" variant="outlined" />
            )}
            <Chip 
              label={session.material ? "Materi PDF" : "Tugas Esai"} 
              size="small" 
              color={session.material ? "primary" : "secondary"} 
              variant="outlined" 
            />
          </Box>
          
          {session.material && (
            <React.Fragment>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {session.material.description || 'Tidak ada deskripsi.'}
              </Typography>
              {session.material.pdfUrl && (
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
            </React.Fragment>
          )}

          {session.masterAssignment && (
            <Box sx={{ mt: 1.5, p: 2, bgcolor: '#fbfbfb', borderRadius: '8px', border: '1px solid #f1f0ea' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block' }}>TUGAS ESAI (Max: {session.masterAssignment.maxScore}):</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mt: 1 }}>{session.masterAssignment.prompt}</Typography>
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
  masterAssignment: {
    id: string;
    title: string;
    prompt: string;
    maxScore: number;
  } | null;
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

export default function PanitiaCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [activeTab, setActiveTab] = useState(0);

  const [sessionOpen, setSessionOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [examOpen, setExamOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<'MATERIAL' | 'ASSIGNMENT'>('MATERIAL');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [selectedMasterAssignmentId, setSelectedMasterAssignmentId] = useState('');
  const [masterMaterials, setMasterMaterials] = useState<any[]>([]);
  const [masterAssignments, setMasterAssignments] = useState<any[]>([]);
  const [sessionOrder, setSessionOrder] = useState('0');
  const [sessionLocked, setSessionLocked] = useState(false);

  const [users, setUsers] = useState<UserDropdownItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  const [exams, setExams] = useState<ExamDropdownItem[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/panitia/courses/${courseId}`);
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
      const res = await fetch('/api/panitia/materials?active=true');
      if (res.ok) {
        const data = await res.json();
        setMasterMaterials(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadMasterAssignments = async () => {
    try {
      const res = await fetch('/api/admin/assignments?active=true');
      if (res.ok) {
        const data = await res.json();
        setMasterAssignments(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCourse();
    loadMasterMaterials();
    loadMasterAssignments();
  }, [fetchCourse]);

  const loadUsersForEnroll = async () => {
    try {
      const res = await fetch('/api/admin/users?role=PESERTA');
      if (res.ok) {
        const data = await res.json();
        const enrolledUserIds = course?.enrollments.map(e => e.userId) || [];
        setUsers(data.filter((u: any) => !enrolledUserIds.includes(u.id)));
      }
    } catch (e) {
      console.error(e);
    }
  };

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
    setFormLoading(true);
    setError('');
    try {
      const payload = {
        type: sessionType,
        materialId: sessionType === 'MATERIAL' ? selectedMaterialId : undefined,
        masterAssignmentId: sessionType === 'ASSIGNMENT' ? selectedMasterAssignmentId : undefined,
        order: sessionOrder,
        isLocked: sessionLocked
      };
      
      let res;
      if (selectedSessionId) {
        res = await fetch(`/api/panitia/sessions/${selectedSessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/panitia/courses/${courseId}/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setSuccess(selectedSessionId ? 'Pengaturan sesi berhasil disimpan.' : 'Sesi berhasil dibuat.');
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

  const handleOpenEditSession = (session: any) => {
    setSelectedSessionId(session.id);
    if (session.materialId) {
      setSessionType('MATERIAL');
      setSelectedMaterialId(session.materialId);
      setSelectedMasterAssignmentId('');
    } else if (session.masterAssignmentId) {
      setSessionType('ASSIGNMENT');
      setSelectedMasterAssignmentId(session.masterAssignmentId);
      setSelectedMaterialId('');
    }
    setSessionOrder(String(session.order));
    setSessionLocked(session.isLocked);
    setSessionOpen(true);
  };

  const handleOpenCreateSession = () => {
    setSelectedSessionId(null);
    setSessionType('MATERIAL');
    setSelectedMaterialId('');
    setSelectedMasterAssignmentId('');
    setSessionOrder(String(course?.sessions.length || 0));
    setSessionLocked(false);
    setSessionOpen(true);
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
      <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/panitia/courses')} sx={{ mb: 3 }}>
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
        </Tabs>
      </Box>

      {/* Tab 1: Sesi */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c352d' }}>
              Daftar Sesi Pembelajaran
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateSession} sx={{ borderRadius: '12px' }}>
              Tambah Sesi Baru
            </Button>
          </Box>

          {course.sessions.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '12px', bgcolor: '#faf9f6', color: '#78867a' }}>
              <Typography>Belum ada sesi pembelajaran. Silakan buat sesi baru.</Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {course.sessions.map((session) => (
                <Card key={session.id} sx={{ borderRadius: '12px', border: '1px solid #e8e6df', boxShadow: 'none' }}>
                  <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Typography sx={{ fontWeight: 700, color: '#596d58' }}>
                          Sesi {session.order}: {session.material ? session.material.title : (session.masterAssignment ? session.masterAssignment.title : 'Sesi Tanpa Data')}
                        </Typography>
                        {session.isLocked ? (
                          <Chip icon={<LockIcon fontSize="small" />} label="Terkunci" size="small" color="error" variant="outlined" />
                        ) : (
                          <Chip icon={<LockOpenIcon fontSize="small" />} label="Terbuka" size="small" color="success" variant="outlined" />
                        )}
                        <Chip 
                          label={session.material ? "Materi PDF" : "Tugas Esai"} 
                          size="small" 
                          color={session.material ? "primary" : "secondary"} 
                          variant="outlined" 
                        />
                      </Box>
                      
                      {session.material && (
                        <React.Fragment>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            {session.material.description || 'Tidak ada deskripsi.'}
                          </Typography>
                          {session.material.pdfUrl && (
                            <Button
                              component="a"
                              href={getFileUrl(session.material.pdfUrl)}
                              target="_blank"
                              startIcon={<LinkIcon />}
                              size="small"
                              variant="outlined"
                              sx={{ borderRadius: '8px' }}
                            >
                              Lihat PDF Materi
                            </Button>
                          )}
                        </React.Fragment>
                      )}

                      {session.masterAssignment && (
                        <Box sx={{ mt: 1.5, p: 2, bgcolor: '#fbfbfb', borderRadius: '8px', border: '1px solid #f1f0ea' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block' }}>TUGAS ESAI (Max: {session.masterAssignment.maxScore}):</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mt: 1 }}>{session.masterAssignment.prompt}</Typography>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton onClick={() => handleToggleLockSession(session)}>
                        {session.isLocked ? <LockIcon color="error" /> : <LockOpenIcon color="success" />}
                      </IconButton>
                      <IconButton color="primary" onClick={() => handleOpenEditSession(session)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDeleteSession(session.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
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

      {/* Tab 3: Ujian */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c352d' }}>
              Ujian Terkait
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

      {/* Dialog Sesi */}
      <Dialog open={sessionOpen} onClose={() => setSessionOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent sx={{ pt: '16px !important' }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Tipe Sesi</InputLabel>
            <Select
              value={sessionType}
              label="Tipe Sesi"
              onChange={(e) => {
                setSessionType(e.target.value as 'MATERIAL' | 'ASSIGNMENT');
                setSelectedMaterialId('');
                setSelectedMasterAssignmentId('');
              }}
              disabled={!!selectedSessionId}
            >
              <MenuItem value="MATERIAL">Materi PDF</MenuItem>
              <MenuItem value="ASSIGNMENT">Tugas Esai</MenuItem>
            </Select>
          </FormControl>

          {sessionType === 'MATERIAL' && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Pilih Master Materi</InputLabel>
              <Select
                value={selectedMaterialId}
                label="Pilih Master Materi"
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                disabled={!!selectedSessionId}
              >
                {masterMaterials.map((mat) => (
                  <MenuItem key={mat.id} value={mat.id}>
                    {mat.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {sessionType === 'ASSIGNMENT' && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Pilih Master Data Tugas</InputLabel>
              <Select
                value={selectedMasterAssignmentId}
                label="Pilih Master Data Tugas"
                onChange={(e) => setSelectedMasterAssignmentId(e.target.value)}
                disabled={!!selectedSessionId}
              >
                {masterAssignments.map((task) => (
                  <MenuItem key={task.id} value={task.id}>
                    {task.title} (Max: {task.maxScore})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="Order / Urutan"
                type="number"
                fullWidth
                value={sessionOrder}
                onChange={(e) => setSessionOrder(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography>Locked / Kunci</Typography>
              <Switch checked={sessionLocked} onChange={(e) => setSessionLocked(e.target.checked)} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSessionOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleSaveSession} disabled={formLoading || !selectedMaterialId}>
            Simpan Sesi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Enroll */}
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

      {/* Dialog Map Exam */}
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
    </Box>
  );
}
