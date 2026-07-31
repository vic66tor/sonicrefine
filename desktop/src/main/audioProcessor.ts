import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { app } from 'electron';
import * as mm from 'music-metadata';

// Get FFmpeg path from bundled resources
const ffmpegPath = app.isPackaged
  ? path.join(process.resourcesPath, 'ffmpeg', 'ffmpeg.exe')
  : require('@ffmpeg-installer/ffmpeg').path;

ffmpeg.setFfmpegPath(ffmpegPath);

export interface AnalysisResult {
  duration: number;
  bitrate: number;
  sampleRate: number;
  channels: number;
  codec: string;
  format: string;
  loudness: number;
  peakLevel: number;
}

export interface ProcessingSettings {
  normalize: boolean;
  denoise: boolean;
  eqCorrection: boolean;
  multibandCompression: boolean;
  stereoEnhancement: boolean;
  limiting: boolean;
  loudnessNormalization: boolean;
  targetLufs: number;
}

export class AudioProcessor {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(app.getPath('temp'), 'sonicrefine');
  }

  async analyze(filePath: string): Promise<AnalysisResult> {
    const metadata = await mm.parseFile(filePath);
    
    return {
      duration: metadata.format.duration || 0,
      bitrate: Math.round((metadata.format.bitrate || 0) / 1000),
      sampleRate: metadata.format.sampleRate || 44100,
      channels: metadata.format.numberOfChannels || 2,
      codec: metadata.format.codec || 'unknown',
      format: metadata.format.container || 'unknown',
      loudness: -14, // Placeholder - would need actual loudness analysis
      peakLevel: -1, // Placeholder
    };
  }

  async process(
    inputPath: string,
    settings: ProcessingSettings,
    outputFormat: string
  ): Promise<string> {
    const outputDir = path.join(app.getPath('documents'), 'SonicRefine');
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(outputDir, `${baseName}_enhanced.${outputFormat}`);

    // Ensure output directory exists
    const fs = require('fs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);

      // Build FFmpeg filter chain based on settings
      const filters: string[] = [];

      // Input normalization
      if (settings.normalize) {
        filters.push('loudnorm=I=-16:TP=-1.5:LRA=11:print_format=none');
      }

      // High-pass filter to reduce rumble
      if (settings.eqCorrection) {
        filters.push('highpass=f=30');
        // Presence boost
        filters.push('equalizer=f=3000:t=q:w=2:g=2');
        // Air boost
        filters.push('equalizer=f=12000:t=q:w=1:g=1.5');
      }

      // Compression (simplified single-band)
      if (settings.multibandCompression) {
        filters.push('acompressor=threshold=-20dB:ratio=3:attack=5:release=100');
      }

      // Stereo widening
      if (settings.stereoEnhancement) {
        filters.push('stereotools=mlev=1:slev=1.2:sbal=0');
      }

      // Limiting
      if (settings.limiting) {
        filters.push('alimiter=limit=0.95:attack=5:release=50');
      }

      // Final loudness normalization
      if (settings.loudnessNormalization) {
        const targetLufs = settings.targetLufs || -14;
        filters.push(`loudnorm=I=${targetLufs}:TP=-1:LRA=7`);
      }

      // Apply filters if any
      if (filters.length > 0) {
        command = command.audioFilters(filters);
      }

      // Output settings based on format
      switch (outputFormat) {
        case 'mp3':
          command = command
            .audioCodec('libmp3lame')
            .audioBitrate('320k');
          break;
        case 'wav':
          command = command
            .audioCodec('pcm_s24le')
            .audioFrequency(44100);
          break;
        case 'flac':
          command = command
            .audioCodec('flac')
            .audioFrequency(44100);
          break;
        case 'aac':
          command = command
            .audioCodec('aac')
            .audioBitrate('256k');
          break;
      }

      command
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .run();
    });
  }
}
