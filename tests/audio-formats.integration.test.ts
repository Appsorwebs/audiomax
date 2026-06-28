import { describe, expect, it } from 'vitest';
import { validateAudioFile } from '../utils/security';

const makeFile = (name: string, type: string, size = 1024) => {
  return new File([new Uint8Array(size)], name, { type });
};

describe('audio format integration checks', () => {
  it('accepts mp3 uploads', () => {
    const result = validateAudioFile(makeFile('sample.mp3', 'audio/mpeg'));
    expect(result.valid).toBe(true);
  });

  it('accepts wav uploads', () => {
    const result = validateAudioFile(makeFile('sample.wav', 'audio/wav'));
    expect(result.valid).toBe(true);
  });

  it('accepts m4a uploads', () => {
    const result = validateAudioFile(makeFile('sample.m4a', 'audio/mp4'));
    expect(result.valid).toBe(true);
  });

  it('accepts webm uploads', () => {
    const result = validateAudioFile(makeFile('sample.webm', 'audio/webm'));
    expect(result.valid).toBe(true);
  });

  it('accepts ogg uploads', () => {
    const result = validateAudioFile(makeFile('sample.ogg', 'audio/ogg'));
    expect(result.valid).toBe(true);
  });

  it('accepts audio files without extensions when mime type is available', () => {
    const result = validateAudioFile(makeFile('sample', 'audio/x-m4a'));
    expect(result.valid).toBe(true);
  });

  it('rejects non-audio uploads', () => {
    const result = validateAudioFile(makeFile('notes.txt', 'text/plain'));
    expect(result.valid).toBe(false);
  });
});
