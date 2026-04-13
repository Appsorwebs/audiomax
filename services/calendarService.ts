/**
 * Calendar Integration Service
 * 
 * Handles Google Calendar and Outlook integration for:
 * - Fetching upcoming events
 * - Creating new calendar events
 * - Syncing transcriptions back to calendar
 * - Supporting 3 OAuth flows (Google, Outlook, Offline mode)
 */

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  attendees?: CalendarAttendee[];
  location?: string;
  calendarType: 'google' | 'outlook' | 'manual';
  eventUrl?: string;
}

export interface CalendarAttendee {
  email: string;
  name?: string;
  responseStatus?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
}

export interface CalendarAuth {
  type: 'google' | 'outlook' | 'none';
  accessToken?: string;
  expiresAt?: number;
  email?: string;
}

class CalendarService {
  private auth: CalendarAuth = { type: 'none' };
  private readonly GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID || '';
  private readonly OUTLOOK_CLIENT_ID = import.meta.env.VITE_OUTLOOK_CLIENT_ID || '';
  private readonly REDIRECT_URI = window.location.origin + '/auth/callback';

  /**
   * Initialize Google Calendar OAuth
   */
  async initGoogleCalendar(): Promise<void> {
    if (!this.GOOGLE_CLIENT_ID) {
      console.warn('Google Calendar Client ID not configured');
      return;
    }

    // In a production app, you'd use the Google API client library
    // For now, we'll create a helper for OAuth flow
    const scopes = 'https://www.googleapis.com/auth/calendar';
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', this.GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', this.REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('access_type', 'offline');

    // Store auth context
    sessionStorage.setItem('calendarAuthFlow', 'google');

    // In production: window.location.href = authUrl.toString();
    // For MVP: This would be triggered by user clicking "Connect Google Calendar"
    console.log('Google Calendar OAuth URL ready:', authUrl.toString());
  }

  /**
   * Initialize Outlook Calendar OAuth
   */
  async initOutlookCalendar(): Promise<void> {
    if (!this.OUTLOOK_CLIENT_ID) {
      console.warn('Outlook Client ID not configured');
      return;
    }

    const scopes = 'Calendars.Read%20Calendars.ReadWrite%20offline_access';
    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', this.OUTLOOK_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', this.REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);

    sessionStorage.setItem('calendarAuthFlow', 'outlook');
    console.log('Outlook Calendar OAuth URL ready:', authUrl.toString());
  }

  /**
   * Fetch upcoming calendar events (next 30 days)
   */
  async fetchUpcomingEvents(daysAhead: number = 30): Promise<CalendarEvent[]> {
    if (this.auth.type === 'none') {
      console.warn('No calendar authentication configured');
      return this.generateMockEvents(daysAhead);
    }

    try {
      if (this.auth.type === 'google') {
        return await this.fetchGoogleEvents(daysAhead);
      } else if (this.auth.type === 'outlook') {
        return await this.fetchOutlookEvents(daysAhead);
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return this.generateMockEvents(daysAhead);
    }

    return [];
  }

  /**
   * Fetch events from Google Calendar API
   */
  private async fetchGoogleEvents(daysAhead: number): Promise<CalendarEvent[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      timeMin: now.toISOString(),
      timeMax: futureDate.toISOString(),
      maxResults: '25',
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        {
          headers: {
            Authorization: `Bearer ${this.auth.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch Google Calendar events');

      const data = await response.json();
      return (data.items || []).map((event: any) => ({
        id: event.id,
        title: event.summary,
        description: event.description,
        startTime: event.start.dateTime || event.start.date,
        endTime: event.end.dateTime || event.end.date,
        attendees: (event.attendees || []).map((attendee: any) => ({
          email: attendee.email,
          name: attendee.displayName,
          responseStatus: attendee.responseStatus,
        })),
        location: event.location,
        calendarType: 'google',
        eventUrl: event.htmlLink,
      }));
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      return [];
    }
  }

  /**
   * Fetch events from Outlook Calendar API
   */
  private async fetchOutlookEvents(daysAhead: number): Promise<CalendarEvent[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      $filter: `start/dateTime ge '${now.toISOString()}' and start/dateTime lt '${futureDate.toISOString()}'`,
      $orderby: 'start/dateTime',
      $select: 'id,subject,bodyPreview,start,end,attendees,locations,isReminderOn,webLink',
    });

    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendarview?${params}`,
        {
          headers: {
            Authorization: `Bearer ${this.auth.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch Outlook Calendar events');

      const data = await response.json();
      return (data.value || []).map((event: any) => ({
        id: event.id,
        title: event.subject,
        description: event.bodyPreview,
        startTime: event.start.dateTime,
        endTime: event.end.dateTime,
        attendees: (event.attendees || []).map((attendee: any) => ({
          email: attendee.emailAddress.address,
          name: attendee.emailAddress.name,
          responseStatus: attendee.status.response.toLowerCase(),
        })),
        location: event.locations?.[0]?.displayName,
        calendarType: 'outlook',
        eventUrl: event.webLink,
      }));
    } catch (error) {
      console.error('Error fetching Outlook Calendar events:', error);
      return [];
    }
  }

  /**
   * Generate mock events for demo/offline mode
   * Shows realistic meeting scenarios
   */
  private generateMockEvents(daysAhead: number): CalendarEvent[] {
    const mockTitles = [
      'Team Standup',
      'Product Planning Session',
      'Client Call - Q1 Review',
      'Engineering Sync',
      'Marketing Strategy Discussion',
      'Investor Pitch Prep',
      'Design Review',
      '1-on-1 Check-in',
    ];

    const mockAttendees = [
      { email: 'sarah@company.com', name: 'Sarah Chen' },
      { email: 'james@company.com', name: 'James Wilson' },
      { email: 'maya@company.com', name: 'Maya Patel' },
      { email: 'alex@company.com', name: 'Alex Rodriguez' },
    ];

    const events: CalendarEvent[] = [];
    const now = new Date();

    for (let i = 1; i <= Math.min(5, daysAhead); i++) {
      const eventDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);

      // Random hour between 9 AM and 5 PM
      const hour = Math.floor(Math.random() * 8) + 9;
      const duration = Math.random() > 0.5 ? 30 : 60;

      const startTime = new Date(eventDate);
      startTime.setHours(hour, 0, 0, 0);

      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      events.push({
        id: `mock-${i}-${Date.now()}`,
        title: mockTitles[Math.floor(Math.random() * mockTitles.length)],
        description: 'Demo event for calendar integration testing',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        attendees: [
          mockAttendees[Math.floor(Math.random() * mockAttendees.length)],
          mockAttendees[Math.floor(Math.random() * mockAttendees.length)],
        ],
        location: `Conference Room ${String.fromCharCode(65 + Math.floor(Math.random() * 3))}`,
        calendarType: 'manual',
      });
    }

    return events;
  }

  /**
   * Create a calendar event
   */
  async createCalendarEvent(event: Omit<CalendarEvent, 'id'>): Promise<string | null> {
    if (this.auth.type === 'google') {
      return this.createGoogleEvent(event);
    } else if (this.auth.type === 'outlook') {
      return this.createOutlookEvent(event);
    }

    console.warn('No calendar auth configured for creating events');
    return null;
  }

  /**
   * Create event in Google Calendar
   */
  private async createGoogleEvent(event: Omit<CalendarEvent, 'id'>): Promise<string | null> {
    const eventBody = {
      summary: event.title,
      description: event.description,
      start: { dateTime: event.startTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      end: { dateTime: event.endTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      attendees: event.attendees?.map(a => ({ email: a.email, displayName: a.name })),
      location: event.location,
    };

    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.auth.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventBody),
        }
      );

      if (!response.ok) throw new Error('Failed to create Google Calendar event');

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      return null;
    }
  }

  /**
   * Create event in Outlook Calendar
   */
  private async createOutlookEvent(event: Omit<CalendarEvent, 'id'>): Promise<string | null> {
    const eventBody = {
      subject: event.title,
      bodyPreview: event.description,
      start: { dateTime: new Date(event.startTime).toISOString().split('Z')[0], timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      end: { dateTime: new Date(event.endTime).toISOString().split('Z')[0], timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      attendees: event.attendees?.map(a => ({
        emailAddress: { address: a.email, name: a.name },
      })),
      location: event.location ? { displayName: event.location } : undefined,
    };

    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.auth.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      });

      if (!response.ok) throw new Error('Failed to create Outlook Calendar event');

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error creating Outlook Calendar event:', error);
      return null;
    }
  }

  /**
   * Update calendar event with transcription summary
   */
  async updateEventWithTranscription(
    eventId: string,
    summary: string,
    transcriptUrl?: string,
  ): Promise<boolean> {
    if (this.auth.type === 'google') {
      return this.updateGoogleEvent(eventId, summary, transcriptUrl);
    } else if (this.auth.type === 'outlook') {
      return this.updateOutlookEvent(eventId, summary, transcriptUrl);
    }

    return false;
  }

  /**
   * Update Google Calendar event
   */
  private async updateGoogleEvent(
    eventId: string,
    summary: string,
    transcriptUrl?: string,
  ): Promise<boolean> {
    try {
      const currentEvent = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          headers: { Authorization: `Bearer ${this.auth.accessToken}` },
        }
      ).then(r => r.json());

      const updatedDescription = `${currentEvent.description || ''}\n\n---\nTranscription Summary:\n${summary}${transcriptUrl ? `\n\nView full transcript: ${transcriptUrl}` : ''}`;

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.auth.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ description: updatedDescription }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      return false;
    }
  }

  /**
   * Update Outlook Calendar event
   */
  private async updateOutlookEvent(
    eventId: string,
    summary: string,
    transcriptUrl?: string,
  ): Promise<boolean> {
    try {
      const body = {
        bodyPreview: `Transcription Summary:\n${summary}${transcriptUrl ? `\n\nView full transcript: ${transcriptUrl}` : ''}`,
      };

      const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.auth.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating Outlook Calendar event:', error);
      return false;
    }
  }

  /**
   * Set authentication token (called after OAuth callback)
   */
  setAuth(type: 'google' | 'outlook', accessToken: string, expiresIn: number = 3600): void {
    this.auth = {
      type,
      accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
    };

    // Persist to localStorage for session recovery
    localStorage.setItem('calendarAuth', JSON.stringify({ type, expiresAt: this.auth.expiresAt }));
  }

  /**
   * Get current authentication status
   */
  getAuthStatus(): CalendarAuth {
    return this.auth;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    if (!this.auth.expiresAt) return true;
    return Date.now() > this.auth.expiresAt;
  }

  /**
   * Clear authentication
   */
  clearAuth(): void {
    this.auth = { type: 'none' };
    localStorage.removeItem('calendarAuth');
  }
}

// Export singleton instance
export const calendarService = new CalendarService();
