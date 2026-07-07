import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem, CircularProgress, Box
} from '@mui/material';
import toast from 'react-hot-toast';
import useSWR from 'swr';

interface ExamDropdownItem {
  id: string;
  title: string;
}

interface CourseExamModalProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  mappedExamIds: string[];
  onSuccess: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CourseExamModal({ open, onClose, courseId, mappedExamIds, onSuccess }: CourseExamModalProps) {
  const [selectedExamId, setSelectedExamId] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch exams when modal is open
  const { data: exams, error, isLoading } = useSWR<ExamDropdownItem[]>(
    open ? '/api/admin/exams' : null,
    fetcher
  );

  useEffect(() => {
    if (!open) {
      setSelectedExamId('');
    }
  }, [open]);

  const availableExams = exams?.filter(ex => !mappedExamIds.includes(ex.id)) || [];

  const handleMapExam = async () => {
    if (!selectedExamId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId: selectedExamId, isRequired: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success('Ujian berhasil dikaitkan');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengaitkan ujian.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Kaitkan Ujian</DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, color: 'error.main' }}>Gagal memuat ujian</Box>
        ) : (
          <FormControl fullWidth>
            <InputLabel>Pilih Ujian</InputLabel>
            <Select
              value={selectedExamId}
              label="Pilih Ujian"
              onChange={(e) => setSelectedExamId(e.target.value)}
            >
              {availableExams.map((ex) => (
                <MenuItem key={ex.id} value={ex.id}>{ex.title}</MenuItem>
              ))}
              {availableExams.length === 0 && (
                <MenuItem disabled value="">Tidak ada ujian yang tersedia</MenuItem>
              )}
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Batal</Button>
        <Button variant="contained" onClick={handleMapExam} disabled={loading || !selectedExamId || isLoading}>
          Kaitkan
        </Button>
      </DialogActions>
    </Dialog>
  );
}
