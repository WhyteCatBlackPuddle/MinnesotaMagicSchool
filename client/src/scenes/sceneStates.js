export const SCENE_VOCABULARY = Object.freeze({
  timeOfDay: ['day', 'night'],
  weather: ['clear', 'heavy_fog'],
  lighting: ['normal', 'dark', 'flickering'],
  effects: ['blue_glow', 'ripples'],
  activities: ['investigation', 'abandoned'],
});

export const SCENE_STATES = Object.freeze({
  peaceful: {
    id: 'peaceful',
    label: 'Peaceful Morning',
    summary: 'A mild morning settles over the lake. Canoes drift at their ropes and the lodges are only beginning to wake.',
    timeOfDay: 'day',
    weather: 'clear',
    season: 'late_autumn',
    focusLocation: null,
    locationStates: [
      { locationId: 'one-wood-lodge', lighting: 'normal', activity: 'quiet', effect: null },
      { locationId: 'driftwood-houseboat', lighting: 'normal', activity: 'quiet', effect: 'ripples' },
      { locationId: 'white-pine-treefort', lighting: 'normal', activity: 'quiet', effect: null },
    ],
    characters: [],
  },
  curfew: {
    id: 'curfew',
    label: 'Fogbound Curfew',
    summary: 'Curfew bells have sounded. Warm windows hold back the fog while every trail into the pines disappears.',
    timeOfDay: 'night',
    weather: 'heavy_fog',
    season: 'late_autumn',
    focusLocation: 'one-wood-lodge',
    locationStates: [
      { locationId: 'one-wood-lodge', lighting: 'normal', activity: 'quiet', effect: null },
      { locationId: 'driftwood-houseboat', lighting: 'normal', activity: 'abandoned', effect: 'ripples' },
      { locationId: 'white-pine-treefort', lighting: 'normal', activity: 'quiet', effect: null },
    ],
    characters: [],
  },
  emergency: {
    id: 'emergency',
    label: 'Magical Emergency',
    summary: 'The watch bell is ringing. One Wood is dark, the treefort lights are stuttering, and something blue is answering from the north dock.',
    timeOfDay: 'night',
    weather: 'heavy_fog',
    season: 'late_autumn',
    focusLocation: 'north-dock',
    locationStates: [
      { locationId: 'one-wood-lodge', lighting: 'dark', activity: 'investigation', effect: null },
      { locationId: 'driftwood-houseboat', lighting: 'normal', activity: 'abandoned', effect: 'ripples' },
      { locationId: 'white-pine-treefort', lighting: 'flickering', activity: 'investigation', effect: 'blue_glow' },
      { locationId: 'north-dock', lighting: 'dark', activity: 'investigation', effect: 'blue_glow' },
    ],
    characters: [{ studentId: 12, locationId: 'north-dock', status: 'missing' }],
  },
});

export function getLocationState(sceneState, locationId) {
  return sceneState.locationStates.find((location) => location.locationId === locationId) ?? {
    locationId,
    lighting: 'normal',
    activity: 'quiet',
    effect: null,
  };
}
