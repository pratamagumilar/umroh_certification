'use client';

import React, { useEffect, useState, use } from 'react';
import { Box, Typography, Card, CardContent, Button, CircularProgress, Alert, Paper, RadioGroup, FormControlLabel, Radio, TextField, Grid } from '@mui/material';
import { useRouter } from 'next/navigation';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SendIcon from '@mui/icons-material/Send';

interface Question {
  id: string;
  type: string;
  text: string;
  options: string | null;
}

interface TakeExamData {
  exam: {
    id: string;
    title: string;
    durationMinutes: number;
    startTime: string;
  };
  attendance: {
    scanTime: string;
  };
  questions: Question[];
}

export default function TakeExamPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: examId } = use(params);

  const [data, setData] = useState<TakeExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State answers: { questionId: answerText }
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // in seconds

  useEffect(() => {
    const fetchTakeExam = async () => {
      try {
        const res = await fetch(`/api/exams/${examId}/take`);
        const resData = await res.json();
        if (res.ok) {
          setData(resData);
          // Calculate initial time left based on when they started (scanTime)
          const endTime = new Date(resData.attendance.scanTime).getTime() + (resData.exam.durationMinutes * 60000);
          const now = Date.now();
          const diffSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
          setTimeLeft(diffSeconds);
        } else {
          setError(resData.message || 'Gagal memuat soal ujian');
        }
      } catch {
        setError('Terjadi kesalahan jaringan');
      } finally {
        setLoading(false);
      }
    };
    fetchTakeExam();
  }, [examId]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitting) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev !== null && prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev !== null ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft !== null, submitting]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching on mount
  const submitRef = React.useRef<() => void>(() => {});

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/exams/${examId}/take`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) {
        router.push('/dashboard');
      } else {
        const resData = await res.json();
        setError(resData.message || 'Gagal mengumpulkan ujian');
        setSubmitting(false);
      }
    } catch {
      setError('Terjadi kesalahan saat mengumpulkan ujian');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box>
        <Button onClick={() => router.push('/dashboard')} sx={{ mb: 3 }}>Kembali ke Dashboard</Button>
        <Alert severity="error">{error || 'Data tidak ditemukan'}</Alert>
      </Box>
    );
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isWarningTime = timeLeft !== null && timeLeft <= 300; // <= 5 minutes

  return (
    <Box>
      {/* Sticky Header for Timer */}
      <Box 
        sx={{ 
          position: 'sticky', 
          top: 64, // below appbar
          zIndex: 10, 
          bgcolor: 'rgba(255,255,255,0.9)', 
          backdropFilter: 'blur(8px)',
          p: 2, 
          mb: 4, 
          borderRadius: '16px', 
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid #e8e6df'
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1a201b' }}>
            {data.exam.title}
          </Typography>
          <Typography variant="body2" sx={{ color: '#78867a' }}>
            Jawab semua soal sebelum waktu habis.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: isWarningTime ? '#ef4444' : '#789276' }}>
          <AccessTimeIcon fontSize="large" />
          <Typography variant="h5" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
            {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.questions.map((q, index) => {
            let opts = null;
            if (q.type === 'PG' && q.options) {
              try { opts = JSON.parse(q.options); } catch { /* ignore */ }
            }

            return (
              <Card key={q.id} sx={{ borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e8e6df' }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Box sx={{ 
                      minWidth: 32, 
                      height: 32, 
                      borderRadius: '8px', 
                      bgcolor: '#f1f5f9', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      fontWeight: 800,
                      color: '#789276'
                    }}>
                      {index + 1}
                    </Box>
                    <Typography variant="body1" sx={{ fontSize: '1.1rem', fontWeight: 500, color: '#2c352d', whiteSpace: 'pre-wrap', pt: 0.5 }}>
                      {q.text}
                    </Typography>
                  </Box>

                  <Box sx={{ pl: { xs: 0, sm: 6 } }}>
                    {q.type === 'PG' && opts && (
                      <Grid container spacing={2}>
                        {['A', 'B', 'C', 'D'].map((optKey) => (
                          <Grid size={{ xs: 12, sm: 6 }} key={optKey}>
                            <Paper 
                              variant="outlined" 
                              sx={{ 
                                p: 1, 
                                borderRadius: '12px',
                                bgcolor: answers[q.id] === optKey ? '#e9eee8' : 'transparent',
                                borderColor: answers[q.id] === optKey ? '#789276' : '#e8e6df',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': { bgcolor: '#faf9f6', borderColor: '#cbd5e1' }
                              }}
                              onClick={() => handleAnswerChange(q.id, optKey)}
                            >
                              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%', p: 1 }}>
                                <Box sx={{ 
                                  width: 28, height: 28, borderRadius: '50%', 
                                  bgcolor: answers[q.id] === optKey ? '#789276' : '#f1f5f9', 
                                  color: answers[q.id] === optKey ? '#fff' : '#78867a',
                                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                                  fontWeight: 700, fontSize: '0.875rem'
                                }}>
                                  {optKey}
                                </Box>
                                <Typography sx={{ flex: 1, color: '#425045' }}>{opts[optKey]}</Typography>
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    )}

                    {q.type === 'ESSAY' && (
                      <TextField
                        fullWidth
                        multiline
                        rows={6}
                        placeholder="Ketik jawaban Anda di sini..."
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            bgcolor: '#faf9f6'
                          }
                        }}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        <Box sx={{ mt: 6, mb: 8, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            sx={{ px: 6, py: 2, borderRadius: '12px', fontWeight: 700, fontSize: '1.1rem' }}
          >
            {submitting ? 'Mengumpulkan...' : 'Selesai & Kumpulkan'}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
