import React, { useState, useMemo } from "react";
import {
  Search, Plus, X, Package, MapPin, Tag, Calendar, DollarSign,
  Image as ImageIcon, ChevronRight, Clock, Wrench, History,
  LayoutGrid, SlidersHorizontal, CheckCircle2
} from "lucide-react";

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const CATEGORIES = ["Laptop", "Mobile", "Server", "Monitor", "Peripheral", "Furniture"];
const CONDITIONS = ["Excellent", "Good", "Fair", "Poor"];
const STATUSES = ["Available", "Allocated", "Under Maintenance", "Lost", "Retired", "Disposed"];

const STATUS_STYLES = {
  Available: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Allocated: "bg-blue-50 text-blue-700 ring-blue-600/20",
  "Under Maintenance": "bg-amber-50 text-amber-700 ring-amber-600/20",
  Lost: "bg-rose-50 text-rose-700 ring-rose-600/20",
  Retired: "bg-slate-100 text-slate-600 ring-slate-500/20",
  Disposed: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const STATUS_DOT = {
  Available: "bg-emerald-500",
  Allocated: "bg-blue-500",
  "Under Maintenance": "bg-amber-500",
  Lost: "bg-rose-500",
  Retired: "bg-slate-400",
  Disposed: "bg-slate-400",
};

const INITIAL_ASSETS = [
  { id: 1, tag: "AF-1001", name: "Workstation Laptop", category: "Laptop", serial: "SN-LAP-4471", status: "Available", condition: "Good", location: "Office 1 - Pune", cost: 1200, acquired: "2024-02-11", bookable: true, photo: "" },
  { id: 2, tag: "AF-1002", name: "Field Mobile Phone", category: "Mobile", serial: "SN-PHN-2290", status: "Allocated", condition: "Excellent", location: "Office 2 - Mumbai", cost: 800, acquired: "2024-05-03", bookable: true, photo: "" },
  { id: 3, tag: "AF-1003", name: "Rack Server R740", category: "Server", serial: "SN-SRV-8813", status: "Available", condition: "Good", location: "Data Center - Pune", cost: 5000, acquired: "2023-11-20", bookable: false, photo: "" },
  { id: 4, tag: "AF-1004", name: "27in 4K Monitor", category: "Monitor", serial: "SN-MON-1187", status: "Under Maintenance", condition: "Fair", location: "Office 1 - Pune", cost: 320, acquired: "2023-08-14", bookable: false, photo: "" },
  { id: 5, tag: "AF-1005", name: "Wireless Keyboard Set", category: "Peripheral", serial: "SN-PER-5502", status: "Available", condition: "Excellent", location: "Office 3 - Bengaluru", cost: 65, acquired: "2024-06-01", bookable: false, photo: "" },
  { id: 6, tag: "AF-1006", name: "Standing Desk", category: "Furniture", serial: "SN-FUR-9911", status: "Allocated", condition: "Good", location: "Office 1 - Pune", cost: 410, acquired: "2023-12-09", bookable: false, photo: "" },
  { id: 7, tag: "AF-1007", name: "Executive Laptop Pro", category: "Laptop", serial: "SN-LAP-6620", status: "Lost", condition: "Poor", location: "Office 2 - Mumbai", cost: 1800, acquired: "2022-09-17", bookable: true, photo: "" },
  { id: 8, tag: "AF-1008", name: "Backup Server B2", category: "Server", serial: "SN-SRV-3345", status: "Retired", condition: "Poor", location: "Data Center - Pune", cost: 4200, acquired: "2020-03-02", bookable: false, photo: "" },
  { id: 9, tag: "AF-1009", name: "Conference Room Mic", category: "Peripheral", serial: "SN-PER-7734", status: "Available", condition: "Good", location: "Office 3 - Bengaluru", cost: 150, acquired: "2024-01-27", bookable: true, photo: "" },
  { id: 10, tag: "AF-1010", name: "Legacy Tablet", category: "Mobile", serial: "SN-TAB-1120", status: "Disposed", condition: "Poor", location: "Office 2 - Mumbai", cost: 500, acquired: "2019-07-22", bookable: false, photo: "" },
  { id: 11, tag: "AF-1011", name: "Ergonomic Chair", category: "Furniture", serial: "SN-FUR-4482", status: "Allocated", condition: "Excellent", location: "Office 1 - Pune", cost: 280, acquired: "2024-03-30", bookable: false, photo: "" },
  { id: 12, tag: "AF-1012", name: "Ultrawide Monitor 34in", category: "Monitor", serial: "SN-MON-6693", status: "Available", condition: "Excellent", location: "Office 3 - Bengaluru", cost: 550, acquired: "2024-07-08", bookable: false, photo: "" },
  { id: 13, tag: "AF-1013", name: "Loaner Laptop", category: "Laptop", serial: "SN-LAP-9027", status: "Under Maintenance", condition: "Fair", location: "Office 2 - Mumbai", cost: 950, acquired: "2023-04-19", bookable: true, photo: "" },
];

const MOCK_ALLOCATIONS = {
  1: [
    { holder: "Asha Rao", dept: "IT", from: "2024-03-01", to: "2024-06-01", status: "Returned" },
    { holder: "Devika Nair", dept: "Finance", from: "2024-06-15", to: "—", status: "Active" },
  ],
  2: [{ holder: "Vikram Shah", dept: "HR", from: "2024-05-05", to: "—", status: "Active" }],
  6: [{ holder: "Priya Menon", dept: "IT", from: "2023-12-10", to: "—", status: "Active" }],
  11: [{ holder: "Rohan Iyer", dept: "Finance", from: "2024-04-01", to: "—", status: "Active" }],
};

const MOCK_MAINTENANCE = {
  3: [
    { date: "2024-01-15", issue: "Routine inspection", priority: "Medium", status: "Resolved" },
    { date: "2024-05-22", issue: "Fan noise reported", priority: "Low", status: "Resolved" },
  ],
  4: [{ date: "2024-06-30", issue: "Flickering display", priority: "High", status: "In Progress" }],
  7: [{ date: "2024-02-01", issue: "Reported missing after office move", priority: "Critical", status: "Investigating" }],
  13: [{ date: "2024-07-01", issue: "Battery not charging", priority: "Medium", status: "In Progress" }],
};

let tagCounter = 1014;

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status] || STATUS_STYLES.Retired}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status] || "bg-slate-400"}`} />
      {status}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10";

// ---------------------------------------------------------------------------
// Registration Modal
// ---------------------------------------------------------------------------

function RegisterModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: "", category: CATEGORIES[0], serial: "", acquired: "", cost: "",
    condition: CONDITIONS[0], location: "", photo: "", bookable: false,
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const canSave = form.name.trim() && form.location.trim();

  const handleSave = () => {
    if (!canSave) return;
    tagCounter += 1;
    onSave({
      id: Date.now(),
      tag: `AF-${tagCounter}`,
      name: form.name.trim(),
      category: form.category,
      serial: form.serial.trim() || "—",
      status: "Available",
      condition: form.condition,
      location: form.location.trim(),
      cost: Number(form.cost) || 0,
      acquired: form.acquired || new Date().toISOString().slice(0, 10),
      bookable: form.bookable,
      photo: form.photo.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Register new asset</h2>
            <p className="text-xs text-slate-500 mt-0.5">An asset tag is assigned automatically when you save.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Asset name">
                <input className={inputCls} placeholder="e.g. Workstation Laptop" value={form.name} onChange={set("name")} />
              </Field>
            </div>
            <Field label="Category">
              <select className={inputCls} value={form.category} onChange={set("category")}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Condition">
              <select className={inputCls} value={form.condition} onChange={set("condition")}>
                {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Serial number">
              <input className={inputCls} placeholder="SN-XXXX-0000" value={form.serial} onChange={set("serial")} />
            </Field>
            <Field label="Location">
              <input className={inputCls} placeholder="e.g. Office 1 - Pune" value={form.location} onChange={set("location")} />
            </Field>
            <Field label="Acquisition date">
              <input type="date" className={inputCls} value={form.acquired} onChange={set("acquired")} />
            </Field>
            <Field label="Acquisition cost (USD)">
              <input type="number" min="0" className={inputCls} placeholder="0.00" value={form.cost} onChange={set("cost")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Photo URL">
                <input className={inputCls} placeholder="https://…" value={form.photo} onChange={set("photo")} />
              </Field>
            </div>

            <div className="sm:col-span-2 flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-800">Shared / bookable asset</p>
                <p className="text-xs text-slate-500">Employees can reserve this asset for a time slot.</p>
              </div>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, bookable: !f.bookable }))}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${form.bookable ? "bg-indigo-600" : "bg-slate-200"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.bookable ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCircle2 className="h-4 w-4" />
            Save asset
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slide-over Detail View
// ---------------------------------------------------------------------------

function DetailSlideOver({ asset, onClose }) {
  const [tab, setTab] = useState("allocation");
  if (!asset) return null;

  const allocations = MOCK_ALLOCATIONS[asset.id] || [];
  const maintenance = MOCK_MAINTENANCE[asset.id] || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-500">{asset.tag}</p>
              <h2 className="mt-0.5 truncate text-lg font-semibold text-slate-900">{asset.name}</h2>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3"><StatusBadge status={asset.status} /></div>

          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-slate-400"><Package className="h-3.5 w-3.5" />Category</dt>
              <dd className="mt-0.5 font-medium text-slate-800">{asset.category}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-slate-400"><Tag className="h-3.5 w-3.5" />Serial</dt>
              <dd className="mt-0.5 font-medium text-slate-800">{asset.serial}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-slate-400"><MapPin className="h-3.5 w-3.5" />Location</dt>
              <dd className="mt-0.5 font-medium text-slate-800">{asset.location}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-slate-400"><DollarSign className="h-3.5 w-3.5" />Cost</dt>
              <dd className="mt-0.5 font-medium text-slate-800">${asset.cost.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-slate-400"><Calendar className="h-3.5 w-3.5" />Acquired</dt>
              <dd className="mt-0.5 font-medium text-slate-800">{asset.acquired}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-slate-400"><SlidersHorizontal className="h-3.5 w-3.5" />Condition</dt>
              <dd className="mt-0.5 font-medium text-slate-800">{asset.condition}</dd>
            </div>
          </dl>
        </div>

        <div className="flex border-b border-slate-100 px-6">
          {[
            { key: "allocation", label: "Allocation History", icon: History },
            { key: "maintenance", label: "Maintenance History", icon: Wrench },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium transition ${
                tab === t.key ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "allocation" && (
            allocations.length ? (
              <ul className="space-y-3">
                {allocations.map((a, i) => (
                  <li key={i} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-800">{a.holder}</p>
                      <span className={`text-xs font-medium ${a.status === "Active" ? "text-blue-600" : "text-slate-400"}`}>{a.status}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{a.dept}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" />{a.from} → {a.to}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState text="No allocation history for this asset." />
            )
          )}

          {tab === "maintenance" && (
            maintenance.length ? (
              <ul className="space-y-3">
                {maintenance.map((m, i) => (
                  <li key={i} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-800">{m.issue}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{m.priority}</span>
                    </div>
                    <p className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{m.date}</span>
                      <span className="font-medium text-amber-600">{m.status}</span>
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState text="No maintenance requests for this asset." />
            )
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <History className="h-5 w-5" />
      </div>
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function AssetDirectory() {
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
      const matchesQuery =
        !q ||
        a.tag.toLowerCase().includes(q) ||
        a.serial.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || a.status === statusFilter;
      const matchesCategory = !categoryFilter || a.category === categoryFilter;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [assets, query, statusFilter, categoryFilter]);

  const counts = useMemo(() => {
    const c = { total: assets.length };
    STATUSES.forEach((s) => (c[s] = assets.filter((a) => a.status === s).length));
    return c;
  }, [assets]);

  const handleSaveAsset = (asset) => {
    setAssets((prev) => [asset, ...prev]);
    setShowRegister(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-indigo-500">
              <LayoutGrid className="h-3.5 w-3.5" /> AssetFlow · Screen 4
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Asset Registration &amp; Directory</h1>
            <p className="mt-1 text-sm text-slate-500">{counts.total} assets tracked across the organization.</p>
          </div>
          <button
            onClick={() => setShowRegister(true)}
            className="inline-flex items-center gap-1.5 self-start rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 sm:self-auto"
          >
            <Plus className="h-4 w-4" /> Register new asset
          </button>
        </div>

        {/* KPI strip */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
              className={`rounded-xl border px-3 py-3 text-left transition ${
                statusFilter === s ? "border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <p className="text-lg font-semibold text-slate-900">{counts[s]}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[s]}`} />
                {s}
              </p>
            </button>
          ))}
        </div>

        {/* Search & filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by tag, serial number, category, or status…"
              className={`${inputCls} pl-9`}
            />
          </div>
          <select className={`${inputCls} sm:w-48`} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className={`${inputCls} sm:w-52`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          {(query || statusFilter || categoryFilter) && (
            <button
              onClick={() => { setQuery(""); setStatusFilter(""); setCategoryFilter(""); }}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Table - desktop */}
        <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Asset Tag</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Condition</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className="cursor-pointer transition hover:bg-indigo-50/40"
                >
                  <td className="px-5 py-3 font-mono text-xs font-medium text-indigo-600">{a.tag}</td>
                  <td className="px-5 py-3 font-medium text-slate-800">{a.name}</td>
                  <td className="px-5 py-3 text-slate-600">{a.category}</td>
                  <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-5 py-3 text-slate-600">{a.condition}</td>
                  <td className="px-5 py-3 text-slate-600">{a.location}</td>
                  <td className="px-5 py-3 text-right">
                    <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-14"><EmptyState text="No assets match your search or filters." /></div>
          )}
        </div>

        {/* Cards - mobile */}
        <div className="space-y-3 md:hidden">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs font-medium text-indigo-600">{a.tag}</p>
                  <p className="mt-0.5 font-medium text-slate-800">{a.name}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" />{a.category}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{a.location}</span>
                <span className="flex items-center gap-1"><SlidersHorizontal className="h-3.5 w-3.5" />{a.condition}</span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <EmptyState text="No assets match your search or filters." />}
        </div>
      </div>

      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} onSave={handleSaveAsset} />}
      {selected && <DetailSlideOver asset={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
