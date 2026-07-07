'use client';

import React, { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { DRAWER_WIDTH } from './AdminSidebar';

interface AdminHeaderProps {
  userName: string;
}

export default function AdminHeader({ userName }: AdminHeaderProps) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(16px)',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { md: `${DRAWER_WIDTH}px` },
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box /> {/* Spacer for left side if needed */}
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Akun Anda">
            <IconButton onClick={handleMenu} size="small" sx={{ ml: 2 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{
              paper: { sx: { mt: 1.5, borderRadius: '16px', minWidth: 200, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' } }
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{userName}</Typography>
              <Typography variant="body2" color="text.secondary">Mode Admin/Pengawas</Typography>
            </Box>
            <MenuItem onClick={() => { handleClose(); router.push('/profile'); }} sx={{ py: 1.5, mt: 1 }}>
              <ListItemIcon><PersonRoundedIcon fontSize="small" /></ListItemIcon>
              Profil Saya
            </MenuItem>
            <MenuItem onClick={() => signOut({ callbackUrl: '/login' })} sx={{ py: 1.5, color: 'error.main' }}>
              <ListItemIcon><LogoutRoundedIcon fontSize="small" color="error" /></ListItemIcon>
              Keluar
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
