import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem, CircularProgress, Box
} from '@mui/material';
import toast from 'react-hot-toast';
import useSWR from 'swr';

interface UserDropdownItem {
  id: string;
  name: string;
  email: string;
}

interface EnrollParticipantModalProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  enrolledUserIds: string[];
  onSuccess: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EnrollParticipantModal({ open, onClose, courseId, enrolledUserIds, onSuccess }: EnrollParticipantModalProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch users when modal is open
  const { data: users, error, isLoading } = useSWR<UserDropdownItem[]>(
    open ? '/api/admin/users?role=PESERTA' : null,
    fetcher
  );

  useEffect(() => {
    if (!open) {
      setSelectedUserId('');
    }
  }, [open]);

  const availableUsers = users?.filter(u => !enrolledUserIds.includes(u.id)) || [];

  const handleEnroll = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success('Peserta berhasil didaftarkan');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal enroll peserta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Enroll Peserta</DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, color: 'error.main' }}>Gagal memuat peserta</Box>
        ) : (
          <FormControl fullWidth>
            <InputLabel>Pilih Peserta</InputLabel>
            <Select
              value={selectedUserId}
              label="Pilih Peserta"
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              {availableUsers.map((u) => (
                <MenuItem key={u.id} value={u.id}>{u.name} ({u.email})</MenuItem>
              ))}
              {availableUsers.length === 0 && (
                <MenuItem disabled value="">Tidak ada peserta yang tersedia</MenuItem>
              )}
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Batal</Button>
        <Button variant="contained" onClick={handleEnroll} disabled={loading || !selectedUserId || isLoading}>
          Daftarkan
        </Button>
      </DialogActions>
    </Dialog>
  );
}
