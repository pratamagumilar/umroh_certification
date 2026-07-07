"use client";

import { Box, Typography, Grid, Paper, Card, CardContent } from "@mui/material";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function PanitiaDashboard() {
  const { data: session } = useSession();
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Dashboard Panitia
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Selamat datang, {session?.user?.name}! Kelola Course dan Materi pembelajaran di sini.
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Course
              </Typography>
              <Typography variant="h3">
                0
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
