const fs = require('fs');
const path = require('path');

function refactorFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // 1. Add Imports
  const importDnd = `
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import SettingsIcon from '@mui/icons-material/Settings';

// Sortable Item Component
function SortableSessionItem({ session, onToggleLock, onEdit, onDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: session.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} sx={{ borderRadius: '12px', border: '1px solid #e8e6df', boxShadow: 'none', mb: 2 }}>
      <CardContent sx={{ p: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box {...attributes} {...listeners} sx={{ cursor: 'grab', color: 'text.secondary', display: 'flex', mt: 1 }}>
          <DragIndicatorIcon />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Typography sx={{ fontWeight: 700, color: '#596d58' }}>{session.material.title}</Typography>
            {session.isLocked ? (
              <Chip icon={<LockIcon fontSize="small" />} label="Terkunci" size="small" color="error" variant="outlined" />
            ) : (
              <Chip icon={<LockOpenIcon fontSize="small" />} label="Terbuka" size="small" color="success" variant="outlined" />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {session.material.description || 'Tidak ada deskripsi.'}
          </Typography>
          {session.material.pdfUrl && (
            <Button
              component="a"
              href={session.material.pdfUrl}
              target="_blank"
              startIcon={<LinkIcon />}
              size="small"
              variant="outlined"
              sx={{ borderRadius: '8px' }}
            >
              Lihat PDF
            </Button>
          )}
          {session.assignments && session.assignments.length > 0 && (
            <Box sx={{ mt: 1.5, p: 2, bgcolor: '#fbfbfb', borderRadius: '8px', border: '1px solid #f1f0ea' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block' }}>TUGAS ESAI:</Typography>
              <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{session.assignments[0].title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>{session.assignments[0].prompt}</Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <IconButton color="primary" onClick={() => onEdit(session)} size="small" title="Pengaturan Sesi">
            <SettingsIcon />
          </IconButton>
          <IconButton onClick={() => onToggleLock(session)} size="small" title="Toggle Kunci">
            {session.isLocked ? <LockIcon color="error" /> : <LockOpenIcon color="success" />}
          </IconButton>
          <IconButton color="error" onClick={() => onDelete(session.id)} size="small" title="Hapus dari Course">
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}
`;
  content = content.replace("import LinkIcon from '@mui/icons-material/Link';", "import LinkIcon from '@mui/icons-material/Link';\n" + importDnd);

  // 2. State & DnD functions
  const stateSearch = `  // Session Form States`;
  const dndSensorsAndFunctions = `
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      if (!course) return;
      const oldIndex = course.sessions.findIndex((s) => s.id === active.id);
      const newIndex = course.sessions.findIndex((s) => s.id === over?.id);
      
      const newSessions = arrayMove(course.sessions, oldIndex, newIndex);
      
      // Update local state for immediate feedback
      setCourse({ ...course, sessions: newSessions });
      
      // Calculate new orders (1-indexed)
      const updates = newSessions.map((s, index) => ({ id: s.id, order: index + 1 }));
      
      try {
        const url = filePath.includes('panitia') ? \`/api/panitia/courses/\${courseId}/sessions/reorder\` : \`/api/admin/courses/\${courseId}/sessions/reorder\`;
        await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates })
        });
      } catch (err) {
        console.error(err);
        fetchCourse();
      }
    }
  };

  const handleAddMaterialToCourse = async (material: any) => {
    if (!course) return;
    setFormLoading(true);
    try {
      const payload = {
        materialId: material.id,
        order: course.sessions.length + 1,
        isLocked: false
      };
      const res = await fetch(\`/api/panitia/courses/\${courseId}/sessions\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchCourse();
      } else {
        const data = await res.json();
        setError(data.message || 'Gagal menambahkan materi ke course');
      }
    } catch (e) {
      setError('Gagal menambahkan materi.');
    } finally {
      setFormLoading(false);
    }
  };
`;
  content = content.replace(stateSearch, dndSensorsAndFunctions.replace('filePath', "'" + filePath + "'") + "\n" + stateSearch);

  // 3. Tab 1 JSX Replace
  const tab1Regex = /\{\/\* Tab 1: Materi & Sesi \*\/\}[\s\S]*?\{\/\* Tab 2: Peserta \*\/\}/m;
  const newTab1 = `{/* Tab 1: Materi & Sesi */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Kolom Kiri: Master Materi */}
          <Grid item xs={12} md={5}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c352d', mb: 2 }}>
              Daftar Master Materi
            </Typography>
            <Paper sx={{ p: 2, borderRadius: '12px', border: '1px solid #e8e6df', boxShadow: 'none', maxHeight: '600px', overflowY: 'auto' }}>
              {masterMaterials.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Belum ada master materi terdaftar.</Typography>
              ) : (
                masterMaterials.map(mat => (
                  <Card key={mat.id} sx={{ mb: 2, border: '1px solid #f1f0ea', boxShadow: 'none', borderRadius: '8px' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography sx={{ fontWeight: 700, color: '#2c352d', mb: 0.5 }}>{mat.title}</Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddMaterialToCourse(mat)}
                        disabled={formLoading}
                        fullWidth
                        sx={{ mt: 1, borderRadius: '6px' }}
                      >
                        Tambah ke Course
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </Paper>
          </Grid>

          {/* Kolom Kanan: Course Sessions */}
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c352d' }}>
                Sesi Pembelajaran (Drag untuk urutkan)
              </Typography>
            </Box>
            
            {course.sessions.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '12px', bgcolor: '#faf9f6', color: '#78867a' }}>
                <Typography>Belum ada sesi pembelajaran di course ini. Tambahkan dari kolom kiri.</Typography>
              </Paper>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={course.sessions.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {course.sessions.map((session) => (
                    <SortableSessionItem 
                      key={session.id} 
                      session={session} 
                      onToggleLock={handleToggleLockSession} 
                      onEdit={handleOpenEditSession} 
                      onDelete={handleDeleteSession} 
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </Grid>
        </Grid>
      )}

      {/* Tab 2: Peserta */}`;
  
  // Need to use regex replace or string replace? 
  // String replace with a very large block can be tricky if exact spacing differs. Regex is better.
  content = content.replace(tab1Regex, newTab1);

  // 4. Update handleSaveSession logic (no more creating here, only updating assignments/lock)
  const saveSessionRegex = /const handleSaveSession = async \(\) => \{[\s\S]*?finally \{\s*setFormLoading\(false\);\s*\}\s*\};/m;
  const newSaveSession = `const handleSaveSession = async () => {
    if (!selectedSessionId) return;
    setFormLoading(true);
    setError('');
    try {
      const payload = {
        isLocked: sessionLocked,
        assignmentTitle: assignmentTitle || undefined,
        assignmentPrompt: assignmentPrompt || undefined
      };
      const res = await fetch(\`/api/panitia/sessions/\${selectedSessionId}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess('Pengaturan sesi berhasil disimpan.');
      setSessionOpen(false);
      fetchCourse();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan pengaturan sesi.');
    } finally {
      setFormLoading(false);
    }
  };`;
  content = content.replace(saveSessionRegex, newSaveSession);

  // 5. Update Session Dialog UI (Remove Material Select & Order Input)
  const sessionDialogRegex = /\{\/\* Create \/ Edit Session Dialog \*\/\}[\s\S]*?\{\/\* Enroll Peserta Dialog \*\/\}/m;
  const newSessionDialog = `{/* Edit Session Settings Dialog */}
      <Dialog open={sessionOpen} onClose={() => setSessionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Pengaturan Sesi</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography sx={{ flex: 1, fontWeight: 600 }}>Kunci Sesi Ini</Typography>
            <Switch checked={sessionLocked} onChange={(e) => setSessionLocked(e.target.checked)} />
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Tugas Esai Per Sesi</Typography>
          <TextField
            label="Judul Tugas"
            fullWidth
            value={assignmentTitle}
            onChange={(e) => setAssignmentTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Petunjuk Tugas (Prompt)"
            fullWidth
            multiline
            minRows={2}
            value={assignmentPrompt}
            onChange={(e) => setAssignmentPrompt(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSessionOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleSaveSession} disabled={formLoading}>
            Simpan Pengaturan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enroll Peserta Dialog */}`;
  
  content = content.replace(sessionDialogRegex, newSessionDialog);

  // Fix Grid item import issue
  // Material UI v5 uses Grid, but v6 might use Grid2 or size prop. 
  // In the file, Grid is already imported and previously used as `size={{ xs: 6 }}`.
  // Actually I used `<Grid item xs={12} md={5}>`. Wait, in the existing code it was:
  // `<Grid size={{ xs: 6 }}>`. If they use `@mui/material` v5/v6 Grid, `size` is v6 Grid.
  // Let me replace `Grid item xs={12} md={5}` with `Grid size={{ xs: 12, md: 5 }}` to be safe if it's v6 Grid2.
  content = content.replace(/<Grid item xs={12} md={5}>/g, '<Grid size={{ xs: 12, md: 5 }}>');
  content = content.replace(/<Grid item xs={12} md={7}>/g, '<Grid size={{ xs: 12, md: 7 }}>');

  fs.writeFileSync(filePath, content, 'utf-8');
}

try {
  refactorFile(path.join(__dirname, 'src/app/admin/courses/[id]/page.tsx'));
  console.log('Successfully refactored admin course page');
} catch (e) {
  console.error('Error on admin page:', e);
}

try {
  refactorFile(path.join(__dirname, 'src/app/panitia/courses/[id]/page.tsx'));
  console.log('Successfully refactored panitia course page');
} catch (e) {
  console.error('Error on panitia page:', e);
}
