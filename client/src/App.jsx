import { useMemo, useState } from 'react';
import LodgeInfoPanel from './components/LodgeInfoPanel.jsx';
import useAcademyLocations from './hooks/useAcademyLocations.js';
import LivingMap, { LODGES } from './scenes/LivingMap.jsx';
import { getLocationState, SCENE_STATES } from './scenes/sceneStates.js';

const SCENE_OPTIONS = Object.values(SCENE_STATES);

export default function App() {
  const [sceneState, setSceneState] = useState(SCENE_STATES.peaceful);
  const [selectedLodgeId, setSelectedLodgeId] = useState(null);
  const { locations, status: atlasStatus } = useAcademyLocations();

  const selectedLodge = useMemo(
    () => LODGES.find((lodge) => lodge.id === selectedLodgeId) ?? null,
    [selectedLodgeId],
  );
  const selectedLocationState = selectedLodge
    ? getLocationState(sceneState, selectedLodge.id)
    : null;
  const academyLocation = selectedLodge
    ? locations.find((location) => location.slug === selectedLodge.sourceSlug) ?? null
    : null;

  function chooseScene(nextState) {
    setSceneState(nextState);
    if (nextState.focusLocation && LODGES.some((lodge) => lodge.id === nextState.focusLocation)) {
      setSelectedLodgeId(nextState.focusLocation);
    }
  }

  return (
    <main className={`living-map-app scene-${sceneState.id}`}>
      <header className="map-header">
        <div>
          <p className="eyebrow">Boundary Waters Academy</p>
          <h1>The Living Map</h1>
        </div>
        <div className="header-status">
          <p className="header-note">Late Autumn · Mirror Lake District</p>
          <span className={`atlas-status atlas-status-${atlasStatus}`}>
            {atlasStatus === 'connected' ? `${locations.length} academy records connected` : atlasStatus === 'loading' ? 'Connecting to academy records' : 'Local map records'}
          </span>
        </div>
      </header>

      <section className="scene-toolbar" aria-label="Choose a map condition">
        <div className="state-buttons">
          {SCENE_OPTIONS.map((option) => (
            <button
              className={option.id === sceneState.id ? 'active' : ''}
              type="button"
              key={option.id}
              onClick={() => chooseScene(option)}
              aria-pressed={option.id === sceneState.id}
            >
              <span className="state-dot" />
              {option.label}
            </button>
          ))}
        </div>
        <p className="state-summary"><strong>{sceneState.label}.</strong> {sceneState.summary}</p>
      </section>

      <section className="map-layout">
        <div className="canvas-shell">
          <div className="canvas-hud" aria-hidden="true">
            <span>LIVE CAMPUS CONDITION</span>
            <span>{sceneState.timeOfDay} / {sceneState.weather.replace('_', ' ')}</span>
          </div>
          <LivingMap
            sceneState={sceneState}
            selectedLodgeId={selectedLodgeId}
            onSelectLodge={setSelectedLodgeId}
          />
          <div className="control-hint">Drag to orbit · Scroll to zoom · Click a lodge</div>
        </div>

        <LodgeInfoPanel
          lodge={selectedLodge}
          locationState={selectedLocationState}
          academyLocation={academyLocation}
          atlasStatus={atlasStatus}
          onClose={() => setSelectedLodgeId(null)}
        />
      </section>

      <footer className="map-footer">
        <a href="/">Academy directory</a>
        <code>{sceneState.id}.json</code>
        <span className="footer-rule" />
        <span>Three lodges · one lake · current conditions</span>
      </footer>
    </main>
  );
}
