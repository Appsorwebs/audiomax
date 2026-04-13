import React from 'react';
import { SpeakerProfile } from '../services/speakerService';

interface SpeakerStats {
  speakerId: string;
  speaker: SpeakerProfile | undefined;
  duration: number;
  percentage: number;
  segmentCount: number;
}

interface SpeakerStatisticsProps {
  stats: SpeakerStats[];
  totalDuration: number;
}

const SpeakerStatistics: React.FC<SpeakerStatisticsProps> = ({ stats, totalDuration }) => {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  if (stats.length === 0) {
    return (
      <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-center">
        <p className="text-slate-600 dark:text-slate-400">
          No speaker data available. Register speakers to see statistics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-lg p-4">
        <h3 className="font-semibold text-orange-700 dark:text-orange-400 mb-3">
          🎤 Speaker Participation
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Total meeting duration: <span className="font-mono font-bold">{formatDuration(totalDuration)}</span>
        </p>
      </div>

      {/* Individual Speaker Stats */}
      <div className="space-y-3">
        {stats.map((stat) => (
          <div key={stat.speakerId} className="bg-slate-100 dark:bg-slate-800/50 rounded-lg overflow-hidden">
            {/* Speaker Header */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {stat.speaker && (
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: stat.speaker.color }}
                    />
                  )}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {stat.speaker?.name || `Unknown Speaker`}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    ({stat.segmentCount} segments)
                  </span>
                </div>
                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {stat.percentage.toFixed(1)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-300 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${stat.percentage}%`,
                    backgroundColor: stat.speaker?.color || '#888',
                    opacity: 0.8,
                  }}
                />
              </div>

              {/* Duration Stats */}
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 flex justify-between">
                <span>Duration: {formatDuration(stat.duration)}</span>
                {stat.speaker && stat.speaker.samples > 0 && (
                  <span>
                    Pitch: {stat.speaker.fundamentalFrequency} Hz
                    {stat.speaker.voiceCharacteristics.maleScore > 0.6
                      ? ' (Male)'
                      : stat.speaker.voiceCharacteristics.maleScore < 0.4
                        ? ' (Female)'
                        : ' (Neutral)'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
          💡 Insights
        </p>
        {stats.length > 1 && (
          <p className="text-xs text-blue-600 dark:text-blue-500">
            The most active speaker ({stats[0].speaker?.name || 'Unknown'}) spoke for{' '}
            {formatDuration(stats[0].duration)} ({stats[0].percentage.toFixed(1)}% of the meeting).
          </p>
        )}
        {stats.length === 1 && (
          <p className="text-xs text-blue-600 dark:text-blue-500">
            Only one identified speaker in this recording. Register more speakers to see participation
            distribution.
          </p>
        )}
      </div>
    </div>
  );
};

export default SpeakerStatistics;
