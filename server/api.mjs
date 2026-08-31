import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';

const stateFile = path.resolve(process.cwd(), 'data', 'hearth-state.json');
const stateKeys = ['groceryList', 'notes', 'familyEvents', 'dinnerPlan', 'savedRecipes', 'location', 'briefingStatus', 'chatMessages', 'story'];
const defaultState = { groceryList: [], notes: [], familyEvents: [], dinnerPlan: {}, savedRecipes: [], location: '', briefingStatus: {}, chatMessages: [], story: [] };
let writeQueue = Promise.resolve();

const readState = async () => {
  try { return { state: { ...defaultState, ...JSON.parse(await readFile(stateFile, 'utf8')) }, isNew: false }; }
  catch (error) {
    if (error.code !== 'ENOENT') console.error('Unable to read persisted Hearth state:', error);
    return { state: defaultState, isNew: true };
  }
};

const readBody = async (request) => {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 25 * 1024 * 1024) throw new Error('Request payload is too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
};

const sendJson = (response, status, data) => {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(data));
};

const requireKey = (name) => {
  const key = process.env[name];
  if (!key || key.startsWith('YOUR_')) throw new Error(`${name} is not configured on the server.`);
  return key;
};

const weatherCondition = (code) => {
  if ([0, 1].includes(code)) return 'sunny';
  if ([2, 3, 45, 48].includes(code)) return code === 2 ? 'partly-cloudy' : 'cloudy';
  if ([95, 96, 99].includes(code)) return 'stormy';
  return 'rainy';
};

const getWeather = async (location) => {
  if (!location?.trim()) throw new Error('A saved location is required for weather.');
  const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`);
  const place = (await geo.json()).results?.[0];
  if (!place) throw new Error('Location was not found.');
  const forecast = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&temperature_unit=fahrenheit&daily=temperature_2m_max,weather_code&hourly=temperature_2m,weather_code&forecast_days=7&timezone=auto`);
  const data = await forecast.json();
  return data.daily.time.map((date, index) => {
    const item = { day: new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' }), temp: Math.round(data.daily.temperature_2m_max[index]), condition: weatherCondition(data.daily.weather_code[index]) };
    if (index === 0) {
      const hours = data.hourly.time.map((time, hourIndex) => ({ time, hourIndex })).filter(({ time }) => ['09:00', '12:00', '15:00', '18:00'].some(hour => time.endsWith(hour)));
      item.hourly = hours.map(({ time, hourIndex }) => ({ time: new Date(time).toLocaleTimeString('en-US', { hour: 'numeric' }), temp: Math.round(data.hourly.temperature_2m[hourIndex]), condition: weatherCondition(data.hourly.weather_code[hourIndex]) }));
    }
    return item;
  });
};

export const handleApiRequest = async (request, response) => {
  const url = new URL(request.url, 'http://localhost');
  try {
    if (url.pathname === '/api/state') {
      if (request.method === 'GET') return sendJson(response, 200, await readState());
      if (request.method !== 'PATCH') return sendJson(response, 405, { error: 'Method not allowed.' });
      const body = await readBody(request);
      if (!body || typeof body !== 'object' || Array.isArray(body)) return sendJson(response, 400, { error: 'A JSON object is required.' });
      const patch = Object.fromEntries(Object.entries(body).filter(([key]) => stateKeys.includes(key)));
      writeQueue = writeQueue.catch(() => undefined).then(async () => {
        const { state } = await readState();
        await mkdir(path.dirname(stateFile), { recursive: true });
        await writeFile(stateFile, `${JSON.stringify({ ...state, ...patch }, null, 2)}\n`, 'utf8');
      });
      await writeQueue;
      return sendJson(response, 200, { ok: true });
    }

    if (url.pathname === '/api/weather' && request.method === 'GET') return sendJson(response, 200, await getWeather(url.searchParams.get('location')));

    if (url.pathname === '/api/gemini/content' && request.method === 'POST') {
      const body = await readBody(request);
      const ai = new GoogleGenAI({ apiKey: requireKey('GEMINI_API_KEY') });
      const result = await ai.models.generateContent(body);
      return sendJson(response, 200, { text: result.text, candidates: result.candidates });
    }
    if (url.pathname === '/api/gemini/images' && request.method === 'POST') {
      const body = await readBody(request);
      const ai = new GoogleGenAI({ apiKey: requireKey('GEMINI_API_KEY') });
      const result = await ai.models.generateImages(body);
      return sendJson(response, 200, { generatedImages: result.generatedImages });
    }

    if (url.pathname === '/api/serp/search.json' && request.method === 'GET') {
      const params = new URLSearchParams(url.searchParams);
      params.set('api_key', requireKey('SERPAPI_KEY'));
      const upstream = await fetch(`https://serpapi.com/search.json?${params}`);
      return sendJson(response, upstream.status, await upstream.json());
    }
    if (url.pathname.startsWith('/api/recipes/') && request.method === 'GET') {
      const endpoint = url.pathname.replace('/api/recipes/', '');
      if (!['random', 'complexSearch'].includes(endpoint)) return sendJson(response, 404, { error: 'Unknown recipe endpoint.' });
      const params = new URLSearchParams(url.searchParams);
      params.set('apiKey', requireKey('SPOONACULAR_API_KEY'));
      const upstream = await fetch(`https://api.spoonacular.com/recipes/${endpoint}?${params}`);
      return sendJson(response, upstream.status, await upstream.json());
    }
    return false;
  } catch (error) {
    console.error('Hearth API error:', error);
    return sendJson(response, 500, { error: error instanceof Error ? error.message : 'Unable to process request.' });
  }
};
