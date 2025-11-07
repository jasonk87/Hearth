// services/authService.ts
import { googleLogout } from '@react-oauth/google';
import axios from 'axios';
import { GoogleProfile, GoogleCalendarEvent } from '../types';

const ACCESS_TOKEN_KEY = 'google_access_token';
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


export const getCalendarEvents = async (): Promise<GoogleCalendarEvent[]> => {
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
  const accessToken = getAccessToken();
  if (accessToken) {
    try {
      const response = await axios.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data.items;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }
  return [];
};
