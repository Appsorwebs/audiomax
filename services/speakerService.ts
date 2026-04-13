/**
 * Speaker Identification Service
 * 
 * Uses audio analysis to identify and track different speakers:
 * - Voice frequency analysis (fundamental frequency, formants)
 * - Spectral envelope analysis for voice characteristics
 * - Speaker profile matching and learning
 * - Real-time speaker detection during recording
 */

export interface SpeakerProfile {
  id: string;
  name: string;
  color: string;
  fundamentalFrequency: number; // Average pitch in Hz
  spectralCentroid: number; // Average spectral brightness
  voiceCharacteristics: {
    maleScore: number; // 0-1, higher = more male
    energyProfile: Float32Array; // Energy distribution across frequencies
  };
  samples: number; // Number of audio samples used for profile
}

export interface SpeakerSegment {
  speakerId: string;
  speaker?: SpeakerProfile;
  startTime: number;
  endTime: number;
  confidence: number; // 0-1
  text?: string;
}

const SPEAKER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Light Blue
];

class SpeakerIdentificationService {
  private speakerProfiles: Map<string, SpeakerProfile> = new Map();
  private currentSpeakerId: string | null = null;
  private speakerCounter = 1;

  /**
   * Analyze audio buffer and extract voice characteristics
   */
  analyzeVoiceCharacteristics(audioBuffer: AudioBuffer): {
    fundamentalFrequency: number;
    spectralCentroid: number;
    maleScore: number;
    energyProfile: Float32Array;
  } {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    // Compute FFT-like analysis using a simple approach
    const energyProfile = new Float32Array(8); // 8 frequency bands
    let totalEnergy = 0;
    let weightedSum = 0;

    // Analyze audio in chunks
    const chunkSize = Math.floor(channelData.length / 8);
    for (let band = 0; band < 8; band++) {
      const start = band * chunkSize;
      const end = (band + 1) * chunkSize;
      let bandEnergy = 0;

      for (let i = start; i < end && i < channelData.length; i++) {
        bandEnergy += channelData[i] * channelData[i];
      }

      bandEnergy = Math.sqrt(bandEnergy / (end - start));
      energyProfile[band] = bandEnergy;
      totalEnergy += bandEnergy;
      weightedSum += bandEnergy * band;
    }

    // Estimate fundamental frequency (pitch)
    // Using autocorrelation-like approach
    const fundamentalFrequency = this.estimateFundamentalFrequency(
      channelData,
      sampleRate
    );

    // Spectral centroid (brightness)
    const spectralCentroid =
      totalEnergy > 0 ? (weightedSum / totalEnergy) * (sampleRate / 16) : 0;

    // Male vs Female score (lower pitch = more male)
    // Assuming male range 85-180 Hz, female 165-255 Hz
    const maleScore = Math.max(
      0,
      Math.min(1, 1 - (fundamentalFrequency - 85) / (255 - 85))
    );

    return {
      fundamentalFrequency: Math.round(fundamentalFrequency),
      spectralCentroid: Math.round(spectralCentroid),
      maleScore,
      energyProfile,
    };
  }

  /**
   * Estimate fundamental frequency (pitch) using autocorrelation
   */
  private estimateFundamentalFrequency(
    audioData: Float32Array,
    sampleRate: number
  ): number {
    const minPeriod = Math.floor(sampleRate / 300); // 300 Hz max
    const maxPeriod = Math.floor(sampleRate / 50); // 50 Hz min

    let maxCorrelation = 0;
    let bestPeriod = minPeriod;

    for (let period = minPeriod; period < maxPeriod; period++) {
      let correlation = 0;
      let samples = 0;

      for (let i = 0; i < audioData.length - period; i++) {
        correlation += audioData[i] * audioData[i + period];
        samples++;
      }

      correlation = correlation / (samples || 1);

      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestPeriod = period;
      }
    }

    return sampleRate / bestPeriod;
  }

  /**
   * Create or update a speaker profile
   */
  createSpeakerProfile(
    name: string,
    characteristics: ReturnType<typeof this.analyzeVoiceCharacteristics>
  ): SpeakerProfile {
    const id = `speaker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const color = SPEAKER_COLORS[this.speakerProfiles.size % SPEAKER_COLORS.length];

    const profile: SpeakerProfile = {
      id,
      name,
      color,
      fundamentalFrequency: characteristics.fundamentalFrequency,
      spectralCentroid: characteristics.spectralCentroid,
      voiceCharacteristics: {
        maleScore: characteristics.maleScore,
        energyProfile: characteristics.energyProfile,
      },
      samples: 1,
    };

    this.speakerProfiles.set(id, profile);
    this.currentSpeakerId = id;

    return profile;
  }

  /**
   * Register a named speaker (for manual setup)
   */
  registerSpeaker(name: string): SpeakerProfile {
    const id = `speaker-${this.speakerCounter++}`;
    const color = SPEAKER_COLORS[this.speakerProfiles.size % SPEAKER_COLORS.length];

    const profile: SpeakerProfile = {
      id,
      name,
      color,
      fundamentalFrequency: 0,
      spectralCentroid: 0,
      voiceCharacteristics: {
        maleScore: 0.5,
        energyProfile: new Float32Array(8),
      },
      samples: 0,
    };

    this.speakerProfiles.set(id, profile);
    return profile;
  }

  /**
   * Compare audio with existing speaker profiles
   * Returns the best matching speaker and confidence score
   */
  identifySpeaker(
    audioBuffer: AudioBuffer,
    minConfidence: number = 0.6
  ): { speakerId: string | null; confidence: number } {
    if (this.speakerProfiles.size === 0) {
      return { speakerId: null, confidence: 0 };
    }

    const characteristics = this.analyzeVoiceCharacteristics(audioBuffer);

    let bestMatch: { speakerId: string; confidence: number } = {
      speakerId: null as any,
      confidence: 0,
    };

    for (const [speakerId, profile] of this.speakerProfiles) {
      // Skip profiles with no training data
      if (profile.samples === 0) continue;

      const confidence = this.calculateSimilarity(characteristics, profile);

      if (confidence > bestMatch.confidence) {
        bestMatch = { speakerId, confidence };
      }
    }

    // Return match only if confidence exceeds threshold
    if (bestMatch.confidence >= minConfidence) {
      return bestMatch;
    }

    return { speakerId: null, confidence: bestMatch.confidence };
  }

  /**
   * Calculate similarity between audio characteristics and speaker profile
   */
  private calculateSimilarity(
    characteristics: ReturnType<typeof this.analyzeVoiceCharacteristics>,
    profile: SpeakerProfile
  ): number {
    if (profile.samples === 0) return 0;

    let similarity = 0;
    let weights = 0;

    // Fundamental frequency similarity (weight: 0.4)
    const freqDifference = Math.abs(
      characteristics.fundamentalFrequency - profile.fundamentalFrequency
    );
    const freqSimilarity = Math.max(0, 1 - freqDifference / 50); // 50 Hz tolerance
    similarity += freqSimilarity * 0.4;
    weights += 0.4;

    // Spectral centroid similarity (weight: 0.3)
    const spectralDifference = Math.abs(
      characteristics.spectralCentroid - profile.spectralCentroid
    );
    const spectralSimilarity = Math.max(0, 1 - spectralDifference / 1000);
    similarity += spectralSimilarity * 0.3;
    weights += 0.3;

    // Male/female score similarity (weight: 0.2)
    const genderDifference = Math.abs(
      characteristics.maleScore - profile.voiceCharacteristics.maleScore
    );
    const genderSimilarity = Math.max(0, 1 - genderDifference);
    similarity += genderSimilarity * 0.2;
    weights += 0.2;

    // Energy profile similarity (weight: 0.1)
    let energySimilarity = 0;
    let energyDifferences = 0;

    for (let i = 0; i < 8; i++) {
      const diff = Math.abs(
        characteristics.energyProfile[i] - profile.voiceCharacteristics.energyProfile[i]
      );
      energySimilarity += Math.max(0, 1 - diff / 0.1);
      energyDifferences++;
    }

    energySimilarity = energySimilarity / energyDifferences;
    similarity += energySimilarity * 0.1;
    weights += 0.1;

    return weights > 0 ? similarity / weights : 0;
  }

  /**
   * Update speaker profile with new sample
   */
  updateSpeakerProfile(
    speakerId: string,
    audioBuffer: AudioBuffer
  ): boolean {
    const profile = this.speakerProfiles.get(speakerId);
    if (!profile) return false;

    const characteristics = this.analyzeVoiceCharacteristics(audioBuffer);

    // Weighted average with exponential moving average
    const alpha = 1 / (profile.samples + 1);
    profile.fundamentalFrequency =
      profile.fundamentalFrequency * (1 - alpha) +
      characteristics.fundamentalFrequency * alpha;
    profile.spectralCentroid =
      profile.spectralCentroid * (1 - alpha) +
      characteristics.spectralCentroid * alpha;

    // Update energy profile
    for (let i = 0; i < 8; i++) {
      profile.voiceCharacteristics.energyProfile[i] =
        profile.voiceCharacteristics.energyProfile[i] * (1 - alpha) +
        characteristics.energyProfile[i] * alpha;
    }

    profile.voiceCharacteristics.maleScore =
      profile.voiceCharacteristics.maleScore * (1 - alpha) +
      characteristics.maleScore * alpha;

    profile.samples++;
    return true;
  }

  /**
   * Get all registered speakers
   */
  getSpeakers(): SpeakerProfile[] {
    return Array.from(this.speakerProfiles.values());
  }

  /**
   * Get a specific speaker profile
   */
  getSpeaker(speakerId: string): SpeakerProfile | undefined {
    return this.speakerProfiles.get(speakerId);
  }

  /**
   * Clear all speaker profiles and reset state
   */
  clearSpeakers(): void {
    this.speakerProfiles.clear();
    this.currentSpeakerId = null;
    this.speakerCounter = 1;
  }

  /**
   * Set current speaker (for manual assignment)
   */
  setCurrentSpeaker(speakerId: string | null): void {
    this.currentSpeakerId = speakerId;
  }

  /**
   * Get current speaker
   */
  getCurrentSpeaker(): SpeakerProfile | null {
    if (!this.currentSpeakerId) return null;
    return this.speakerProfiles.get(this.currentSpeakerId) || null;
  }

  /**
   * Detect speaker change in audio
   * Returns array of segments with speaker changes
   */
  detectSpeakerSegments(
    audioBuffer: AudioBuffer,
    segmentDurationMs: number = 2000
  ): SpeakerSegment[] {
    const sampleRate = audioBuffer.sampleRate;
    const segmentSamples = (segmentDurationMs / 1000) * sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const segments: SpeakerSegment[] = [];

    const channelData = audioBuffer.getChannelData(0);

    for (let i = 0; i < channelData.length; i += segmentSamples) {
      const end = Math.min(i + segmentSamples, channelData.length);

      // Create temporary audio buffer for this segment
      const offlineContext = new OfflineAudioContext(channels, end - i, sampleRate);
      const buffSource = offlineContext.createBufferSource();

      // Copy segment data
      const segmentBuffer = offlineContext.createBuffer(channels, end - i, sampleRate);
      const segmentData = segmentBuffer.getChannelData(0);
      for (let j = i, k = 0; j < end; j++, k++) {
        segmentData[k] = channelData[j];
      }

      // Identify speaker for this segment
      const identification = this.identifySpeaker(segmentBuffer, 0.5);

      if (identification.speakerId) {
        const speaker = this.speakerProfiles.get(identification.speakerId);
        segments.push({
          speakerId: identification.speakerId,
          speaker,
          startTime: i / sampleRate,
          endTime: end / sampleRate,
          confidence: identification.confidence,
        });
      }
    }

    return segments;
  }

  /**
   * Get speaker dominance statistics
   */
  getSpeakerStatistics(segments: SpeakerSegment[]): {
    speakerId: string;
    speaker: SpeakerProfile | undefined;
    duration: number; // in seconds
    percentage: number;
    segmentCount: number;
  }[] {
    if (segments.length === 0) return [];

    const totalDuration = segments[segments.length - 1].endTime - segments[0].startTime;
    const speakerStats = new Map<
      string,
      { duration: number; count: number; speaker?: SpeakerProfile }
    >();

    for (const segment of segments) {
      const stats = speakerStats.get(segment.speakerId) || {
        duration: 0,
        count: 0,
        speaker: segment.speaker,
      };

      stats.duration += segment.endTime - segment.startTime;
      stats.count++;
      speakerStats.set(segment.speakerId, stats);
    }

    return Array.from(speakerStats.entries())
      .map(([speakerId, stats]) => ({
        speakerId,
        speaker: stats.speaker,
        duration: stats.duration,
        percentage: totalDuration > 0 ? (stats.duration / totalDuration) * 100 : 0,
        segmentCount: stats.count,
      }))
      .sort((a, b) => b.duration - a.duration);
  }
}

// Export singleton instance
export const speakerService = new SpeakerIdentificationService();
