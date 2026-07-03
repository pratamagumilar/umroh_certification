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
        color: '#2c352d',
        borderBottom: '1px solid #e8e6df',
      }}
    >
      <Toolbar sx={{ justifyContent: 'flex-end', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: '#789276',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#425045' }}>
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
