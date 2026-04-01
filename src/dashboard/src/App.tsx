import { Route, Routes } from "react-router-dom";
import { Nav } from "./components/Nav";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ConfigPage } from "./pages/ConfigPage";
import { ContextPage } from "./pages/ContextPage";
import { SessionsPage } from "./pages/SessionsPage";
import { StatusPage } from "./pages/StatusPage";

export function App(): JSX.Element {
  return (
    <div className="layout">
      <Nav />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<StatusPage />} />
          <Route path="/context" element={<ContextPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/config" element={<ConfigPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </main>
    </div>
  );
}
