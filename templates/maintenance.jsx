import React, { useState, useMemo, useRef } from "react";
import {
  LayoutDashboard,
  Boxes,
  Plus,
  X,
  Upload,
  CheckCircle2,
  XCircle,
  UserCheck,
  Wrench,
  Clock,
  AlertTriangle,
  ChevronRight,
  History,
  Search,
  Image as ImageIcon,
  ArrowRight,
  CircleDot,
  Building2,
  Bell,
  Settings,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Static config: workflow stages, status metadata, priority metadata
// ---------------------------------------------------------------------------

const STAGES = [
  "Pending",
  "Approved",
  "Technician Assigned",
  "In Progress",
  "Resolved",
];

const STATUS_META = {
  Pending: { color: "#B45309", bg: "#FFFBEB", border: "#FDE68A", icon: Clock },
  Approved: { color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE", icon: CheckCircle2 },
  Rejected: { color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA", icon: XCircle },
  "Technician Assigned": { color: "#6D28D9", bg: "#F5F3FF", border: "#DDD6FE", icon: UserCheck },
  "In Progress": { color: "#0369A1", bg: "#F0F9FF", border: "#BAE6FD", icon: Wrench },
  Resolved: { color: "#15803D", bg: "#F0FDF4", border: "#BBF7D0", icon: CheckCircle2 },
};

const PRIORITY_META = {
  Low: { color: "#0369A1", bg: "#F0F9FF" },
  Medium: { color: "#B45309", bg: "#FFFBEB" },
  High: { color: "#C2410C", bg: "#FFF7ED" },
  Critical: { color: "#B91C1C", bg: "#FEF2F2" },
};

const ASSET_STATUS_META = {
  Available: { color: "#15803D", bg: "#F0FDF4" },
  "Under Maintenance": { color: "#B45309", bg: "#FFFBEB" },
  Retired: { color: "#475569", bg: "#F1F5F9" },
};

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const SEED_ASSETS = [
  { id: "AST-001", name: "Rooftop HVAC Unit 3", category: "HVAC", location: "Building A - Roof", status: "Available" },
  { id: "AST-002", name: "Forklift FL-22", category: "Material Handling", location: "Warehouse B", status: "Available" },
  { id: "AST-003", name: "Diesel Generator G1", category: "Power", location: "Plant Yard", status: "Available" },
  { id: "AST-004", name: "CNC Milling Machine M4", category: "Production", location: "Floor 2 - Bay 6", status: "Available" },
  { id: "AST-005", name: "Freight Elevator E2", category: "Facilities", location: "Building C", status: "Available" },
  { id: "AST-006", name: "Air Compressor C7", category: "Utilities", location: "Warehouse A", status: "Available" },
];

const now = () => new Date();
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const fmt = (d) =>
  d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

let ticketCounter = 1006;
const nextTicketId = () => `WO-${String(ticketCounter++).padStart(4, "0")}`;

const SEED_TICKETS = [
  {
    id: "WO-1001",
    assetId: "AST-004",
    issue: "Spindle overheating after 2 hours of continuous operation. Coolant flow appears reduced.",
    priority: "High",
    status: "Resolved",
    requestedBy: "R. Okafor",
    technician: "M. Silva",
    photoName: "spindle_temp_readout.jpg",
    history: [
      { status: "Pending", at: daysAgo(9), note: "Request submitted." },
      { status: "Approved", at: daysAgo(9), note: "Approved — asset flagged Under Maintenance." },
      { status: "Technician Assigned", at: daysAgo(8), note: "Assigned to M. Silva." },
      { status: "In Progress", at: daysAgo(8), note: "Coolant pump inspection started." },
      { status: "Resolved", at: daysAgo(7), note: "Coolant pump replaced. Asset returned to Available." },
    ],
  },
  {
    id: "WO-1002",
    assetId: "AST-002",
    issue: "Hydraulic lift lever sticking intermittently.",
    priority: "Medium",
    status: "Resolved",
    requestedBy: "T. Fenwick",
    technician: "J. Kowalski",
    photoName: "forklift_lever.jpg",
    history: [
      { status: "Pending", at: daysAgo(15), note: "Request submitted." },
      { status: "Approved", at: daysAgo(14), note: "Approved — asset flagged Under Maintenance." },
      { status: "Technician Assigned", at: daysAgo(14), note: "Assigned to J. Kowalski." },
      { status: "In Progress", at: daysAgo(13), note: "Hydraulic fluid topped up, seals inspected." },
      { status: "Resolved", at: daysAgo(13), note: "Lever action restored. Asset returned to Available." },
    ],
  },
  {
    id: "WO-1003",
    assetId: "AST-003",
    issue: "Generator fails to reach full load within expected startup window.",
    priority: "Critical",
    status: "In Progress",
    requestedBy: "S. Patel",
    technician: "A. Novak",
    photoName: "generator_panel.jpg",
    history: [
      { status: "Pending", at: daysAgo(3), note: "Request submitted." },
      { status: "Approved", at: daysAgo(3), note: "Approved — asset flagged Under Maintenance." },
      { status: "Technician Assigned", at: daysAgo(2), note: "Assigned to A. Novak." },
      { status: "In Progress", at: daysAgo(1), note: "Fuel injector diagnostics underway." },
    ],
  },
  {
    id: "WO-1004",
    assetId: "AST-005",
    issue: "Unusual grinding noise on ascent between floors 2 and 3.",
    priority: "High",
    status: "Technician Assigned",
    requestedBy: "L. Marsh",
    technician: "D. Reyes",
    photoName: null,
    history: [
      { status: "Pending", at: daysAgo(2), note: "Request submitted." },
      { status: "Approved", at: daysAgo(2), note: "Approved — asset flagged Under Maintenance." },
      { status: "Technician Assigned", at: daysAgo(1), note: "Assigned to D. Reyes." },
    ],
  },
  {
    id: "WO-1005",
    assetId: "AST-006",
    issue: "Pressure gauge reads inconsistently under load.",
    priority: "Low",
    status: "Approved",
    requestedBy: "R. Okafor",
    technician: null,
    photoName: "compressor_gauge.jpg",
    history: [
      { status: "Pending", at: daysAgo(1), note: "Request submitted." },
      { status: "Approved", at: daysAgo(1), note: "Approved — asset flagged Under Maintenance." },
    ],
  },
  {
    id: "WO-1006",
    assetId: "AST-001",
    issue: "Condenser unit tripping breaker twice this week.",
    priority: "Medium",
    status: "Pending",
    requestedBy: "T. Fenwick",
    technician: null,
    photoName: null,
    history: [{ status: "Pending", at: daysAgo(0), note: "Request submitted." }],
  },
];

// Apply seed side-effects: any asset with an open (non-resolved, non-rejected) ticket
// that has passed Approval should be Under Maintenance.
const applySeedAssetStatus = (assets, tickets) => {
  return assets.map((a) => {
    const openTicket = tickets.find(
      (t) => t.assetId === a.id && !["Resolved", "Rejected", "Pending"].includes(t.status)
    );
    return openTicket ? { ...a, status: "Under Maintenance" } : a;
  });
};

// ---------------------------------------------------------------------------
// Small UI primitives
// ---------------------------------------------------------------------------

function Badge({ label, color, bg, border, icon: Icon }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap"
      style={{ color, backgroundColor: bg, border: border ? `1px solid ${border}` : "none" }}
    >
      {Icon && <Icon size={12} strokeWidth={2.5} />}
      {label}
    </span>
  );
}

function Stepper({ currentStatus }) {
  if (currentStatus === "Rejected") {
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-rose-700">
        <XCircle size={14} />
        Request rejected
      </div>
    );
  }
  const currentIdx = STAGES.indexOf(currentStatus);
  return (
    <div className="flex items-center w-full">
      {STAGES.map((stage, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center gap-1" style={{ minWidth: 0 }}>
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: done || active ? STATUS_META[stage].color : "#E2E8F0",
                  boxShadow: active ? `0 0 0 3px ${STATUS_META[stage].bg}` : "none",
                }}
              />
            </div>
            {i < STAGES.length - 1 && (
              <div
                className="flex-1 h-[2px] mx-1"
                style={{ backgroundColor: i < currentIdx ? STATUS_META[stage].color : "#E2E8F0" }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Raise Request modal
// ---------------------------------------------------------------------------

function RequestModal({ assets, onClose, onSubmit }) {
  const [assetId, setAssetId] = useState(assets[0]?.id || "");
  const [issue, setIssue] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [photoName, setPhotoName] = useState(null);
  const [requestedBy, setRequestedBy] = useState("");
  const fileRef = useRef(null);

  const canSubmit = assetId && issue.trim().length > 0 && requestedBy.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Raise a maintenance request</h2>
            <p className="text-xs text-slate-500 mt-0.5">Submit a new work order for review.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Asset</label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {a.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Requested by</label>
            <input
              value={requestedBy}
              onChange={(e) => setRequestedBy(e.target.value)}
              placeholder="Your name"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Issue description</label>
            <textarea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              rows={3}
              placeholder="Describe the fault or symptom in detail..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Priority</label>
            <div className="flex gap-2">
              {Object.keys(PRIORITY_META).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className="flex-1 px-2 py-2 rounded-lg text-xs font-semibold border transition-colors"
                  style={
                    priority === p
                      ? { backgroundColor: PRIORITY_META[p].bg, color: PRIORITY_META[p].color, borderColor: PRIORITY_META[p].color }
                      : { backgroundColor: "white", color: "#64748B", borderColor: "#E2E8F0" }
                  }
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Photo (optional)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setPhotoName(e.target.files?.[0]?.name || null)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center gap-2 border border-dashed border-slate-300 rounded-lg px-3 py-3 text-xs text-slate-500 hover:border-slate-400 hover:bg-slate-50 transition-colors"
            >
              {photoName ? <ImageIcon size={16} className="text-slate-600" /> : <Upload size={16} />}
              <span className="truncate">{photoName || "Attach a photo of the issue"}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!canSubmit}
            onClick={() =>
              canSubmit &&
              onSubmit({ assetId, issue: issue.trim(), priority, photoName, requestedBy: requestedBy.trim() })
            }
            className="px-3.5 py-2 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            Submit request
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ticket detail drawer
// ---------------------------------------------------------------------------

function TicketDrawer({ ticket, asset, onClose, onAction }) {
  const [techName, setTechName] = useState("");
  const meta = STATUS_META[ticket.status];
  const Icon = meta.icon;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <p className="text-xs font-semibold text-slate-400 tracking-wide">{ticket.id}</p>
            <h2 className="text-base font-semibold text-slate-900 mt-0.5">{asset?.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{asset?.id} · {asset?.location}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge label={ticket.status} color={meta.color} bg={meta.bg} border={meta.border} icon={Icon} />
            <Badge
              label={`${ticket.priority} priority`}
              color={PRIORITY_META[ticket.priority].color}
              bg={PRIORITY_META[ticket.priority].bg}
            />
          </div>

          <Stepper currentStatus={ticket.status} />

          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1.5">Issue description</p>
            <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 rounded-lg p-3 border border-slate-100">
              {ticket.issue}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Requested by</p>
              <p className="text-slate-800">{ticket.requestedBy}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Technician</p>
              <p className="text-slate-800">{ticket.technician || "Unassigned"}</p>
            </div>
          </div>

          {ticket.photoName && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1.5">Attachment</p>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 text-sm text-slate-700">
                <ImageIcon size={16} className="text-slate-400" />
                {ticket.photoName}
              </div>
            </div>
          )}

          {ticket.status === "Approved" && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1.5">Assign technician</p>
              <div className="flex gap-2">
                <input
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                  placeholder="Technician name"
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
              <History size={13} /> History log
            </p>
            <div className="space-y-3">
              {ticket.history.map((h, i) => {
                const hm = STATUS_META[h.status];
                const HIcon = hm.icon;
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: hm.bg }}
                      >
                        <HIcon size={12} style={{ color: hm.color }} />
                      </div>
                      {i < ticket.history.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium text-slate-800">{h.status}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{h.note}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{fmt(new Date(h.at))}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-2 justify-end">
          {ticket.status === "Pending" && (
            <>
              <button
                onClick={() => onAction("reject", ticket.id)}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => onAction("approve", ticket.id)}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 size={15} /> Approve
              </button>
            </>
          )}
          {ticket.status === "Approved" && (
            <button
              disabled={!techName.trim()}
              onClick={() => onAction("assign", ticket.id, techName.trim())}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-white bg-violet-700 hover:bg-violet-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              <UserCheck size={15} /> Assign technician
            </button>
          )}
          {ticket.status === "Technician Assigned" && (
            <button
              onClick={() => onAction("start", ticket.id)}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 transition-colors flex items-center gap-1.5"
            >
              <Wrench size={15} /> Start work
            </button>
          )}
          {ticket.status === "In Progress" && (
            <button
              onClick={() => onAction("resolve", ticket.id)}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-white bg-green-700 hover:bg-green-800 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} /> Mark resolved
            </button>
          )}
          {(ticket.status === "Resolved" || ticket.status === "Rejected") && (
            <p className="text-xs text-slate-400 py-2">This ticket is closed and archived in the audit trail.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kanban column + card
// ---------------------------------------------------------------------------

function TicketCard({ ticket, asset, onClick }) {
  const meta = STATUS_META[ticket.status];
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-slate-200 rounded-lg p-3.5 hover:border-slate-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-slate-400">{ticket.id}</p>
        <Badge
          label={ticket.priority}
          color={PRIORITY_META[ticket.priority].color}
          bg={PRIORITY_META[ticket.priority].bg}
        />
      </div>
      <p className="text-sm font-semibold text-slate-900 mt-1.5">{asset?.name}</p>
      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{ticket.issue}</p>
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
        <span className="text-[11px] text-slate-400">{ticket.technician || "Unassigned"}</span>
        <ChevronRight size={14} className="text-slate-300" />
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

export default function AssetFlowApp() {
  const [assets, setAssets] = useState(() => applySeedAssetStatus(SEED_ASSETS, SEED_TICKETS));
  const [tickets, setTickets] = useState(SEED_TICKETS);
  const [view, setView] = useState("dashboard"); // dashboard | assets
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [search, setSearch] = useState("");

  const assetById = useMemo(() => Object.fromEntries(assets.map((a) => [a.id, a])), [assets]);
  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || null;
  const selectedAsset = assetById[selectedAssetId] || null;

  const setAssetStatus = (assetId, status) =>
    setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, status } : a)));

  const pushHistory = (ticket, status, note) => ({
    ...ticket,
    status,
    history: [...ticket.history, { status, at: now(), note }],
  });

  const updateTicket = (id, updater) =>
    setTickets((prev) => prev.map((t) => (t.id === id ? updater(t) : t)));

  // ---- State machine transitions ----
  const handleAction = (action, ticketId, payload) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    if (action === "approve") {
      updateTicket(ticketId, (t) => pushHistory(t, "Approved", "Approved — asset flagged Under Maintenance."));
      setAssetStatus(ticket.assetId, "Under Maintenance");
    } else if (action === "reject") {
      updateTicket(ticketId, (t) => pushHistory(t, "Rejected", "Request rejected. No asset status change."));
    } else if (action === "assign") {
      updateTicket(ticketId, (t) => ({
        ...pushHistory(t, "Technician Assigned", `Assigned to ${payload}.`),
        technician: payload,
      }));
    } else if (action === "start") {
      updateTicket(ticketId, (t) => pushHistory(t, "In Progress", "Work started on-site."));
    } else if (action === "resolve") {
      updateTicket(ticketId, (t) => pushHistory(t, "Resolved", "Issue resolved. Asset returned to Available."));
      setAssetStatus(ticket.assetId, "Available");
    }
  };

  const handleRaiseRequest = ({ assetId, issue, priority, photoName, requestedBy }) => {
    const id = nextTicketId();
    const newTicket = {
      id,
      assetId,
      issue,
      priority,
      status: "Pending",
      requestedBy,
      technician: null,
      photoName,
      history: [{ status: "Pending", at: now(), note: "Request submitted." }],
    };
    setTickets((prev) => [newTicket, ...prev]);
    setShowRequestModal(false);
    setSelectedTicketId(id);
  };

  const filteredTickets = tickets.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const a = assetById[t.assetId];
    return (
      t.id.toLowerCase().includes(q) ||
      t.issue.toLowerCase().includes(q) ||
      a?.name.toLowerCase().includes(q)
    );
  });

  const columns = [
    "Pending",
    "Approved",
    "Technician Assigned",
    "In Progress",
    "Resolved",
    "Rejected",
  ];

  const counts = Object.fromEntries(columns.map((c) => [c, tickets.filter((t) => t.status === c).length]));

  return (
    <div className="min-h-screen w-full bg-slate-50 flex text-slate-900" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-60 bg-slate-950 text-slate-300 flex flex-col flex-shrink-0">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
            <Boxes size={17} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">AssetFlow</p>
            <p className="text-[10px] text-slate-500 mt-1">Maintenance Module</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <button
            onClick={() => setView("dashboard")}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              view === "dashboard" ? "bg-slate-800 text-white" : "hover:bg-slate-900 text-slate-400"
            }`}
          >
            <LayoutDashboard size={16} /> Maintenance Dashboard
          </button>
          <button
            onClick={() => {
              setView("assets");
              setSelectedAssetId(null);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              view === "assets" ? "bg-slate-800 text-white" : "hover:bg-slate-900 text-slate-400"
            }`}
          >
            <Building2 size={16} /> Assets & History
          </button>
        </nav>

        <div className="px-3 py-4 border-t border-slate-800 space-y-1">
          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-slate-900 transition-colors">
            <Bell size={16} /> Notifications
          </button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-slate-900 transition-colors">
            <Settings size={16} /> Settings
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 flex-shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div>
            <h1 className="text-sm font-semibold text-slate-900">
              {view === "dashboard" ? "Maintenance Dashboard" : "Assets & Maintenance History"}
            </h1>
            <p className="text-xs text-slate-400">
              {view === "dashboard"
                ? `${tickets.length} total work orders`
                : `${assets.length} tracked assets`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {view === "dashboard" && (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tickets..."
                  className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>
            )}
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
            >
              <Plus size={15} /> Raise Request
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {view === "dashboard" && (
            <>
              {/* Summary strip */}
              <div className="grid grid-cols-6 gap-3 mb-6">
                {columns.map((c) => {
                  const m = STATUS_META[c];
                  const Icon = m.icon;
                  return (
                    <div key={c} className="bg-white border border-slate-200 rounded-xl p-3.5">
                      <div className="flex items-center gap-1.5 mb-1.5" style={{ color: m.color }}>
                        <Icon size={13} />
                        <span className="text-[11px] font-semibold uppercase tracking-wide">{c}</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{counts[c]}</p>
                    </div>
                  );
                })}
              </div>

              {/* Kanban */}
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(6, minmax(220px, 1fr))" }}>
                {columns.map((col) => (
                  <div key={col} className="min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <CircleDot size={12} style={{ color: STATUS_META[col].color }} />
                      <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">{col}</h3>
                      <span className="text-[11px] text-slate-400">{counts[col]}</span>
                    </div>
                    <div className="space-y-2.5">
                      {filteredTickets
                        .filter((t) => t.status === col)
                        .map((t) => (
                          <TicketCard
                            key={t.id}
                            ticket={t}
                            asset={assetById[t.assetId]}
                            onClick={() => setSelectedTicketId(t.id)}
                          />
                        ))}
                      {filteredTickets.filter((t) => t.status === col).length === 0 && (
                        <p className="text-xs text-slate-300 italic py-4 text-center">No tickets</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {view === "assets" && !selectedAsset && (
            <div className="grid grid-cols-3 gap-4">
              {assets.map((a) => {
                const am = ASSET_STATUS_META[a.status];
                const openTickets = tickets.filter((t) => t.assetId === a.id && t.status !== "Resolved" && t.status !== "Rejected").length;
                const resolvedCount = tickets.filter((t) => t.assetId === a.id && t.status === "Resolved").length;
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAssetId(a.id)}
                    className="text-left bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-semibold text-slate-400">{a.id}</p>
                      <Badge label={a.status} color={am.color} bg={am.bg} />
                    </div>
                    <p className="text-sm font-bold text-slate-900 mt-2">{a.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{a.category} · {a.location}</p>
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                      <span>{openTickets} open</span>
                      <span>·</span>
                      <span>{resolvedCount} resolved</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {view === "assets" && selectedAsset && (
            <AssetDetail
              asset={selectedAsset}
              tickets={tickets.filter((t) => t.assetId === selectedAsset.id)}
              onBack={() => setSelectedAssetId(null)}
              onOpenTicket={(id) => setSelectedTicketId(id)}
            />
          )}
        </main>
      </div>

      {showRequestModal && (
        <RequestModal assets={assets} onClose={() => setShowRequestModal(false)} onSubmit={handleRaiseRequest} />
      )}

      {selectedTicket && (
        <TicketDrawer
          ticket={selectedTicket}
          asset={assetById[selectedTicket.assetId]}
          onClose={() => setSelectedTicketId(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Asset detail + history view
// ---------------------------------------------------------------------------

function AssetDetail({ asset, tickets, onBack, onOpenTicket }) {
  const am = ASSET_STATUS_META[asset.status];
  const resolved = tickets.filter((t) => t.status === "Resolved").sort((a, b) => new Date(b.history.at(-1).at) - new Date(a.history.at(-1).at));
  const open = tickets.filter((t) => t.status !== "Resolved" && t.status !== "Rejected");

  return (
    <div>
      <button onClick={onBack} className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-4">
        <ArrowRight size={13} className="rotate-180" /> Back to assets
      </button>

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">{asset.id}</p>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">{asset.name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{asset.category} · {asset.location}</p>
          </div>
          <Badge label={asset.status} color={am.color} bg={am.bg} />
        </div>
      </div>

      {open.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Open tickets</h3>
          <div className="space-y-2.5">
            {open.map((t) => (
              <TicketCard key={t.id} ticket={t} asset={asset} onClick={() => onOpenTicket(t.id)} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <History size={13} /> Maintenance history ({resolved.length})
        </h3>
        {resolved.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No completed maintenance on record yet.</p>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
            {resolved.map((t) => (
              <button
                key={t.id}
                onClick={() => onOpenTicket(t.id)}
                className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-slate-400">{t.id}</p>
                    <Badge
                      label={t.priority}
                      color={PRIORITY_META[t.priority].color}
                      bg={PRIORITY_META[t.priority].bg}
                    />
                  </div>
                  <p className="text-sm text-slate-800 mt-1">{t.issue}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Resolved by {t.technician} on {fmt(new Date(t.history.at(-1).at))}
                  </p>
                </div>
                <ChevronRight size={16} className="text-slate-300 flex-shrink-0 mt-1" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
