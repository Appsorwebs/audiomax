import React, { useState, useEffect } from 'react';
import { calendarService, type CalendarEvent } from '../services/calendarService';

interface CalendarSelectorProps {
  onSelectEvent: (event: CalendarEvent) => void;
  onClose: () => void;
  selectedEvent?: CalendarEvent;
}

const CalendarSelector: React.FC<CalendarSelectorProps> = ({
  onSelectEvent,
  onClose,
  selectedEvent,
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyUpcoming, setShowOnlyUpcoming] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const upcomingEvents = await calendarService.fetchUpcomingEvents(30);
      setEvents(upcomingEvents);
    } catch (err) {
      setError('Failed to load calendar events. Using demo events.');
      // Fallback to demo events is handled in the service
      const demoEvents = await calendarService.fetchUpcomingEvents(30);
      setEvents(demoEvents);
    } finally {
      setLoading(false);
    }
  };

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
      month: 'short',
      day: 'numeric',
    });
  };

  const isEventUpcoming = (startTime: string) => {
    return new Date(startTime) > new Date();
  };

  const filteredEvents = showOnlyUpcoming ? events.filter(e => isEventUpcoming(e.startTime)) : events;

  const getCalendarBadgeColor = (type: string) => {
    switch (type) {
      case 'google':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'outlook':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 to-blue-600 p-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>📅</span>
            Select Calendar Event
          </h2>
          <p className="text-sky-100 text-sm mt-1">
            Choose an event from your calendar to link with this recording
          </p>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {/* Filter Toggle */}
          <div className="mb-4 flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyUpcoming}
                onChange={(e) => setShowOnlyUpcoming(e.target.checked)}
                className="w-4 h-4 rounded accent-sky-500"
              />
              <span className="text-slate-700 dark:text-slate-300">Show only upcoming events</span>
            </label>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-600 dark:text-amber-400">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border border-sky-500 border-t-transparent" />
            </div>
          )}

          {/* Events List */}
          {!loading && filteredEvents.length > 0 ? (
            <div className="space-y-2">
              {filteredEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => {
                    onSelectEvent(event);
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedEvent?.id === event.id
                      ? 'bg-sky-500/10 border-sky-500 dark:border-sky-400'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-sky-500/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {event.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium border ${getCalendarBadgeColor(event.calendarType)}`}
                        >
                          {event.calendarType === 'google'
                            ? 'Google'
                            : event.calendarType === 'outlook'
                              ? 'Outlook'
                              : 'Manual'}
                        </span>
                      </div>

                      {/* Date and Time */}
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-2">
                        <span className="flex items-center gap-1">
                          📆 {formatDate(event.startTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          🕐
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </span>
                      </div>

                      {/* Location */}
                      {event.location && (
                        <div className="text-xs text-slate-500 dark:text-slate-500 mb-2">
                          📍 {event.location}
                        </div>
                      )}

                      {/* Attendees */}
                      {event.attendees && event.attendees.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                            Attendees:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {event.attendees.slice(0, 3).map((attendee, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-2 py-1 bg-slate-200 dark:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 rounded-full truncate max-w-xs"
                              >
                                {attendee.name || attendee.email.split('@')[0]}
                              </span>
                            ))}
                            {event.attendees.length > 3 && (
                              <span className="inline-block px-2 py-1 bg-slate-200 dark:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 rounded-full">
                                +{event.attendees.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Selection Indicator */}
                    {selectedEvent?.id === event.id && (
                      <div className="ml-4 text-sky-500">
                        <span className="text-xl">✓</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : !loading ? (
            <div className="py-8 text-center">
              <p className="text-slate-500 dark:text-slate-400 mb-2">
                {showOnlyUpcoming ? 'No upcoming events' : 'No events found'}
              </p>
              <button
                onClick={() => setShowOnlyUpcoming(!showOnlyUpcoming)}
                className="text-sm text-sky-500 hover:text-sky-600 font-medium"
              >
                {showOnlyUpcoming ? 'Show all events' : 'Show upcoming only'}
              </button>
            </div>
          ) : null}

          {/* Manual Event Option */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
              Can't find your event?
            </p>
            <button
              onClick={() => onClose()}
              className="text-sm text-sky-500 hover:text-sky-600 font-medium"
            >
              Create manual meeting entry →
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 dark:bg-slate-800 px-6 py-4 flex justify-between border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
          >
            🔄 Refresh
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarSelector;
