'use client';

import React, { useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Divider,
  Collapse,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import QuizIcon from '@mui/icons-material/Quiz';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

const DRAWER_WIDTH = 260;

const menuItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <DashboardIcon /> },
  {
    label: 'Kelola User',
    icon: <PeopleIcon />,
    basePath: '/admin/users',
    subItems: [
      { label: 'Admin', href: '/admin/users?role=ADMIN' },
      { label: 'Pengawas', href: '/admin/users?role=PENGAWAS' },
      { label: 'Peserta', href: '/admin/users?role=PESERTA' },
    ],
  },
  { label: 'Kelola Ujian', href: '/admin/exams', icon: <QuizIcon /> },
  { label: 'Bank Soal', href: '/admin/question-banks', icon: <LibraryBooksIcon /> },
  { label: 'Monitoring Hasil', href: '/admin/results', icon: <AssessmentIcon /> },
  { label: 'Kelola Sertifikat', href: '/admin/certificates', icon: <CardMembershipIcon /> },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentRole = searchParams.get('role');

  const [openUsers, setOpenUsers] = useState(true); // Default open

  const handleToggleUsers = () => {
    setOpenUsers(!openUsers);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
          color: '#e2e8f0',
          borderRight: 'none',
        },
      }}
    >
      <Toolbar sx={{ px: 3, py: 2.5 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            ☪ Sertifikasi
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
            Panel Admin
          </Typography>
        </Box>
      </Toolbar>

      <Divider sx={{ borderColor: 'rgba(148, 163, 184, 0.15)' }} />

      <List sx={{ px: 1.5, pt: 2 }}>
        {menuItems.map((item) => {
          if (item.subItems) {
            const isBaseActive = pathname === item.basePath || pathname.startsWith(item.basePath + '/');
            return (
              <React.Fragment key={item.label}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={handleToggleUsers}
                    sx={{
                      borderRadius: '12px',
                      py: 1.2,
                      px: 2,
                      backgroundColor: isBaseActive ? 'rgba(14, 165, 233, 0.05)' : 'transparent',
                      color: isBaseActive ? '#e0f2fe' : '#94a3b8',
                      '&:hover': {
                        backgroundColor: 'rgba(148, 163, 184, 0.08)',
                        color: '#fff',
                      },
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      slotProps={{
                        primary: {
                          sx: {
                            fontSize: '0.875rem',
                            fontWeight: isBaseActive ? 700 : 500,
                          },
                        },
                      }}
                    />
                    {openUsers ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                  </ListItemButton>
                </ListItem>

                <Collapse in={openUsers} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subItems.map((subItem) => {
                      // Cek active state
                      let isActive = false;
                      if (subItem.href === '/admin/users' && !currentRole) isActive = true;
                      if (subItem.href.includes('role=') && currentRole && subItem.href.includes(`role=${currentRole}`)) {
                        isActive = true;
                      }

                      return (
                        <ListItemButton
                          key={subItem.href}
                          component={Link}
                          href={subItem.href}
                          sx={{
                            borderRadius: '12px',
                            py: 1,
                            pl: 7,
                            mb: 0.5,
                            backgroundColor: isActive ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                            color: isActive ? '#38bdf8' : '#64748b',
                            '&:hover': {
                              backgroundColor: isActive
                                ? 'rgba(14, 165, 233, 0.2)'
                                : 'rgba(148, 163, 184, 0.08)',
                              color: '#fff',
                            },
                          }}
                        >
                          <ListItemText
                            primary={subItem.label}
                            slotProps={{
                              primary: {
                                sx: {
                                  fontSize: '0.85rem',
                                  fontWeight: isActive ? 600 : 400,
                                },
                              },
                            }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }

          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={item.href!}
                sx={{
                  borderRadius: '12px',
                  py: 1.2,
                  px: 2,
                  backgroundColor: isActive ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  '&:hover': {
                    backgroundColor: isActive
                      ? 'rgba(14, 165, 233, 0.2)'
                      : 'rgba(148, 163, 184, 0.08)',
                    color: '#fff',
                  },
                  transition: 'all 0.15s ease',
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
    </Drawer>
  );
}

export { DRAWER_WIDTH };
