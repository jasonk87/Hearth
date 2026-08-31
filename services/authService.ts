// services/authService.ts
import { googleLogout } from '@react-oauth/google';
import axios from 'axios';
import { GoogleProfile, GoogleCalendarEvent } from '../types';

const ACCESS_TOKEN_KEY = 'google_access_token';
const GOOGLE_ACCOUNT_KEY = 'hearth_google_account';
const USE_FAKE_DATA = import.meta.env.VITE_USE_FAKE_DATA === 'true';

export const setAccessToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

export const getAccessToken = () => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export const logout = () => {
  googleLogout();
  setAccessToken(null);
  clearCalendarCache();
  localStorage.removeItem(GOOGLE_ACCOUNT_KEY);
};

export const getProfile = async (): Promise<GoogleProfile | null> => {
  if (USE_FAKE_DATA) {
    return {
      name: "Test User",
      picture: "https://via.placeholder.com/150",
    };
  }
  const accessToken = getAccessToken();
  if (accessToken) {
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        });
        return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }
  return null;
};


const CALENDAR_CACHE_KEY = 'hearth_calendar_cache_v3';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

const calendarCacheKey = () => {
  const account = localStorage.getItem(GOOGLE_ACCOUNT_KEY);
  return account ? `${CALENDAR_CACHE_KEY}:${account}` : null;
};

export const setCalendarAccount = (account: string | null | undefined) => {
  if (account) localStorage.setItem(GOOGLE_ACCOUNT_KEY, account.toLowerCase());
  else localStorage.removeItem(GOOGLE_ACCOUNT_KEY);
};

export const clearCalendarCache = () => {
  const activeKey = calendarCacheKey();
  if (activeKey) localStorage.removeItem(activeKey);
};

export const getCalendarEvents = async (forceRefresh = false): Promise<GoogleCalendarEvent[]> => {
  if (USE_FAKE_DATA) {
    return [
      {
        id: '1',
        summary: 'Fake Event 1',
        start: { dateTime: new Date().toISOString() },
        attendees: [{ email: 'test@example.com' }],
      },
      {
        id: '2',
        summary: 'Fake Event 2',
        start: { dateTime: new Date().toISOString() },
        attendees: [],
      },
    ];
  }
  
  if (!forceRefresh) {
    const cacheKey = calendarCacheKey();
    const cachedData = cacheKey ? localStorage.getItem(cacheKey) : null;
    if (cachedData) {
      try {
        const { timestamp, events } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_DURATION_MS) {
          console.log("HEARTH DEBUG: Using cached calendar events");
          return events;
        }
      } catch (e) {
        console.error("Failed to parse calendar cache", e);
      }
    }
  }

  const accessToken = getAccessToken();
  if (accessToken) {
    try {
      // 1. Fetch user's calendar list
      const calendarListResponse = await axios.get('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const calendars = calendarListResponse.data.items || [];
      console.log("HEARTH DEBUG: Raw calendars list from Google:", calendars);

      // 2. Filter to find the primary, family, and holiday calendars
      const targetCalendars = calendars.filter((cal: any) => {
        const summary = cal.summary ? cal.summary.toLowerCase() : '';
        return cal.primary || cal.selected || summary.includes('family') || summary.includes('holiday');
      });
      console.log("HEARTH DEBUG: Target calendars identified:", targetCalendars);

      // Default to primary if list is empty
      if (targetCalendars.length === 0) {
        targetCalendars.push({ id: 'primary', summary: 'Primary' });
      }

      const allEvents: GoogleCalendarEvent[] = [];

      const timeMin = new Date();
      timeMin.setMonth(timeMin.getMonth() - 1); // 1 month ago
      
      const timeMax = new Date();
      timeMax.setMonth(timeMax.getMonth() + 6); // 6 months in the future

      // 3. Fetch events from target calendars
      for (const cal of targetCalendars) {
        try {
          const eventsResponse = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              singleEvents: true,
              orderBy: 'startTime',
              timeMin: timeMin.toISOString(),
              timeMax: timeMax.toISOString()
            }
          });
          console.log(`HEARTH DEBUG: Events response for ${cal.summary}:`, eventsResponse.data);
          const items = eventsResponse.data.items || [];
          items.forEach((item: any) => {
              item.backgroundColor = cal.backgroundColor;
              item.calendarName = cal.summary;
          });
          allEvents.push(...items);
        } catch (err) {
          console.error(`Failed to fetch events for calendar ${cal.summary} (${cal.id}):`, err);
        }
      }

      // Deduplicate events by id
      const uniqueEventsMap = new Map<string, GoogleCalendarEvent>();
      allEvents.forEach(e => {
        if (e.id) {
          uniqueEventsMap.set(e.id, e);
        }
      });

      const finalEvents = Array.from(uniqueEventsMap.values());
      console.log("HEARTH DEBUG: Combined and deduplicated events:", finalEvents);
      
      // Update cache
      const cacheKey = calendarCacheKey();
      if (cacheKey) localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), events: finalEvents }));

      return finalEvents;
    } catch (error: any) {
      console.error('Error fetching calendar events:', error);
      if (error.response && error.response.data) {
        console.error("Google API Response Error: ", error.response.data);
      } else {
        console.error("Google API Error: ", error.message || error);
      }
      throw error;
    }
  }
  return [];
};

