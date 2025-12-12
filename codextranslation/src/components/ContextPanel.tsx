import React from 'react';

const ContextPanel: React.FC = () => {
  return (
    <div className="context-panel">
      <h3>Context</h3>
      <p>This panel will provide contextual information to aid translation, such as:</p>
      <ul>
        <li>Previous page content</li>
        <li>Glossaries</li>
        <li>Character lists</li>
      </ul>
    </div>
  );
};

export default ContextPanel;