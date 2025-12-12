import { BrowserRouter as Router } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { SimpleRoutes } from "./SimpleRoutes";

function App() {
  return (
    <Router>
      <ScrollToTop behavior="auto">
        <SimpleRoutes />
      </ScrollToTop>
    </Router>
  );
}

export default App;
