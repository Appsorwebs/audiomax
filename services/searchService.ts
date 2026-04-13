/**
 * Full-Text Search Service
 * 
 * Indexes and searches meeting transcripts with:
 * - Full-text indexing of all meetings
 * - Relevance ranking based on match frequency and position
 * - Phrase search support
 * - Wildcard/fuzzy matching for typos
 * - Result highlighting
 * - Context extraction around matches
 */

export interface SearchIndex {
  meetingId: string;
  meetingTitle: string;
  content: string; // Full transcript text
  timestamp: number;
  words: Map<string, number[]>; // word -> [positions in content]
}

export interface SearchResult {
  meetingId: string;
  meetingTitle: string;
  matchCount: number;
  relevance: number; // 0-1 score
  snippets: {
    startChar: number;
    endChar: number;
    text: string;
    highlighted: string;
  }[];
  matchPositions: number[];
}

export interface SearchOptions {
  caseSensitive?: boolean;
  exactPhrase?: boolean;
  maxSnippets?: number;
  minRelevance?: number;
  contextLength?: number; // Characters around match
}

class SearchService {
  private indexes: Map<string, SearchIndex> = new Map();

  /**
   * Index a meeting for search
   */
  indexMeeting(
    meetingId: string,
    meetingTitle: string,
    content: string,
    timestamp: number = Date.now()
  ): void {
    const words = this.tokenizeContent(content);
    const wordIndex = this.buildWordIndex(words);

    this.indexes.set(meetingId, {
      meetingId,
      meetingTitle,
      content,
      timestamp,
      words: wordIndex,
    });
  }

  /**
   * Tokenize content into words
   */
  private tokenizeContent(content: string): string[] {
    return (
      content
        .toLowerCase()
        .split(/[\s\n\r,\.!?;:—\-()]+/) // Split on whitespace and common delimiters
        .filter(word => word.length > 0)
    );
  }

  /**
   * Build word index (word -> positions)
   */
  private buildWordIndex(words: string[]): Map<string, number[]> {
    const index = new Map<string, number[]>();

    let charPosition = 0;
    for (const word of words) {
      if (index.has(word)) {
        index.get(word)!.push(charPosition);
      } else {
        index.set(word, [charPosition]);
      }
      charPosition += word.length + 1; // +1 for space
    }

    return index;
  }

  /**
   * Search across all indexed meetings
   */
  search(query: string, options: SearchOptions = {}): SearchResult[] {
    const {
      caseSensitive = false,
      exactPhrase = false,
      maxSnippets = 3,
      minRelevance = 0.1,
      contextLength = 100,
    } = options;

    const results: SearchResult[] = [];

    for (const [, index] of this.indexes) {
      const result = this.searchInMeeting(
        index,
        query,
        exactPhrase,
        caseSensitive,
        maxSnippets,
        contextLength
      );

      if (result && result.relevance >= minRelevance) {
        results.push(result);
      }
    }

    // Sort by relevance
    return results.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Search within a single meeting
   */
  private searchInMeeting(
    index: SearchIndex,
    query: string,
    exactPhrase: boolean,
    caseSensitive: boolean,
    maxSnippets: number,
    contextLength: number
  ): SearchResult | null {
    const searchContent = caseSensitive ? index.content : index.content.toLowerCase();
    const searchQuery = caseSensitive ? query : query.toLowerCase();

    let matchPositions: number[] = [];
    let matchCount = 0;

    if (exactPhrase) {
      // Exact phrase search
      let searchPos = 0;
      while ((searchPos = searchContent.indexOf(searchQuery, searchPos)) !== -1) {
        matchPositions.push(searchPos);
        matchCount++;
        searchPos += searchQuery.length;
      }
    } else {
      // Word-based search with partial matching
      const queryTerms = this.tokenizeContent(query);

      for (const [word, positions] of index.words) {
        // Check if word matches any query term
        if (this.fuzzyMatch(word, queryTerms)) {
          matchPositions.push(...positions);
          matchCount += positions.length;
        }
      }

      // Remove duplicates and sort
      matchPositions = Array.from(new Set(matchPositions)).sort((a, b) => a - b);
    }

    if (matchCount === 0) {
      return null;
    }

    // Extract snippets around matches
    const snippets = this.extractSnippets(
      index.content,
      matchPositions,
      searchQuery,
      maxSnippets,
      contextLength,
      caseSensitive
    );

    // Calculate relevance score
    const relevance = Math.min(1, (matchCount / 10) * Math.min(1, snippets.length / maxSnippets));

    return {
      meetingId: index.meetingId,
      meetingTitle: index.meetingTitle,
      matchCount,
      relevance,
      snippets,
      matchPositions,
    };
  }

  /**
   * Fuzzy match a word against query terms
   */
  private fuzzyMatch(word: string, queryTerms: string[]): boolean {
    for (const term of queryTerms) {
      // Exact match
      if (word === term) return true;

      // Partial match (starts with)
      if (word.startsWith(term)) return true;

      // Levenshtein distance for typos (allow 1 character difference for short words)
      if (term.length <= 4 && this.levenshteinDistance(word, term) <= 1) {
        return true;
      }
      if (term.length > 4 && this.levenshteinDistance(word, term) <= 2) {
        return true;
      }
    }
    return false;
  }

  /**
   * Calculate Levenshtein distance for fuzzy matching
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Extract snippets with context around matches
   */
  private extractSnippets(
    content: string,
    positions: number[],
    query: string,
    maxSnippets: number,
    contextLength: number,
    caseSensitive: boolean
  ): SearchResult['snippets'] {
    const snippets: SearchResult['snippets'] = [];
    const processedRanges: [number, number][] = [];

    for (const pos of positions) {
      if (snippets.length >= maxSnippets) break;

      // Find word boundaries
      let startChar = Math.max(0, pos - contextLength);
      let endChar = Math.min(content.length, pos + query.length + contextLength);

      // Expand to word boundaries
      while (startChar > 0 && content[startChar - 1] !== ' ' && content[startChar - 1] !== '\n') {
        startChar--;
      }
      while (endChar < content.length && content[endChar] !== ' ' && content[endChar] !== '\n') {
        endChar++;
      }

      // Skip if overlaps with existing snippet
      if (
        processedRanges.some(
          ([existingStart, existingEnd]) =>
            !(endChar < existingStart || startChar > existingEnd)
        )
      ) {
        continue;
      }

      const text = content.substring(startChar, endChar);

      // Highlight the matched text
      const relativePos = pos - startChar;
      const before = text.substring(0, relativePos);
      const matched = text.substring(relativePos, relativePos + query.length);
      const after = text.substring(relativePos + query.length);
      const highlighted = `${before}<mark>${matched}</mark>${after}`;

      snippets.push({
        startChar,
        endChar,
        text: text.trim(),
        highlighted: highlighted.trim(),
      });

      processedRanges.push([startChar, endChar]);
    }

    return snippets;
  }

  /**
   * Search by speaker
   */
  searchSpeaker(speakerName: string): SearchResult[] {
    const speakerPattern = `${speakerName}:`;
    const results: SearchResult[] = [];

    for (const [, index] of this.indexes) {
      const speakerLines = index.content
        .split('\n')
        .filter(line => line.toLowerCase().includes(speakerPattern.toLowerCase()));

      if (speakerLines.length > 0) {
        const content = speakerLines.join('\n');
        const result = this.searchInMeeting(
          { ...index, content },
          speakerName,
          false,
          false,
          10,
          50
        );

        if (result) {
          results.push(result);
        }
      }
    }

    return results;
  }

  /**
   * Get search suggestions
   */
  getSuggestions(prefix: string, limit: number = 5): string[] {
    const suggestions = new Set<string>();

    for (const [, index] of this.indexes) {
      for (const word of index.words.keys()) {
        if (word.startsWith(prefix.toLowerCase())) {
          suggestions.add(word);
          if (suggestions.size >= limit) {
            return Array.from(suggestions);
          }
        }
      }
    }

    return Array.from(suggestions);
  }

  /**
   * Clear all indexes
   */
  clearIndex(): void {
    this.indexes.clear();
  }

  /**
   * Remove a meeting from index
   */
  removeMeeting(meetingId: string): void {
    this.indexes.delete(meetingId);
  }

  /**
   * Get index statistics
   */
  getStats(): {
    meetingsIndexed: number;
    totalWords: number;
    totalCharacters: number;
  } {
    let totalWords = 0;
    let totalCharacters = 0;

    for (const [, index] of this.indexes) {
      totalWords += index.words.size;
      totalCharacters += index.content.length;
    }

    return {
      meetingsIndexed: this.indexes.size,
      totalWords,
      totalCharacters,
    };
  }
}

// Export singleton instance
export const searchService = new SearchService();
