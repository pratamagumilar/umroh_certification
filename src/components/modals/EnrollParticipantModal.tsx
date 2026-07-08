import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, CircularProgress, Box, Autocomplete, TextField
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
  const [selectedUser, setSelectedUser] = useState<UserDropdownItem | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch users when modal is open
  const { data: users, error, isLoading } = useSWR<UserDropdownItem[]>(
    open ? '/api/admin/users?role=PESERTA' : null,
    fetcher
  );

  useEffect(() => {
    if (!open) {
      setSelectedUser(null);
    }
  }, [open]);

  const availableUsers = users?.filter(u => !enrolledUserIds.includes(u.id)) || [];

  const handleEnroll = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id })
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Enroll Peserta</DialogTitle>
      <DialogContent sx={{ pt: '24px !important', minHeight: '150px' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, color: 'error.main' }}>Gagal memuat peserta</Box>
        ) : (
          <Autocomplete
            options={availableUsers}
            getOptionLabel={(option) => `${option.name} (${option.email})`}
            value={selectedUser}
            onChange={(event, newValue) => setSelectedUser(newValue)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Cari & Pilih Peserta" 
                placeholder="Ketik nama atau email..."
              />
            )}
            noOptionsText={availableUsers.length === 0 ? "Semua peserta sudah terdaftar di course ini" : "Peserta tidak ditemukan"}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Batal</Button>
        <Button variant="contained" onClick={handleEnroll} disabled={loading || !selectedUser || isLoading}>
          Daftarkan
        </Button>
      </DialogActions>
    </Dialog>
  );
}
