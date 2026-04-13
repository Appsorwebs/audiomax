import React from 'react';
import { type CalendarEvent } from '../services/calendarService';

interface SelectedEventInfoProps {
  event: CalendarEvent;
  onChangeEvent: () => void;
}

const SelectedEventInfo: React.FC<SelectedEventInfoProps> = ({ event, onChangeEvent }) => {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateDuration = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const minutes = Math.round((endTime - startTime) / 60000);
    return `${minutes} min`;
  };

  return (
    <div className="bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20 dark:border-sky-500/30 rounded-xl p-4 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            📅 {event.title}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Linked to calendar event
          </p>
        </div>
        <button
          onClick={onChangeEvent}
          className="px-2 py-1 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 rounded transition"
        >
          Change →
        </button>
      </div>

      {/* Event Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        {/* Date */}
        <div className="bg-white dark:bg-slate-800 rounded p-2">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Date</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {formatDate(event.startTime)}
          </p>
        </div>

        {/* Time */}
        <div className="bg-white dark:bg-slate-800 rounded p-2">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Time</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">
            {formatTime(event.startTime)}
          </p>
        </div>

        {/* Duration */}
        <div className="bg-white dark:bg-slate-800 rounded p-2">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Duration</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {calculateDuration(event.startTime, event.endTime)}
          </p>
        </div>

        {/* Calendar Type */}
        <div className="bg-white dark:bg-slate-800 rounded p-2">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Calendar</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
            {event.calendarType === 'google'
              ? '🔵 Google'
              : event.calendarType === 'outlook'
                ? '🟣 Outlook'
                : '⚪ Manual'}
          </p>
        </div>
      </div>

      {/* Location */}
      {event.location && (
        <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded mb-3">
          <span className="text-sm">📍</span>
          <span className="text-sm text-slate-700 dark:text-slate-300">{event.location}</span>
        </div>
      )}

      {/* Attendees */}
      {event.attendees && event.attendees.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-2">
            Attendees ({event.attendees.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {event.attendees.map((attendee, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-full px-2 py-1"
              >
                <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-xs flex items-center justify-center font-bold">
                  {(attendee.name || attendee.email)[0].toUpperCase()}
                </span>
                <span className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-xs">
                  {attendee.name || attendee.email.split('@')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {event.description && (
        <div className="pt-3 border-t border-sky-500/20">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">
            Description
          </p>
          <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
            {event.description}
          </p>
        </div>
      )}

      {/* Sync Badge */}
      <div className="mt-3 flex items-center gap-2 text-xs text-sky-600 dark:text-sky-400">
        <span className="inline-block h-2 w-2 bg-sky-500 rounded-full animate-pulse" />
        Transcript will sync to calendar after recording
      </div>
    </div>
  );
};

export default SelectedEventInfo;
