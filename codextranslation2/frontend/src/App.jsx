import { NavLink, Route, Routes } from "react-router-dom";
import "./App.css";
import { TranslatorWorkspace } from "./pages/TranslatorWorkspace";
import { CurationAdmin } from "./pages/CurationAdmin";
import { ReaderExperience } from "./pages/ReaderExperience";
import { SharedInfrastructure } from "./pages/SharedInfrastructure";

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Codex Translation 2</h1>
          <p>Translator-first orchestration across governance, curation, reading, and infra.</p>
        </div>
        <nav>
          <NavLink to="/translator">Translator</NavLink>
          <NavLink to="/curation">Curation</NavLink>
          <NavLink to="/reader">Reader</NavLink>
          <NavLink to="/infra">Infrastructure</NavLink>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/translator" element={<TranslatorWorkspace />} />
          <Route path="/curation" element={<CurationAdmin />} />
          <Route path="/reader" element={<ReaderExperience />} />
          <Route path="/infra" element={<SharedInfrastructure />} />
          <Route path="*" element={<TranslatorWorkspace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
