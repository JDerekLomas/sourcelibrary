import React from 'react';
import { Version } from '../types';

interface VersionPanelProps {
  versions: Version[];
}

const VersionPanel: React.FC<VersionPanelProps> = ({ versions }) => {
  return (
    <div className="version-panel">
      <h3>Versions</h3>
      <ul>
        {versions.map(version => (
          <li key={version.id}>
            <span>{version.name}</span>
            <small>{new Date(version.timestamp).toLocaleString()}</small>
          </li>
        ))}
      </ul>
      <button>Create New Version</button>
    </div>
  );
};

export default VersionPanel;