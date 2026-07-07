'use client';

import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer, List, ListItem, ListItemText, ListItemIcon, Avatar, Menu, MenuItem } from '@mui/material';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardIcon from '@mui/icons-material/Dashboard';
import QuizIcon from '@mui/icons-material/Quiz';
import PersonIcon from '@mui/icons-material/Person';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import SchoolIcon from '@mui/icons-material/School';

export default function ParticipantLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Materi Pembelajaran', icon: <SchoolIcon />, path: '/courses' },
    { text: 'Ujian Saya', icon: <QuizIcon />, path: '/exams' },
    { text: 'Profil', icon: <PersonIcon />, path: '/profile' },
  ];

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2, fontWeight: 'bold', color: '#2c352d' }}>
        Sertifikasi Umroh
      </Typography>
      <List>
        {menuItems.map((item) => (
          <ListItem 
            key={item.text} 
            onClick={() => router.push(item.path)}
            sx={{ 
              bgcolor: pathname === item.path ? '#e9eee8' : 'transparent',
              borderRadius: '8px',
              mx: 1,
              mb: 1,
              width: 'auto',
              cursor: 'pointer',
              '&:hover': { bgcolor: '#f1f5f9' }
            }}
          >
            <ListItemIcon sx={{ color: pathname === item.path ? '#789276' : '#78867a' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              sx={{ color: pathname === item.path ? '#789276' : '#78867a', '& .MuiTypography-root': { fontWeight: pathname === item.path ? 700 : 500 } }} 
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#faf9f6' }}>
      <AppBar position="sticky" sx={{ bgcolor: '#ffffff', color: '#2c352d', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 800, color: '#789276' }}>
            Sertifikasi Umroh
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            {menuItems.map((item) => (
              <Button 
                key={item.text} 
                onClick={() => router.push(item.path)}
                sx={{ 
                  color: pathname === item.path ? '#789276' : '#78867a', 
                  fontWeight: pathname === item.path ? 700 : 500,
                  mx: 1,
                  textTransform: 'none',
                  fontSize: '1rem'
                }}
              >
                {item.text}
              </Button>
            ))}
          </Box>
          {session?.user && (
            <div>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#789276', fontSize: '0.875rem' }}>
                  {session.user.name?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                slotProps={{
                  paper: { sx: { mt: 1.5, borderRadius: '12px', minWidth: 200, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' } }
                }}
              >
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{session.user.name}</Typography>
                  <Typography variant="body2" sx={{ color: '#78867a' }}>{session.user.email}</Typography>
                </Box>
                <MenuItem onClick={() => { handleClose(); router.push('/profile'); }} sx={{ py: 1.5 }}>
                  <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                  Profil Saya
                </MenuItem>
                <MenuItem onClick={() => signOut({ callbackUrl: '/login' })} sx={{ py: 1.5, color: '#ef4444' }}>
                  <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#ef4444' }} /></ListItemIcon>
                  Keluar
                </MenuItem>
              </Menu>
            </div>
          )}
        </Toolbar>
      </AppBar>
      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240, borderRight: 'none', boxShadow: '4px 0 10px rgba(0,0,0,0.05)' },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ p: { xs: 2, sm: 3, md: 4 }, flexGrow: 1, maxWidth: 1200, mx: 'auto', width: '100%' }}>
        {children}
      </Box>
    </Box>
  );
}
