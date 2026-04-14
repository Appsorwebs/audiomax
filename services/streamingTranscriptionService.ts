// Streaming transcription service for real-time captions

export interface StreamingCaption {
  id: string;
  text: string;
  speaker: string;
  timestamp: string;
  confidence: number;
  startTime: number;
  endTime: number;
}

class StreamingTranscriptionService {
  private captions: StreamingCaption[] = [];
  private listeners: ((captions: StreamingCaption[]) => void)[] = [];

  /**
   * Subscribe to caption updates
   */
  subscribe(listener: (captions: StreamingCaption[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Add a new caption
   */
  addCaption(caption: StreamingCaption): void {
    this.captions.push(caption);
    this.notifyListeners();
  }

  /**
   * Get all captions
   */
  getCaptions(): StreamingCaption[] {
    return [...this.captions];
  }

  /**
   * Clear all captions
   */
  clearCaptions(): void {
    this.captions = [];
    this.notifyListeners();
  }

  /**
   * Notify all listeners of caption updates
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.captions]));
  }
}

export default new StreamingTranscriptionService();
