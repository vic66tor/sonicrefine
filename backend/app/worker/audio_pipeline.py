"""
SonicRefine Audio Processing Pipeline

This module implements the core audio enhancement pipeline.
It performs perceptual enhancement — NOT lossless reconstruction.

Pipeline stages:
1. Analysis: bitrate, loudness, clipping, spectral balance
2. Input normalization
3. Noise reduction (optional)
4. EQ correction
5. Multiband compression
6. Stereo enhancement (optional)
7. Limiting
8. Loudness normalization
9. Render to output format
"""

import os
import numpy as np
import librosa
import soundfile as sf
from scipy.signal import butter, sosfilt
import pyloudnorm as pyln

try:
    import noisereduce as nr
    HAS_NOISEREDUCE = True
except ImportError:
    HAS_NOISEREDUCE = False


class AudioPipeline:
    """
    Audio enhancement pipeline.
    Produces perceptually improved output — does NOT claim to restore
    original lossless quality from a lossy source.
    """

    TARGET_LUFS = -14.0  # Streaming platform standard
    TARGET_PEAK_DB = -1.0  # True peak ceiling
    SAMPLE_RATE = 44100

    def analyze(self, file_path: str) -> dict:
        """
        Analyze audio file and return comprehensive metrics.
        """
        y, sr = librosa.load(file_path, sr=None, mono=False)

        # Handle mono vs stereo
        if y.ndim == 1:
            channels = 1
            y_mono = y
        else:
            channels = y.shape[0]
            y_mono = librosa.to_mono(y)

        duration = librosa.get_duration(y=y_mono, sr=sr)

        # Loudness measurement
        meter = pyln.Meter(sr)
        # pyloudnorm expects (samples, channels)
        if y.ndim == 1:
            loudness = meter.integrated_loudness(y.reshape(-1, 1))
        else:
            loudness = meter.integrated_loudness(y.T)

        # Peak level
        peak_level = 20 * np.log10(np.max(np.abs(y_mono)) + 1e-10)

        # Clipping detection
        clipping = bool(np.max(np.abs(y_mono)) > 0.99)

        # Spectral analysis
        spec = np.abs(librosa.stft(y_mono))
        freqs = librosa.fft_frequencies(sr=sr)

        low_mask = freqs < 250
        mid_mask = (freqs >= 250) & (freqs < 4000)
        high_mask = freqs >= 4000

        total_energy = np.sum(spec)
        low_energy = np.sum(spec[low_mask]) / total_energy if total_energy > 0 else 0
        mid_energy = np.sum(spec[mid_mask]) / total_energy if total_energy > 0 else 0
        high_energy = np.sum(spec[high_mask]) / total_energy if total_energy > 0 else 0

        # Dynamic range (simplified)
        rms = librosa.feature.rms(y=y_mono)[0]
        dynamic_range = float(
            20 * np.log10(np.max(rms) / (np.min(rms[rms > 0]) + 1e-10) + 1e-10)
        )

        # Stereo width
        stereo_width = 0.0
        if channels == 2:
            mid = (y[0] + y[1]) / 2
            side = (y[0] - y[1]) / 2
            mid_power = np.mean(mid ** 2)
            side_power = np.mean(side ** 2)
            stereo_width = float(side_power / (mid_power + side_power + 1e-10))

        # Estimate bitrate from file size
        file_size = os.path.getsize(file_path)
        bitrate = int((file_size * 8) / duration / 1000) if duration > 0 else 0

        return {
            "duration": float(duration),
            "bitrate": bitrate,
            "sample_rate": int(sr),
            "channels": channels,
            "loudness": float(loudness),
            "peakLevel": float(peak_level),
            "clipping": clipping,
            "spectralBalance": {
                "low": float(low_energy),
                "mid": float(mid_energy),
                "high": float(high_energy),
            },
            "dynamicRange": float(min(dynamic_range, 40)),
            "stereoWidth": float(stereo_width),
        }

    def process(
        self,
        file_path: str,
        settings: dict,
        output_format: str = "mp3",
    ) -> str:
        """
        Run the full enhancement pipeline.

        This is a PERCEPTUAL enhancement — it optimizes how the audio
        sounds, not a reconstruction of original lossless content.
        """
        y, sr = librosa.load(file_path, sr=self.SAMPLE_RATE, mono=False)

        is_stereo = y.ndim == 2
        if not is_stereo:
            y = y.reshape(1, -1)

        # Step 1: Input normalization
        if settings.get("normalize", True):
            y = self._normalize_input(y)

        # Step 2: Noise reduction
        if settings.get("denoise", False) and HAS_NOISEREDUCE:
            y = self._denoise(y, sr)

        # Step 3: EQ correction
        if settings.get("eqCorrection", True):
            y = self._eq_correction(y, sr)

        # Step 4: Multiband compression
        if settings.get("multibandCompression", True):
            y = self._multiband_compression(y, sr)

        # Step 5: Stereo enhancement
        if settings.get("stereoEnhancement", False) and is_stereo:
            y = self._stereo_enhancement(y)

        # Step 6: Limiting
        if settings.get("limiting", True):
            y = self._limiting(y)

        # Step 7: Loudness normalization
        if settings.get("loudnessNormalization", True):
            y = self._loudness_normalization(y, sr)

        # Step 8: Render output
        output_path = self._render(y, sr, file_path, output_format)

        return output_path

    def _normalize_input(self, y: np.ndarray) -> np.ndarray:
        """Normalize input to -1.0 to 1.0 range."""
        peak = np.max(np.abs(y))
        if peak > 0:
            y = y / peak * 0.95
        return y

    def _denoise(self, y: np.ndarray, sr: int) -> np.ndarray:
        """Apply noise reduction to each channel."""
        result = np.zeros_like(y)
        for ch in range(y.shape[0]):
            result[ch] = nr.reduce_noise(y=y[ch], sr=sr, prop_decrease=0.6)
        return result

    def _eq_correction(self, y: np.ndarray, sr: int) -> np.ndarray:
        """
        Adaptive EQ correction.
        Analyzes spectral balance and applies corrective filtering.
        """
        for ch in range(y.shape[0]):
            # Analyze current balance
            spec = np.abs(librosa.stft(y[ch]))
            freqs = librosa.fft_frequencies(sr=sr)

            low_mask = freqs < 250
            mid_mask = (freqs >= 250) & (freqs < 4000)
            high_mask = freqs >= 4000

            total = np.sum(spec) + 1e-10
            low_ratio = np.sum(spec[low_mask]) / total
            high_ratio = np.sum(spec[high_mask]) / total

            # Gentle high-shelf boost if highs are lacking
            if high_ratio < 0.2:
                sos = butter(2, 8000, btype='high', fs=sr, output='sos')
                high_content = sosfilt(sos, y[ch])
                y[ch] = y[ch] + high_content * 0.15

            # Gentle low-shelf reduction if bass is excessive
            if low_ratio > 0.4:
                sos = butter(2, 200, btype='low', fs=sr, output='sos')
                low_content = sosfilt(sos, y[ch])
                y[ch] = y[ch] - low_content * 0.1

        return y

    def _multiband_compression(self, y: np.ndarray, sr: int) -> np.ndarray:
        """
        Simplified multiband compression using 3 bands.
        """
        bands = [
            (20, 250),    # Low
            (250, 4000),  # Mid
            (4000, 16000),  # High
        ]
        ratios = [3.0, 2.5, 2.0]
        thresholds_db = [-20, -18, -16]

        result = np.zeros_like(y)

        for ch in range(y.shape[0]):
            band_signals = []
            for (low_freq, high_freq), ratio, thresh_db in zip(
                bands, ratios, thresholds_db
            ):
                # Bandpass filter
                sos = butter(
                    2,
                    [max(low_freq, 20), min(high_freq, sr // 2 - 1)],
                    btype='band',
                    fs=sr,
                    output='sos',
                )
                band = sosfilt(sos, y[ch])

                # Simple compression
                band = self._compress(band, thresh_db, ratio)
                band_signals.append(band)

            result[ch] = sum(band_signals)

        return result

    def _compress(
        self,
        signal: np.ndarray,
        threshold_db: float,
        ratio: float,
    ) -> np.ndarray:
        """Apply simple compression to a signal."""
        threshold = 10 ** (threshold_db / 20)
        output = signal.copy()

        above = np.abs(signal) > threshold
        if np.any(above):
            excess = np.abs(signal[above]) - threshold
            compressed = threshold + excess / ratio
            output[above] = np.sign(signal[above]) * compressed

        return output

    def _stereo_enhancement(self, y: np.ndarray) -> np.ndarray:
        """Enhance stereo width using mid-side processing."""
        if y.shape[0] < 2:
            return y

        mid = (y[0] + y[1]) / 2
        side = (y[0] - y[1]) / 2

        # Widen stereo field slightly
        enhancement = 1.15
        side = side * enhancement

        y[0] = mid + side
        y[1] = mid - side

        return y

    def _limiting(self, y: np.ndarray) -> np.ndarray:
        """Apply brick-wall limiting."""
        ceiling = 10 ** (self.TARGET_PEAK_DB / 20)

        for ch in range(y.shape[0]):
            peak = np.max(np.abs(y[ch]))
            if peak > ceiling:
                y[ch] = y[ch] * (ceiling / peak)

        return y

    def _loudness_normalization(
        self, y: np.ndarray, sr: int
    ) -> np.ndarray:
        """Normalize to target LUFS."""
        meter = pyln.Meter(sr)

        if y.shape[0] == 1:
            audio_for_meter = y[0].reshape(-1, 1)
        else:
            audio_for_meter = y.T

        current_loudness = meter.integrated_loudness(audio_for_meter)

        if np.isfinite(current_loudness):
            gain_db = self.TARGET_LUFS - current_loudness
            gain_linear = 10 ** (gain_db / 20)
            y = y * gain_linear

            # Final safety limiter
            ceiling = 10 ** (self.TARGET_PEAK_DB / 20)
            peak = np.max(np.abs(y))
            if peak > ceiling:
                y = y * (ceiling / peak)

        return y

    def _render(
        self,
        y: np.ndarray,
        sr: int,
        original_path: str,
        output_format: str,
    ) -> str:
        """Render processed audio to the requested format."""
        base_dir = os.path.dirname(original_path)
        base_name = os.path.splitext(os.path.basename(original_path))[0]
        output_path = os.path.join(
            base_dir, f"{base_name}_enhanced.{output_format}"
        )

        # Transpose for soundfile (samples, channels)
        audio_data = y.T if y.shape[0] <= 2 else y

        format_map = {
            "wav": "WAV",
            "flac": "FLAC",
            "mp3": "WAV",   # Write WAV then convert
            "aac": "WAV",   # Write WAV then convert
        }

        sf_format = format_map.get(output_format, "WAV")

        if output_format in ("mp3", "aac"):
            # Write temporary WAV, then use ffmpeg to convert
            temp_wav = os.path.join(base_dir, f"{base_name}_temp.wav")
            sf.write(temp_wav, audio_data, sr, format="WAV")

            if output_format == "mp3":
                os.system(
                    f"ffmpeg -y -i {temp_wav} -codec:a libmp3lame "
                    f"-b:a 320k {output_path}"
                )
            elif output_format == "aac":
                os.system(
                    f"ffmpeg -y -i {temp_wav} -codec:a aac "
                    f"-b:a 256k {output_path}"
                )

            os.remove(temp_wav)
        else:
            sf.write(output_path, audio_data, sr, format=sf_format)

        return output_path
