'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Avatar,
  IconButton
} from '@mui/material';
import { useSession, signOut } from 'next-auth/react';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import ClassRoundedIcon from '@mui/icons-material/ClassRounded';
import BookRoundedIcon from '@mui/icons-material/BookRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';

const DRAWER_WIDTH = 280;

const menuItems = [
  { label: 'Dashboard', href: '/panitia/dashboard', icon: <DashboardRoundedIcon /> },
  { label: 'Course & Materi', href: '/panitia/courses', icon: <ClassRoundedIcon /> },
  { label: 'Master Materi', href: '/panitia/materials', icon: <BookRoundedIcon /> },
  { label: 'Absensi', href: '/panitia/absensi', icon: <QrCodeScannerRoundedIcon /> },
];

export default function PanitiaSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          color: 'text.primary',
          borderRight: '1px solid',
          borderColor: 'divider',
          boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
        },
      }}
    >
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ 
          width: 40, height: 40, borderRadius: '12px', 
          bgcolor: 'primary.main', color: 'white', 
          display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <SchoolRoundedIcon />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Umroh Cert
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Panel Panitia
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'divider', mb: 2, mx: 2 }} />

      <List sx={{ px: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={item.href}
                sx={{
                  borderRadius: '12px',
                  py: 1.2,
                  px: 2,
                  backgroundColor: isActive ? 'rgba(5, 150, 105, 0.08)' : 'transparent',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  '&:hover': {
                    backgroundColor: isActive ? 'rgba(5, 150, 105, 0.12)' : 'rgba(15, 23, 42, 0.04)',
                    color: isActive ? 'primary.main' : 'text.primary',
                  },
                  transition: 'all 0.2s',
                }}
              >
                <ListItemIcon
                  sx={{
                    color: 'inherit',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: '0.875rem',
                        fontWeight: isActive ? 700 : 500,
                      },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 2 }}>
        <Box sx={{ 
          p: 2, borderRadius: '16px', bgcolor: 'background.default', 
          display: 'flex', alignItems: 'center', gap: 1.5,
          border: '1px solid', borderColor: 'divider'
        }}>
           <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.875rem', fontWeight: 700 }}>
              {session?.user?.name?.charAt(0).toUpperCase() || 'P'}
            </Avatar>
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {session?.user?.name || 'Panitia'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block' }}>
                Panitia
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => signOut({ callbackUrl: '/login' })} color="error">
              <LogoutRoundedIcon fontSize="small" />
            </IconButton>
        </Box>
      </Box>
    </Drawer>
  );
}

export { DRAWER_WIDTH };
