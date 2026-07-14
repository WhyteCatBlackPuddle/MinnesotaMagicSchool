export default function LodgeInfoPanel({ lodge, locationState, academyLocation, atlasStatus, onClose }) {
  if (!lodge) {
    return (
      <aside className="lodge-panel lodge-panel-empty" aria-live="polite">
        <span className="panel-kicker">Map inspection</span>
        <h2>Select a lodge</h2>
        <p>Click a building in the diorama to open its field notes and current condition.</p>
        <div className="map-key" aria-label="Map key">
          <span><i className="key-light" /> Occupied lodge</span>
          <span><i className="key-magic" /> Magical incident</span>
          <span><i className="key-dark" /> Power loss</span>
        </div>
        <p className="atlas-note">
          {atlasStatus === 'connected' ? 'Descriptions are connected to the academy atlas.' : 'The map connects to the academy atlas when the main application is running.'}
        </p>
      </aside>
    );
  }

  const condition = locationState.lighting === 'flickering'
    ? 'Unstable lights'
    : locationState.lighting === 'dark'
      ? 'Power lost'
      : 'Normal';

  return (
    <aside className="lodge-panel" aria-live="polite">
      <button className="panel-close" type="button" onClick={onClose} aria-label="Close lodge details">×</button>
      <span className="panel-kicker">{lodge.type}</span>
      <h2>{lodge.name}</h2>
      <p>{lodge.description}</p>
      {academyLocation && (
        <div className="academy-context">
          <span>From the academy atlas · {academyLocation.category}</span>
          <strong>{academyLocation.icon} {academyLocation.name}</strong>
          <p>{academyLocation.description}</p>
        </div>
      )}
      <dl className="condition-list">
        <div>
          <dt>Current light</dt>
          <dd data-condition={locationState.lighting}>{condition}</dd>
        </div>
        <div>
          <dt>Activity</dt>
          <dd>{locationState.activity}</dd>
        </div>
        <div>
          <dt>Effect</dt>
          <dd>{locationState.effect ?? 'none'}</dd>
        </div>
      </dl>
    </aside>
  );
}
