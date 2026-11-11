import { useState } from "react";
import { createRoot } from "react-dom/client";
import { createThemeController, useTheme } from "../../packages/ui/src/primitives/theme-toggle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../packages/ui/src/primitives/table";

const sandbox = createThemeController({
  storageKey: "sandbox-theme",
  defaultTheme: "light",
  storageValues: { light: "vault", dark: "midnight", system: "system" },
  attribute: { name: "data-sandbox-theme", light: "vault" },
});
function Preference({ second = false }) {
  const { theme, setTheme, resolvedTheme } = sandbox.useTheme();
  return <section aria-label={second ? "Terminal" : "Appearance"}>
    <output>{theme}:{resolvedTheme}</output>
    {!second && ["light", "dark", "system"].map(value => <button key={value} onClick={() => setTheme(value as "light" | "dark" | "system")}>{value}</button>)}
  </section>;
}
function DefaultTheme() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return <><output>{theme}:{resolvedTheme}</output><button onClick={() => setTheme("light")}>Default light</button></>;
}
function App() {
  const [direction, change] = useState<"asc" | "desc" | undefined>(undefined);
  const [publicPage, openPublic] = useState(false);
  const rows = direction === "asc" ? [2, 9] : [9, 2];
  if (new URL(location.href).searchParams.has("default")) return <DefaultTheme />;
  return <>
    <h1>Sandbox appearance and recorded usage</h1>
    <button onClick={() => { sandbox.applyTheme(publicPage ? sandbox.getTheme() : "light"); openPublic(!publicPage); }}>{publicPage ? "Dashboard" : "Public page"}</button>
    {!publicPage && <><Preference /><Preference second /></>}
    <Table aria-label="Usage"><TableHeader><TableRow><TableHead sort={{ direction, onSort: () => change(direction === "desc" ? "asc" : direction === "asc" ? undefined : "desc") }}>Requests</TableHead></TableRow></TableHeader>
      <TableBody>{rows.map(value => <TableRow key={value}><TableCell>{value}</TableCell></TableRow>)}</TableBody></Table>
  </>;
}
createRoot(document.getElementById("root")!).render(<App />);
