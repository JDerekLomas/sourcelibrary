import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";

import { TenantProvider } from "./contexts/TenantContext";
import { TenantScopedRoutes } from "./TenantScopedRoutes";

import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";

function App() {
  return (
    <Router>
        <ScrollToTop behavior="auto">
            <Routes>
              {/* ---- Static Routes ---- */}
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              
              {/* ---- Tenant Scoped Routes ---- */}
              <Route path="/:tenant?/*" element={
                <TenantProvider>
                  <TenantScopedRoutes />
                </TenantProvider>
              } />
            </Routes>
        </ScrollToTop>
      </Router >
  );
}

export default App;
