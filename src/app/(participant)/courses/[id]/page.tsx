'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Card, CardContent, Chip, Alert,
  CircularProgress, Paper, Divider, TextField, LinearProgress, Grid,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlined';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { getFileUrl } from '@/lib/getFileUrl';

interface Assignment {
  id: string;
  title: string;
  prompt: string;
  maxScore: number;
  submissions: {
    id: string;
    answer: string;
    status: string;
    grades: {
      score: number;
      feedback: string | null;
    }[];
  }[];
}

interface Session {
  id: string;
  order: number;
  isLocked: boolean;
  material: {
    id: string;
    title: string;
    description: string | null;
    pdfUrl: string;
  } | null;
  masterAssignment: {
    id: string;
    title: string;
    prompt: string;
    maxScore: number;
  } | null;
  progresses: { id: string; status: string }[];
  submissions: {
    id: string;
    answer: string;
    status: string;
    grades: {
      score: number;
      feedback: string | null;
    }[];
  }[];
}

interface CourseExam {
  id: string;
  examId: string;
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
  sessions: Session[];
  courseExams: CourseExam[];
}

interface GradeAdjustment {
  id: string;
  originalScore: number;
  adjustedScore: number;
  reason: string;
}

export default function PesertaCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [adjustment, setAdjustment] = useState<GradeAdjustment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // active session
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Submit Assignment states
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memuat detail course.');
      setCourse(data.course);
      setAdjustment(data.adjustment || null);
      if (data.course.sessions.length > 0) {
        // If no active session or the current active session is not in the list, set it to the first one
        setActiveSessionId(prev => {
          if (!prev || !data.course.sessions.find((s: Session) => s.id === prev)) {
            return data.course.sessions[0].id;
          }
          return prev;
        });
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const handleCompleteSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/courses/sessions/${sessionId}/complete`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Sesi ditandai selesai!');
        fetchCourse();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message);
      }
    } catch (e) {
      setError('Gagal menandai sesi selesai.');
    }
  };

  const handleAnswerChange = (assignmentId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [assignmentId]: value }));
  };

  const handleSubmitAssignment = async (assignmentId: string) => {
    const answer = answers[assignmentId];
    if (!answer || !answer.trim()) return;

    setSubmitting(prev => ({ ...prev, [assignmentId]: true }));
    try {
      const res = await fetch(`/api/courses/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Tugas berhasil dikumpulkan!');
        fetchCourse();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message);
      }
    } catch (e) {
      setError('Gagal mengumpulkan tugas.');
    } finally {
      setSubmitting(prev => ({ ...prev, [assignmentId]: false }));
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
    return <Alert severity="error">{error || 'Data tidak ditemukan.'}</Alert>;
  }

  // Calculate Progress
  const completedSessions = course.sessions.filter(s => s.progresses.length > 0).length;
  const progressPercent = course.sessions.length > 0 ? (completedSessions / course.sessions.length) * 100 : 0;
  
  const activeSession = course.sessions.find(s => s.id === activeSessionId);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', bgcolor: '#fff' }}>
      
      {/* TOP NAVBAR */}
      <Box sx={{ 
        height: 70, 
        display: 'flex', 
        alignItems: 'center', 
        px: { xs: 2, md: 4 }, 
        borderBottom: '1px solid #e8e6df',
        bgcolor: '#fff',
        flexShrink: 0
      }}>
        <IconButton 
          onClick={() => router.push('/courses')} 
          sx={{ mr: 2, bgcolor: '#f4f4f4', borderRadius: '8px', '&:hover': { bgcolor: '#e0e0e0' } }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a201b', lineHeight: 1.2 }}>
            {course.title}
          </Typography>
          <Typography variant="caption" sx={{ color: '#78867a' }}>
            Course
          </Typography>
        </Box>
      </Box>

      {/* MAIN LAYOUT */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: { xs: 'column', md: 'row' } }}>
        
        {/* LEFT SIDEBAR */}
        <Box sx={{ 
          width: { xs: '100%', md: 320 }, 
          flexShrink: 0, 
          borderRight: { md: '1px solid #e8e6df' }, 
          borderBottom: { xs: '1px solid #e8e6df', md: 'none' },
          bgcolor: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}>
          {/* Progress Header */}
          <Box sx={{ p: 3, borderBottom: '1px solid #e8e6df', bgcolor: '#fff' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#333' }}>Progress Belajar</Typography>
            <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 6, borderRadius: 3, mb: 1, bgcolor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: '#00bcd4' } }} />
            <Typography variant="caption" sx={{ color: '#78867a', fontWeight: 600 }}>
              {completedSessions} / {course.sessions.length} Materi Selesai
            </Typography>
          </Box>
          
          {/* Session List */}
          <List sx={{ p: 0, flex: 1 }}>
            {course.sessions.map((session) => {
              const isCompleted = session.progresses.length > 0;
              const isActive = session.id === activeSessionId;
              
              return (
                <ListItem disablePadding key={session.id} sx={{ borderBottom: '1px solid #f1f0ea' }}>
                  <ListItemButton 
                    onClick={() => setActiveSessionId(session.id)}
                    disabled={session.isLocked}
                    sx={{ 
                      py: 2,
                      px: 3,
                      borderLeft: isActive ? '4px solid #00bcd4' : '4px solid transparent',
                      bgcolor: isActive ? '#e0f7fa' : 'transparent',
                      '&:hover': { bgcolor: isActive ? '#e0f7fa' : '#f5f5f5' }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {session.isLocked ? (
                        <LockIcon color="disabled" fontSize="small" />
                      ) : isCompleted ? (
                        <CheckCircleIcon sx={{ color: '#00bcd4' }} fontSize="small" />
                      ) : isActive ? (
                        <RadioButtonUncheckedIcon sx={{ color: '#00bcd4' }} fontSize="small" />
                      ) : (
                        <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: isActive ? 700 : 500,
                            color: session.isLocked ? 'text.disabled' : (isActive ? '#006064' : '#333')
                          }}
                        >
                          {session.material ? session.material.title : (session.masterAssignment ? session.masterAssignment.title : 'Sesi Tanpa Data')}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: isActive ? '#00838f' : '#9e9e9e', fontWeight: isActive ? 600 : 500 }}>
                          Sesi {session.order} • {session.material ? 'Materi' : 'Penugasan'}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          {/* Start Exam Button */}
          {course.courseExams && course.courseExams.length > 0 && (
            <Box sx={{ p: 3, borderTop: '1px solid #e8e6df', bgcolor: '#fff' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {course.courseExams.map((ce) => (
                  <Button
                    key={ce.id}
                    variant={ce.exam.isActive ? "outlined" : "outlined"}
                    fullWidth
                    onClick={() => router.push(`/exams/${ce.exam.id}`)}
                    disabled={!ce.exam.isActive}
                    sx={{ 
                      borderRadius: '8px', 
                      color: '#00bcd4', 
                      borderColor: '#00bcd4',
                      fontWeight: 700,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#0097a7',
                        bgcolor: '#e0f7fa'
                      }
                    }}
                  >
                    Mulai Ujian ({ce.exam.title})
                  </Button>
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* CENTER CONTENT */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflowY: 'auto',
          bgcolor: '#fff'
        }}>
          {activeSession ? (
            <Box sx={{ p: { xs: 2, md: 5 }, maxWidth: '1000px', width: '100%', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Alerts */}
              {success && <Alert severity="success" sx={{ borderRadius: 2 }}>{success}</Alert>}
              {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
              {adjustment && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <strong>Penyesuaian Nilai Akhir (Admin):</strong> Nilai Anda disesuaikan menjadi <strong>{adjustment.adjustedScore}</strong>.
                </Alert>
              )}

              {/* Session Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a201b', mb: 1 }}>
                    {activeSession.material ? activeSession.material.title : (activeSession.masterAssignment ? activeSession.masterAssignment.title : 'Sesi Tanpa Data')}
                  </Typography>
                  {activeSession.material && activeSession.material.description && (
                    <Typography variant="body1" sx={{ color: '#555', lineHeight: 1.6 }}>
                      {activeSession.material.description}
                    </Typography>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {!activeSession.isLocked && !(activeSession.progresses.length > 0) && (
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => handleCompleteSession(activeSession.id)}
                      sx={{ borderRadius: '8px', textTransform: 'none', px: 4, bgcolor: '#00bcd4', '&:hover': { bgcolor: '#0097a7' } }}
                    >
                      Tandai Selesai
                    </Button>
                  )}
                  {activeSession.progresses.length > 0 && (
                    <Chip icon={<CheckCircleIcon />} label="Sesi ini telah selesai" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* PDF Viewer */}
              {activeSession.material && activeSession.material.pdfUrl && (
                <Paper sx={{ width: '100%', height: { xs: '60vh', md: '75vh' }, borderRadius: '12px', overflow: 'hidden', border: '1px solid #e0e0e0' }} elevation={0}>
                  <iframe 
                    src={`${getFileUrl(activeSession.material.pdfUrl)}#toolbar=0`} 
                    width="100%" 
                    height="100%" 
                    style={{ border: 'none' }}
                    title={activeSession.material.title}
                  />
                </Paper>
              )}

              {/* Assignment Viewer */}
              {activeSession.masterAssignment && (() => {
                const assignment = activeSession.masterAssignment;
                const submission = activeSession.submissions && activeSession.submissions[0] ? activeSession.submissions[0] : null;
                const grade = submission?.grades && submission.grades[0] ? submission.grades[0] : null;

                return (
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                      <Box sx={{ mt: 0.5, color: '#00bcd4' }}><AssignmentIcon /></Box>
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: '#333' }}>Petunjuk Tugas (Nilai Maksimal: {assignment.maxScore})</Typography>
                        <Typography variant="caption" sx={{ color: '#777' }}>Tugas Esai</Typography>
                      </Box>
                    </Box>
                    
                    <Paper elevation={0} sx={{ p: 3, bgcolor: '#fafafa', border: '1px solid #e0e0e0', mb: 4, borderRadius: '8px' }}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: '#444', lineHeight: 1.6 }}>
                        {assignment.prompt}
                      </Typography>
                    </Paper>

                    {submission ? (
                      <Box>
                        <Alert icon={<AssignmentTurnedInIcon />} severity="success" sx={{ mb: 3, borderRadius: 2, bgcolor: '#e0f7fa', color: '#006064', '& .MuiAlert-icon': { color: '#00bcd4' } }}>
                          Tugas telah dikumpulkan (Status: {submission.status})
                        </Alert>
                        
                        {submission.status === "GRADED" && grade && (
                          <Paper sx={{ p: 3, bgcolor: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', mb: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#047857', mb: 1 }}>Nilai Anda: {grade.score} / {assignment.maxScore}</Typography>
                            {grade.feedback && (
                              <Typography variant="body1" sx={{ color: '#065f46' }}>Feedback: <em>"{grade.feedback}"</em></Typography>
                            )}
                          </Paper>
                        )}

                        {submission.status !== "GRADED" && (
                          <Box>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#333' }}>Jawaban Anda</Typography>
                            <Paper sx={{ p: 3, bgcolor: '#fff', border: '1px solid #e0e0e0', mb: 4, borderRadius: '8px' }}>
                              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: '#555', lineHeight: 1.6 }}>{submission.answer}</Typography>
                            </Paper>
                            
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#333' }}>Edit Jawaban</Typography>
                            <TextField
                              fullWidth
                              multiline
                              minRows={6}
                              placeholder="Tulis ulang jawaban tugas Anda..."
                              value={answers[activeSession.id] !== undefined ? answers[activeSession.id] : submission.answer}
                              onChange={(e) => handleAnswerChange(activeSession.id, e.target.value)}
                              sx={{ mb: 3, '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
                            />
                            <Button
                              variant="outlined"
                              size="large"
                              onClick={() => handleSubmitAssignment(activeSession.id)}
                              disabled={submitting[activeSession.id]}
                              sx={{ borderRadius: '8px', borderColor: '#00bcd4', color: '#00bcd4', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#e0f7fa', borderColor: '#0097a7' } }}
                            >
                              {submitting[activeSession.id] ? 'Mengirim...' : 'Kirim Ulang'}
                            </Button>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#333' }}>Tulis Jawaban Anda</Typography>
                        <TextField
                          fullWidth
                          multiline
                          minRows={8}
                          placeholder="Ketik jawaban tugas Anda di sini..."
                          value={answers[activeSession.id] || ''}
                          onChange={(e) => handleAnswerChange(activeSession.id, e.target.value)}
                          sx={{ mb: 3, '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
                        />
                        <Button
                          variant="contained"
                          size="large"
                          onClick={() => handleSubmitAssignment(activeSession.id)}
                          disabled={submitting[activeSession.id] || !answers[activeSession.id]?.trim()}
                          sx={{ borderRadius: '8px', px: 4, bgcolor: '#00bcd4', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#0097a7' } }}
                        >
                          {submitting[activeSession.id] ? 'Mengirim...' : 'Kumpulkan Tugas'}
                        </Button>
                      </Box>
                    )}
                  </Box>
                );
              })()}

            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography color="text.secondary">Pilih sesi di menu kiri untuk melihat materi.</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

