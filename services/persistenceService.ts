import { DEFAULT_PERSISTENT_STATE, PersistentAppState } from '../shared/persistentState';

interface StateResponse {
  state: PersistentAppState;
  isNew: boolean;
}

let loadPromise: Promise<PersistentAppState> | null = null;
let saveQueue: Promise<void> = Promise.resolve();

const parseLegacyValue = <T,>(key: string): T | undefined => {
  const value = localStorage.getItem(key);
  if (!value) return undefined;

  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
};

const getLegacyState = (): Partial<PersistentAppState> => ({
  notes: parseLegacyValue<PersistentAppState['notes']>('hearth-notes'),
  familyEvents: parseLegacyValue<PersistentAppState['familyEvents']>('hearth_local_events_cache'),
  dinnerPlan: parseLegacyValue<PersistentAppState['dinnerPlan']>('hearth_dinner_plan_cache'),
  savedRecipes: parseLegacyValue<PersistentAppState['savedRecipes']>('hearth_saved_recipes'),
  briefingStatus: parseLegacyValue<PersistentAppState['briefingStatus']>('hearth_briefing_status'),
  location: localStorage.getItem('hearth_user_location') || undefined,
});

export const updatePersistentState = (patch: Partial<PersistentAppState>): Promise<void> => {
  saveQueue = saveQueue.catch(() => undefined).then(async () => {
    const response = await fetch('/api/state', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      throw new Error(`Unable to save Hearth data (${response.status})`);
    }
  });

  return saveQueue;
};

export const loadPersistentState = (): Promise<PersistentAppState> => {
  if (!loadPromise) {
    loadPromise = (async () => {
      const response = await fetch('/api/state');
      if (!response.ok) {
        throw new Error(`Unable to load Hearth data (${response.status})`);
      }

      const result = await response.json() as StateResponse;
      const serverState = { ...DEFAULT_PERSISTENT_STATE, ...result.state };

      if (!result.isNew) return serverState;

      const legacyState = getLegacyState();
      const migratedState = Object.fromEntries(
        Object.entries({ ...serverState, ...legacyState }).filter(([, value]) => value !== undefined)
      ) as unknown as PersistentAppState;

      await updatePersistentState(migratedState);
      return migratedState;
    })().catch((error) => {
      // A transient backend/network failure must not poison all later retries.
      loadPromise = null;
      throw error;
    });
  }

  return loadPromise;
};
