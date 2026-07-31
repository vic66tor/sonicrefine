import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { AudioProcessor } from './audioProcessor';
import { Database } from './database';

let mainWindow: BrowserWindow | null = null;
let audioProcessor: AudioProcessor;
let database: Database;

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0a0e1a',
    titleBarStyle: 'hiddenInset',
    frame: process.platform === 'darwin' ? false : true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Initialize services
  database = new Database();
  audioProcessor = new AudioProcessor();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ─── IPC Handlers ─────────────────────────────────────────

// Open file dialog
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [{ name: 'Audio Files', extensions: ['mp3', 'wav', 'flac', 'm4a'] }],
  });
  return result.filePaths[0] || null;
});

// Save file dialog
ipcMain.handle('dialog:saveFile', async (_, defaultName: string, format: string) => {
  const extensions: Record<string, string[]> = {
    mp3: ['mp3'],
    wav: ['wav'],
    flac: ['flac'],
    aac: ['m4a', 'aac'],
  };
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultName,
    filters: [{ name: format.toUpperCase(), extensions: extensions[format] || ['mp3'] }],
  });
  return result.filePath || null;
});

// Analyze audio file
ipcMain.handle('audio:analyze', async (_, filePath: string) => {
  try {
    const analysis = await audioProcessor.analyze(filePath);
    return { success: true, data: analysis };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Process audio file
ipcMain.handle('audio:process', async (_, projectId: string, settings: object) => {
  try {
    const project = database.getProject(projectId);
    if (!project) throw new Error('Project not found');

    // Update status
    database.updateProject(projectId, { status: 'processing' });
    mainWindow?.webContents.send('project:statusUpdate', { id: projectId, status: 'processing' });

    const outputPath = await audioProcessor.process(
      project.inputPath,
      settings as any,
      project.outputFormat
    );

    // Update project with result
    database.updateProject(projectId, {
      status: 'completed',
      outputPath,
      completedAt: new Date().toISOString(),
    });

    mainWindow?.webContents.send('project:statusUpdate', { 
      id: projectId, 
      status: 'completed',
      outputPath 
    });

    return { success: true, outputPath };
  } catch (error) {
    database.updateProject(projectId, { 
      status: 'failed', 
      errorMessage: String(error) 
    });
    mainWindow?.webContents.send('project:statusUpdate', { 
      id: projectId, 
      status: 'failed',
      error: String(error)
    });
    return { success: false, error: String(error) };
  }
});

// Create project
ipcMain.handle('project:create', async (_, data: {
  title: string;
  inputPath: string;
  outputFormat: string;
  settings: object;
}) => {
  try {
    // Analyze first
    const analysis = await audioProcessor.analyze(data.inputPath);
    
    const project = database.createProject({
      title: data.title,
      inputPath: data.inputPath,
      originalFilename: path.basename(data.inputPath),
      outputFormat: data.outputFormat,
      settings: data.settings,
      analysisData: analysis,
      status: 'pending',
    });

    return { success: true, project };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Get all projects
ipcMain.handle('project:getAll', async () => {
  return database.getAllProjects();
});

// Get single project
ipcMain.handle('project:get', async (_, id: string) => {
  return database.getProject(id);
});

// Delete project
ipcMain.handle('project:delete', async (_, id: string) => {
  return database.deleteProject(id);
});

// Open file in explorer
ipcMain.handle('shell:showInFolder', async (_, filePath: string) => {
  shell.showItemInFolder(filePath);
});

// Open external link
ipcMain.handle('shell:openExternal', async (_, url: string) => {
  shell.openExternal(url);
});
