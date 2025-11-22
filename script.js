import React, { useEffect, useState } from "react";

// HeliMarket - Single-file React component (Tailwind CSS assumed)
// Default export a single React component that acts as a lightweight market-analysis CMS

export default function HeliMarketApp() {
  const [view, setView] = useState("dashboard");

  // Data stores
  const [operators, setOperators] = useState([]);
  const [helipads, setHelipads] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("heli_market_data_v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setOperators(parsed.operators || []);
        setHelipads(parsed.helipads || []);
        setRoutes(parsed.routes || []);
        setNotes(parsed.notes || []);
        setTasks(parsed.tasks || []);
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    const payload = { operators, helipads, routes, notes, tasks };
    localStorage.setItem("heli_market_data_v1", JSON.stringify(payload));
  }, [operators, helipads, routes, notes, tasks]);

  // Utilities
  const uid = () => Math.random().toString(36).slice(2, 9);
  function nowISO() {
    return new Date().toISOString();
  }

  // CRUD helpers
  function addOperator(op) {
    setOperators((s) => [{ id: uid(), created: nowISO(), ...op }, ...s]);
  }
  function updateOperator(id, patch) {
    setOperators((s) => s.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }
  function removeOperator(id) {
    setOperators((s) => s.filter((o) => o.id !== id));
  }

  function addHelipad(h) {
    setHelipads((s) => [{ id: uid(), created: nowISO(), ...h }, ...s]);
  }
  function addRoute(r) {
    setRoutes((s) => [{ id: uid(), created: nowISO(), ...r }, ...s]);
  }
  function addNote(n) {
    setNotes((s) => [{ id: uid(), created: nowISO(), ...n }, ...s]);
  }
  function addTask(t) {
    setTasks((s) => [{ id: uid(), created: nowISO(), done: false, ...t }, ...s]);
  }
  function toggleTask(id) {
    setTasks((s) => s.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function exportJSON() {
    const payload = { operators, helipads, routes, notes, tasks };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "heli_market_export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.operators) setOperators(parsed.operators);
        if (parsed.helipads) setHelipads(parsed.helipads);
        if (parsed.routes) setRoutes(parsed.routes);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.tasks) setTasks(parsed.tasks);
        alert("Import successful");
      } catch (err) {
        alert("Failed to import: invalid JSON");
      }
    };
    reader.readAsText(file);
  }

  // Simple CSV import for helipads (expects header: name,lat,lon,notes)
  function importCSV(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split(/\r?\n/).filter(Boolean);
      const [header, ...rows] = lines;
      const cols = header.split(",").map((c) => c.trim().toLowerCase());
      const newHelipads = rows.map((r) => {
        const cells = r.split(",").map((c) => c.trim());
        const obj = {};
        cols.forEach((c, i) => (obj[c] = cells[i]));
        return { id: uid(), created: nowISO(), name: obj.name || "", lat: parseFloat(obj.lat) || null, lon: parseFloat(obj.lon) || null, notes: obj.notes || "" };
      });
      setHelipads((s) => [...newHelipads, ...s]);
      alert(`Imported ${newHelipads.length} helipads`);
    };
    reader.readAsText(file);
  }

  // Filtered lists
  const filteredOperators = operators.filter((o) => (query ? (o.name || "").toLowerCase().includes(query.toLowerCase()) : true));
  const filteredHelipads = helipads.filter((h) => (query ? (h.name || "").toLowerCase().includes(query.toLowerCase()) : true));
  const filteredRoutes = routes.filter((r) => (query ? (r.name || "").toLowerCase().includes(query.toLowerCase()) : true));

  // Simple statistical cards
  function StatCard({ title, value, hint }) {
    return (
      <div className="bg-white/80 backdrop-blur p-4 rounded-lg shadow">
        <div className="text-sm text-slate-500">{title}</div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
        {hint && <div className="text-xs text-slate-400 mt-2">{hint}</div>}
      </div>
    );
  }

  // Quick forms
  function OperatorForm() {
    const [form, setForm] = useState({ name: "", base: "", services: "", phone: "", email: "" });
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="font-semibold mb-2">Add Operator</h3>
        <div className="grid grid-cols-1 gap-2">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="input" />
          <input value={form.base} onChange={(e) => setForm({ ...form, base: e.target.value })} placeholder="Base (Shimla, Kullu...)" className="input" />
          <input value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} placeholder="Services (charter, medevac...)" className="input" />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="input" />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="input" />
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => { if (!form.name) return alert("name required"); addOperator(form); setForm({ name: "", base: "", services: "", phone: "", email: "" }); }}>Add operator</button>
            <button className="btn-ghost" onClick={() => setForm({ name: "", base: "", services: "", phone: "", email: "" })}>Clear</button>
          </div>
        </div>
      </div>
    );
  }

  function HelipadForm() {
    const [f, setF] = useState({ name: "", lat: "", lon: "", notes: "" });
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="font-semibold mb-2">Add Helipad</h3>
        <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Name" className="input" />
        <div className="flex gap-2 mt-2">
          <input value={f.lat} onChange={(e) => setF({ ...f, lat: e.target.value })} placeholder="Latitude" className="input" />
          <input value={f.lon} onChange={(e) => setF({ ...f, lon: e.target.value })} placeholder="Longitude" className="input" />
        </div>
        <textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Notes" className="input mt-2" />
        <div className="flex gap-2 mt-2">
          <button className="btn-primary" onClick={() => { if (!f.name) return alert("name required"); addHelipad({ name: f.name, lat: parseFloat(f.lat) || null, lon: parseFloat(f.lon) || null, notes: f.notes }); setF({ name: "", lat: "", lon: "", notes: "" }); }}>Add Helipad</button>
          <button className="btn-ghost" onClick={() => setF({ name: "", lat: "", lon: "", notes: "" })}>Reset</button>
        </div>
      </div>
    );
  }

  function RouteForm() {
    const [r, setR] = useState({ name: "", origin: "", destination: "", duration_min: "", notes: "" });
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="font-semibold mb-2">Add Route</h3>
        <input value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} placeholder="Route name (Shimla - Kullu)" className="input" />
        <div className="flex gap-2 mt-2">
          <input value={r.origin} onChange={(e) => setR({ ...r, origin: e.target.value })} placeholder="Origin helipad" className="input" />
          <input value={r.destination} onChange={(e) => setR({ ...r, destination: e.target.value })} placeholder="Destination helipad" className="input" />
        </div>
        <input value={r.duration_min} onChange={(e) => setR({ ...r, duration_min: e.target.value })} placeholder="Duration (minutes)" className="input mt-2" />
        <textarea value={r.notes} onChange={(e) => setR({ ...r, notes: e.target.value })} placeholder="Notes" className="input mt-2" />
        <div className="flex gap-2 mt-2">
          <button className="btn-primary" onClick={() => { if (!r.name) return alert("name required"); addRoute(r); setR({ name: "", origin: "", destination: "", duration_min: "", notes: "" }); }}>Add Route</button>
          <button className="btn-ghost" onClick={() => setR({ name: "", origin: "", destination: "", duration_min: "", notes: "" })}>Reset</button>
        </div>
      </div>
    );
  }

  function NoteForm() {
    const [t, setT] = useState({ title: "", body: "" });
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="font-semibold mb-2">Quick Note</h3>
        <input value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} placeholder="Title" className="input" />
        <textarea value={t.body} onChange={(e) => setT({ ...t, body: e.target.value })} placeholder="Body" className="input mt-2" />
        <div className="flex gap-2 mt-2">
          <button className="btn-primary" onClick={() => { if (!t.title) return alert("title required"); addNote(t); setT({ title: "", body: "" }); }}>Save Note</button>
          <button className="btn-ghost" onClick={() => setT({ title: "", body: "" })}>Reset</button>
        </div>
      </div>
    );
  }

  function TaskForm() {
    const [t, setT] = useState({ title: "", due: "" });
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="font-semibold mb-2">Add Task</h3>
        <input value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} placeholder="Task" className="input" />
        <input value={t.due} onChange={(e) => setT({ ...t, due: e.target.value })} placeholder="Due date" className="input mt-2" />
        <div className="flex gap-2 mt-2">
          <button className="btn-primary" onClick={() => { if (!t.title) return alert("title required"); addTask(t); setT({ title: "", due: "" }); }}>Add Task</button>
          <button className="btn-ghost" onClick={() => setT({ title: "", due: "" })}>Reset</button>
        </div>
      </div>
    );
  }

  // Layout --------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        <aside className="col-span-3 bg-white p-4 rounded-lg shadow sticky top-6 h-fit">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">HM</div>
            <div>
              <div className="font-semibold">HeliMarket</div>
              <div className="text-xs text-slate-400">Market analysis dashboard</div>
            </div>
          </div>

          <div className="space-y-2">
            <button onClick={() => setView("dashboard")} className={`w-full text-left p-2 rounded ${view === "dashboard" ? "bg-indigo-50 border border-indigo-100" : "hover:bg-slate-50"}`}>Dashboard</button>
            <button onClick={() => setView("operators")} className={`w-full text-left p-2 rounded ${view === "operators" ? "bg-indigo-50 border border-indigo-100" : "hover:bg-slate-50"}`}>Operators</button>
            <button onClick={() => setView("helipads")} className={`w-full text-left p-2 rounded ${view === "helipads" ? "bg-indigo-50 border border-indigo-100" : "hover:bg-slate-50"}`}>Helipads</button>
            <button onClick={() => setView("routes")} className={`w-full text-left p-2 rounded ${view === "routes" ? "bg-indigo-50 border border-indigo-100" : "hover:bg-slate-50"}`}>Routes</button>
            <button onClick={() => setView("notes" )} className={`w-full text-left p-2 rounded ${view === "notes" ? "bg-indigo-50 border border-indigo-100" : "hover:bg-slate-50"}`}>Notes</button>
            <button onClick={() => setView("tasks") } className={`w-full text-left p-2 rounded ${view === "tasks" ? "bg-indigo-50 border border-indigo-100" : "hover:bg-slate-50"}`}>Tasks</button>
            <button onClick={() => setView("importexport") } className={`w-full text-left p-2 rounded ${view === "importexport" ? "bg-indigo-50 border border-indigo-100" : "hover:bg-slate-50"}`}>Import / Export</button>
          </div>

          <div className="mt-4">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="input w-full" />
          </div>

          <div className="mt-4 text-xs text-slate-500">
            <div>Saved locally in your browser (localStorage).</div>
            <div className="mt-2">Tip: export JSON before making big changes.</div>
          </div>
        </aside>

        <main className="col-span-9">
          {view === "dashboard" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <StatCard title="Operators" value={operators.length} hint="Active operator records" />
                <StatCard title="Helipads" value={helipads.length} hint="Saved helipad locations" />
                <StatCard title="Routes" value={routes.length} hint="Identified route pairs" />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="col-span-2">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold">Operators (recent)</h2>
                      <div className="text-sm text-slate-400">Click an operator to view</div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {filteredOperators.slice(0,8).map((o) => (
                        <div key={o.id} className="p-3 border rounded hover:bg-slate-50 flex justify-between items-center">
                          <div>
                            <div className="font-medium">{o.name}</div>
                            <div className="text-xs text-slate-500">{o.base} • {o.services}</div>
                          </div>
                          <div className="flex gap-2">
                            <button className="text-indigo-600 text-sm" onClick={() => setSelected(o)}>Open</button>
                            <button className="text-red-500 text-sm" onClick={() => removeOperator(o.id)}>Delete</button>
                          </div>
                        </div>
                      ))}
                      {filteredOperators.length === 0 && <div className="text-slate-400 text-sm">No operators yet — add one.</div>}
                    </div>
                  </div>
                </div>

                <div>
                  <OperatorForm />
                  <div className="mt-4">
                    <HelipadForm />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="col-span-2 bg-white p-4 rounded-lg shadow">
                  <h3 className="font-semibold mb-2">Recent Notes</h3>
                  <div className="space-y-2">
                    {notes.slice(0,6).map((n) => (
                      <div key={n.id} className="p-3 border rounded">
                        <div className="font-medium">{n.title}</div>
                        <div className="text-xs text-slate-500">{new Date(n.created).toLocaleString()}</div>
                        <div className="mt-2 text-sm">{n.body}</div>
                      </div>
                    ))}
                    {notes.length===0 && <div className="text-slate-400 text-sm">No notes yet</div>}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="font-semibold mb-2">Tasks</h3>
                  <TaskForm />
                  <div className="mt-3 space-y-2">
                    {tasks.slice(0,6).map((t) => (
                      <div key={t.id} className="flex items-center gap-2">
                        <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} />
                        <div className={`${t.done ? "line-through text-slate-400" : ""}`}>{t.title} <div className="text-xs text-slate-400">{t.due}</div></div>
                      </div>
                    ))}
                    {tasks.length===0 && <div className="text-slate-400 text-sm">No tasks yet</div>}
                  </div>
                </div>
              </div>

            </div>
          )}

          {view === "operators" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Operators</h2>
                <div className="flex gap-2">
                  <button className="btn-ghost" onClick={() => { setOperators([]); }}>Clear all</button>
                  <button className="btn-primary" onClick={() => { const sample=[{name:'Pawan Hans',base:'Multiple',services:'Charter, Heli-taxi',phone:'',email:''}]; setOperators((s)=>[...sample,...s]); }}>Add sample</button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <OperatorForm />
                </div>
                <div className="col-span-2 bg-white p-4 rounded-lg shadow">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b">
                        <th>Name</th>
                        <th>Base</th>
                        <th>Services</th>
                        <th>Contact</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOperators.map((o) => (
                        <tr key={o.id} className="border-b hover:bg-slate-50">
                          <td className="py-2">{o.name}</td>
                          <td>{o.base}</td>
                          <td>{o.services}</td>
                          <td>{o.phone || o.email}</td>
                          <td className="text-right"><button className="text-indigo-600 text-sm" onClick={() => setSelected(o)}>Open</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {view === "helipads" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Helipads</h2>
                <div className="flex gap-2 items-center">
                  <label className="cursor-pointer">
                    <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
                    <span className="btn-ghost">Import CSV</span>
                  </label>
                  <button className="btn-primary" onClick={() => { setHelipads([]); }}>Clear all</button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <HelipadForm />
                </div>
                <div className="col-span-2 bg-white p-4 rounded-lg shadow">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b">
                        <th>Name</th>
                        <th>Lat</th>
                        <th>Lon</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHelipads.map((h) => (
                        <tr key={h.id} className="border-b hover:bg-slate-50">
                          <td className="py-2">{h.name}</td>
                          <td>{h.lat}</td>
                          <td>{h.lon}</td>
                          <td>{h.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {view === "routes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Routes</h2>
                <div className="flex gap-2">
                  <button className="btn-primary" onClick={() => { setRoutes([]); }}>Clear all</button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <RouteForm />
                </div>
                <div className="col-span-2 bg-white p-4 rounded-lg shadow">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b">
                        <th>Route</th>
                        <th>Origin</th>
                        <th>Destination</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoutes.map((r) => (
                        <tr key={r.id} className="border-b hover:bg-slate-50">
                          <td className="py-2">{r.name}</td>
                          <td>{r.origin}</td>
                          <td>{r.destination}</td>
                          <td>{r.duration_min} min</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {view === "notes" && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <NoteForm />
                <div className="mt-4 bg-white p-4 rounded-lg shadow">
                  <h3 className="font-semibold mb-2">Export / Import</h3>
                  <div className="flex gap-2">
                    <button className="btn-primary" onClick={exportJSON}>Export JSON</button>
                    <label className="btn-ghost cursor-pointer">
                      <input type="file" accept="application/json" onChange={importJSON} className="hidden" />Import JSON
                    </label>
                  </div>
                </div>
              </div>

              <div className="col-span-2 bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-2">All Notes</h3>
                <div className="space-y-2">
                  {notes.map((n) => (
                    <div key={n.id} className="p-3 border rounded">
                      <div className="font-medium">{n.title}</div>
                      <div className="text-xs text-slate-400">{new Date(n.created).toLocaleString()}</div>
                      <div className="mt-2 text-sm">{n.body}</div>
                    </div>
                  ))}
                  {notes.length===0 && <div className="text-slate-400">No notes found</div>}
                </div>
              </div>
            </div>
          )}

          {view === "tasks" && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <TaskForm />
              </div>
              <div className="col-span-2 bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-2">Task list</h3>
                <div className="space-y-2">
                  {tasks.map((t) => (
                    <div key={t.id} className="p-3 border rounded flex justify-between items-center">
                      <div>
                        <div className={`${t.done ? "line-through text-slate-400" : ""}`}>{t.title}</div>
                        <div className="text-xs text-slate-400">Created: {new Date(t.created).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <button className="btn-ghost" onClick={() => toggleTask(t.id)}>{t.done ? "Undo" : "Done"}</button>
                        <button className="btn-ghost text-red-500" onClick={() => setTasks((s)=>s.filter(x=>x.id!==t.id))}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === "importexport" && (
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-semibold mb-2">Import / Export</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-2">Export everything as JSON</div>
                  <button className="btn-primary" onClick={exportJSON}>Export JSON</button>
                </div>
                <div>
                  <div className="mb-2">Import JSON backup</div>
                  <label className="cursor-pointer">
                    <input type="file" accept="application/json" onChange={importJSON} className="hidden" />
                    <span className="btn-ghost">Choose file</span>
                  </label>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-2">Quick CSV import for helipads</h3>
                <div className="text-sm text-slate-500">CSV format: name,lat,lon,notes (first row header)</div>
                <label className="mt-2 cursor-pointer inline-block">
                  <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
                  <span className="btn-ghost">Upload CSV</span>
                </label>
              </div>
            </div>
          )}

          {/* Right-side selected card */}
          {selected && (
            <div className="fixed right-6 bottom-6 w-96 bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{selected.name}</div>
                  <div className="text-xs text-slate-400">{selected.base} • {selected.services}</div>
                </div>
                <div>
                  <button className="text-slate-400" onClick={() => setSelected(null)}>Close</button>
                </div>
              </div>

              <div className="mt-3 text-sm">
                <div>Phone: {selected.phone || '—'}</div>
                <div>Email: {selected.email || '—'}</div>
                <div className="mt-2 text-xs text-slate-400">Created: {new Date(selected.created).toLocaleString()}</div>
              </div>

              <div className="mt-3 flex gap-2">
                <button className="btn-primary" onClick={() => { navigator.clipboard.writeText(selected.email || selected.phone || ''); alert('Contact copied'); }}>Copy contact</button>
                <button className="btn-ghost text-red-500" onClick={() => { if (confirm('Delete operator?')) { removeOperator(selected.id); setSelected(null); } }}>Delete</button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Tiny styles for inputs/buttons (Tailwind utility class wrapper) */}
      <style>{`
        .input{width:100%;padding:8px;border:1px solid #e6e9ef;border-radius:6px}
        .btn-primary{background:#4f46e5;color:white;padding:8px 12px;border-radius:8px}
        .btn-ghost{background:transparent;border:1px solid #e6e9ef;padding:8px 12px;border-radius:8px}
      `}</style>
    </div>
  );
}
