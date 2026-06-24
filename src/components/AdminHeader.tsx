'use client';

import React from 'react';
import { signOut } from 'next-auth/react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { DRAWER_WIDTH } from './AdminSidebar';

interface AdminHeaderProps {
  userName: string;
}

export default function AdminHeader({ userName }: AdminHeaderProps) {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: '#fff',
        color: '#1e293b',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <Toolbar sx={{ justifyContent: 'flex-end', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: '#0ea5e9',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
            {userName}
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={() => signOut({ callbackUrl: '/login' })}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
        >
          Keluar
        </Button>
      </Toolbar>
    </AppBar>
  );
}
