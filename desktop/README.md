# SonicRefine Desktop — Windows .exe

Standalone desktop application for AI audio enhancement.
No internet required, all processing happens locally on your computer.

## 🖥️ System Requirements

- **OS:** Windows 10/11 (64-bit)
- **RAM:** 4 GB minimum, 8 GB recommended
- **Storage:** 500 MB for app + space for audio files
- **CPU:** Any modern x64 processor

## 📦 Download Ready-Made .exe

If you just want to use the app, download the latest release:
- `SonicRefine-Setup-1.0.0.exe` — Installer (recommended)
- `SonicRefine-Portable-1.0.0.exe` — Portable version (no install)

## 🛠️ Build from Source

### Prerequisites

1. **Node.js 18+** — https://nodejs.org/
2. **Python 3.10+** — for native module compilation
3. **Visual Studio Build Tools** — for native modules on Windows

```powershell
# Install build tools (run as Administrator)
npm install -g windows-build-tools
```

### Build Steps

```powershell
# 1. Navigate to desktop folder
cd desktop

# 2. Install dependencies
npm install

# 3. Build the app
npm run build

# 4a. Create installer (.exe)
npm run dist

# 4b. Or create portable version
npm run dist:portable
```

### Output

After build completes, find the installer in:
```
desktop/release/SonicRefine-Setup-1.0.0.exe
```

## 🎨 Customization

### Change App Icon

1. Create a 256x256 PNG icon
2. Convert to ICO: https://icoconvert.com/
3. Save as `desktop/assets/icon.ico`
4. Rebuild with `npm run dist`

### Change App Name

Edit `desktop/package.json`:
```json
{
  "name": "your-app-name",
  "build": {
    "productName": "Your App Name"
  }
}
```

## 📁 Project Structure

```
desktop/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # App entry, IPC handlers
│   │   ├── preload.ts     # Context bridge API
│   │   ├── database.ts    # SQLite local storage
│   │   └── audioProcessor.ts  # FFmpeg processing
│   └── renderer/          # React UI
│       ├── App.tsx        # Main component
│       ├── main.tsx       # React entry
│       └── styles.css     # Tailwind styles
├── assets/
│   └── icon.ico           # App icon
├── package.json           # Config + build settings
└── README.md
```

## 🔧 How It Works

1. **File Selection** — Drag & drop or file dialog
2. **Analysis** — music-metadata extracts audio info
3. **Processing** — FFmpeg applies filters:
   - Input normalization (loudnorm)
   - Noise reduction (highpass filter)
   - EQ correction (equalizer filters)
   - Multiband compression (acompressor)
   - Stereo enhancement (stereotools)
   - Limiting (alimiter)
   - Loudness normalization (-14 LUFS)
4. **Export** — Save to MP3/WAV/FLAC/AAC

## 🎛️ FFmpeg Filters Used

```
loudnorm=I=-16:TP=-1.5:LRA=11
highpass=f=30
equalizer=f=3000:t=q:w=2:g=2
equalizer=f=12000:t=q:w=1:g=1.5
acompressor=threshold=-20dB:ratio=3:attack=5:release=100
stereotools=mlev=1:slev=1.2:sbal=0
alimiter=limit=0.95:attack=5:release=50
loudnorm=I=-14:TP=-1:LRA=7
```

## ❓ Troubleshooting

### "FFmpeg not found" error
FFmpeg is bundled with the app. If issues occur:
1. Download FFmpeg: https://ffmpeg.org/download.html
2. Add to PATH
3. Restart app

### Build fails with native module errors
```powershell
npm install -g node-gyp
npm config set python python3
npm rebuild
```

### App won't start
Delete user data folder and retry:
```powershell
rm -r "$env:APPDATA\sonicrefine-desktop"
```

## 📄 License

MIT License
