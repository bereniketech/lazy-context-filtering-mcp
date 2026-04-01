import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Status" },
  { to: "/context", label: "Context" },
  { to: "/sessions", label: "Sessions" },
  { to: "/config", label: "Config" },
  { to: "/analytics", label: "Analytics" }
];

export function Nav(): JSX.Element {
  return (
    <nav className="nav" aria-label="Dashboard navigation">
      <div className="brand">Lazy Context Console</div>
      <ul>
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.to === "/"}>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
