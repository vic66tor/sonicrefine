import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Dialogs
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  saveFileDialog: (defaultName: string, format: string) => 
    ipcRenderer.invoke('dialog:saveFile', defaultName, format),

  // Audio processing
  analyzeAudio: (filePath: string) => 
    ipcRenderer.invoke('audio:analyze', filePath),
  processAudio: (projectId: string, settings: object) => 
    ipcRenderer.invoke('audio:process', projectId, settings),

  // Projects
  createProject: (data: object) => 
    ipcRenderer.invoke('project:create', data),
  getAllProjects: () => 
    ipcRenderer.invoke('project:getAll'),
  getProject: (id: string) => 
    ipcRenderer.invoke('project:get', id),
  deleteProject: (id: string) => 
    ipcRenderer.invoke('project:delete', id),

  // Shell
  showInFolder: (filePath: string) => 
    ipcRenderer.invoke('shell:showInFolder', filePath),
  openExternal: (url: string) => 
    ipcRenderer.invoke('shell:openExternal', url),

  // Event listeners
  onProjectStatusUpdate: (callback: (data: any) => void) => {
    ipcRenderer.on('project:statusUpdate', (_, data) => callback(data));
  },
  removeProjectStatusListener: () => {
    ipcRenderer.removeAllListeners('project:statusUpdate');
  },
});

export type ElectronAPI = {
  openFileDialog: () => Promise<string | null>;
  saveFileDialog: (defaultName: string, format: string) => Promise<string | null>;
  analyzeAudio: (filePath: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  processAudio: (projectId: string, settings: object) => Promise<{ success: boolean; outputPath?: string; error?: string }>;
  createProject: (data: object) => Promise<{ success: boolean; project?: any; error?: string }>;
  getAllProjects: () => Promise<any[]>;
  getProject: (id: string) => Promise<any>;
  deleteProject: (id: string) => Promise<boolean>;
  showInFolder: (filePath: string) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  onProjectStatusUpdate: (callback: (data: any) => void) => void;
  removeProjectStatusListener: () => void;
};
