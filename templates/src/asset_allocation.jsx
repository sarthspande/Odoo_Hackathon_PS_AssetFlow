import React, { useState, useMemo } from "react";
import {
  Boxes,
  UserPlus,
  User,
  Building2,
  ArrowLeftRight,
  Undo2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  Search,
  X,
  Calendar,
  ChevronRight,
  ShieldAlert,
  ChevronDown,
} from "lucide-react";


const STATUS_META = {
  Available: { color: "#15803D", bg: "#F0FDF4", border: "#BBF7D0" },
  Allocated: { color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE" },
  Overdue: { color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" },
};

const TRANSFER_STAGES = ["Requested", "Approved", "Re-allocated"];
const TRANSFER_META = {
  Requested: { color: "#B45309", bg: "#FFFBEB", icon: Clock },
  Approved: { color: "#1D4ED8", bg: "#EFF6FF", icon: CheckCircle2 },
  "Re-allocated": { color: "#15803D", bg: "#F0FDF4", icon: ArrowLeftRight },
  Rejected: { color: "#B91C1C", bg: "#FEF2F2", icon: XCircle },
};

const CONDITION_META = {
  Good: { color: "#15803D", bg: "#F0FDF4" },
  Fair: { color: "#B45309", bg: "#FFFBEB" },
  Damaged: { color: "#B91C1C", bg: "#FEF2F2" },
};

const NOW = new Date("2026-07-12T15:00:00");
const daysAgo = (d) => new Date(NOW.getTime() - d * 24 * 60 * 60 * 1000);
const daysFromNow = (d) => new Date(NOW.getTime() + d * 24 * 60 * 60 * 1000);
const fmtDate = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const fmtDateTime = (d) =>
  d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });


const SEED_ASSETS = [
  {
    id: "AF-0114",
    name: 'MacBook Pro 14"',
    category: "IT Equipment",
    holder: { type: "Employee", name: "Priya Menon", allocatedDate: daysAgo(18), expectedReturn: daysFromNow(12), allocatedBy: "S. Patel" },
  },
  {
    id: "AF-0027",
    name: "Dell Latitude 5440",
    category: "IT Equipment",
    holder: { type: "Employee", name: "J. Kowalski", allocatedDate: daysAgo(40), expectedReturn: daysAgo(5), allocatedBy: "S. Patel" },
  },
  {
    id: "AF-0055",
    name: "Barcode Scanner",
    category: "Warehouse Equipment",
    holder: { type: "Department", name: "Warehouse B Ops", allocatedDate: daysAgo(60), expectedReturn: null, allocatedBy: "T. Adeyemi" },
  },
  {
    id: "AF-0071",
    name: "Ergonomic Desk Riser",
    category: "Furniture",
    holder: null,
  },
  {
    id: "AF-0008",
    name: "MacBook Pro 14\"",
    category: "IT Equipment",
    holder: { type: "Employee", name: "A. Sharma", allocatedDate: daysAgo(5), expectedReturn: daysFromNow(360), allocatedBy: "S. Patel" },
  },
  {
    id: "PJ-014",
    name: "Portable Projector",
    category: "AV Equipment",
    holder: { type: "Employee", name: "R. Fenwick", allocatedDate: daysAgo(10), expectedReturn: daysAgo(2), allocatedBy: "T. Adeyemi" },
  },
  {
    id: "SC-004",
    name: "Site Camera",
    category: "AV Equipment",
    holder: { type: "Employee", name: "J. Kowalski", allocatedDate: daysAgo(9), expectedReturn: daysAgo(1), allocatedBy: "S. Patel" },
  },
  {
    id: "AF-0117",
    name: "Ergonomic Chair",
    category: "Furniture",
    holder: null,
  },
  {
    id: "AF-0044",
    name: "Safety Harness Kit",
    category: "Warehouse Equipment",
    holder: { type: "Employee", name: "J. Kowalski", allocatedDate: daysAgo(7), expectedReturn: daysFromNow(23), allocatedBy: "S. Patel" },
  },
  {
    id: "AF-0002",
    name: "Building C Access Badge",
    category: "Facilities",
    holder: { type: "Employee", name: "L. Marsh", allocatedDate: daysAgo(4), expectedReturn: null, allocatedBy: "S. Patel" },
  },
];

const SEED_HISTORY = {
  "AF-0114": [
    { at: daysAgo(18), event: "Allocated to Priya Menon", by: "S. Patel", type: "allocate" },
  ],
  "AF-0027": [
    { at: daysAgo(40), event: "Allocated to J. Kowalski", by: "S. Patel", type: "allocate" },
  ],
  "AF-0055": [
    { at: daysAgo(96), event: "Allocated to Warehouse A Ops", by: "T. Adeyemi", type: "allocate" },
    { at: daysAgo(60), event: "Transferred and re-allocated to Warehouse B Ops", by: "T. Adeyemi", type: "transfer" },
  ],
  "AF-0071": [
    { at: daysAgo(30), event: "Allocated to M. Silva", by: "S. Patel", type: "allocate" },
    { at: daysAgo(2), event: "Returned by M. Silva — condition: Good", by: "M. Silva", type: "return" },
  ],
  "AF-0008": [{ at: daysAgo(5), event: "Allocated to A. Sharma", by: "S. Patel", type: "allocate" }],
  "PJ-014": [{ at: daysAgo(10), event: "Allocated to R. Fenwick", by: "T. Adeyemi", type: "allocate" }],
  "SC-004": [{ at: daysAgo(9), event: "Allocated to J. Kowalski", by: "S. Patel", type: "allocate" }],
  "AF-0117": [
    { at: daysAgo(50), event: "Allocated to D. Reyes", by: "S. Patel", type: "allocate" },
    { at: daysAgo(3), event: "Returned by D. Reyes — condition: Fair", by: "D. Reyes", type: "return" },
  ],
  "AF-0044": [{ at: daysAgo(7), event: "Allocated to J. Kowalski", by: "S. Patel", type: "allocate" }],
  "AF-0002": [{ at: daysAgo(4), event: "Allocated to L. Marsh", by: "S. Patel", type: "allocate" }],
};

const SEED_TRANSFERS = [
  {
    id: "TR-501",
    assetId: "AF-0055",
    fromHolder: "Warehouse A Ops",
    toHolder: "Warehouse B Ops",
    toHolderType: "Department",
    reason: "Reallocating scanners to support Warehouse B cycle counting.",
    requestedBy: "T. Adeyemi",
    status: "Re-allocated",
    requestedAt: daysAgo(61),
    approvedAt: daysAgo(60),
  },
];

let assetSeq = 900;
const nextTransferId = () => `TR-${assetSeq++}`;

const isOverdue = (holder) => holder && holder.expectedReturn && holder.expectedReturn.getTime() < NOW.getTime();

const deriveStatus = (asset) => {
  if (!asset.holder) return "Available";
  return isOverdue(asset.holder) ? "Overdue" : "Allocated";
};



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

function HolderIcon({ type }) {
  return type === "Department" ? <Building2 size={13} /> : <User size={13} />;
}

function AllocateModal({ assets, presetAssetId, onClose, onAllocate, onRequestTransfer }) {
  const [assetId, setAssetId] = useState(presetAssetId || assets.find((a) => !a.holder)?.id || assets[0]?.id);
  const [holderType, setHolderType] = useState("Employee");
  const [holderName, setHolderName] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [allocatedBy, setAllocatedBy] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [mode, setMode] = useState("allocate"); // 'allocate' | 'conflict' | 'transfer-form'

  const asset = assets.find((a) => a.id === assetId);
  const conflict = asset?.holder;

  const handleAssetChange = (id) => {
    setAssetId(id);
    const a = assets.find((x) => x.id === id);
    setMode(a?.holder ? "conflict" : "allocate");
  };

  const canAllocate = holderName.trim().length > 0 && allocatedBy.trim().length > 0;
  const canTransfer = holderName.trim().length > 0 && transferReason.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {mode === "transfer-form" ? "Request transfer" : "Allocate asset"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === "transfer-form"
                ? "Submit a transfer request for Asset Manager or Department Head approval."
                : "Assign an asset to an employee or department."}
            </p>
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
              onChange={(e) => handleAssetChange(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-800"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {a.id} {a.holder ? `(held by ${a.holder.name})` : "(available)"}
                </option>
              ))}
            </select>
          </div>

          {mode === "conflict" && conflict && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">This asset can't be allocated directly</p>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    <span className="font-medium">{asset.name} ({asset.id})</span> is currently held by{" "}
                    <span className="font-semibold">{conflict.name}</span>
                    {conflict.expectedReturn && (
                      <> · expected return {fmtDate(conflict.expectedReturn)}</>
                    )}
                    . Raise a transfer request instead — it will move to this asset's owner once approved.
                  </p>
                  <button
                    onClick={() => setMode("transfer-form")}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-white border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-colors"
                  >
                    <ArrowLeftRight size={13} /> Request Transfer instead
                  </button>
                </div>
              </div>
            </div>
          )}

          {(mode === "allocate" || mode === "transfer-form") && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Allocate to</label>
                <div className="flex gap-2 mb-2">
                  {["Employee", "Department"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setHolderType(t)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors"
                      style={
                        holderType === t
                          ? { backgroundColor: "#EFF6FF", color: "#1D4ED8", borderColor: "#BFDBFE" }
                          : { backgroundColor: "white", color: "#64748B", borderColor: "#E2E8F0" }
                      }
                    >
                      {t === "Employee" ? <User size={13} /> : <Building2 size={13} />}
                      {t}
                    </button>
                  ))}
                </div>
                <input
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder={holderType === "Employee" ? "Employee name" : "Department name"}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>

              {mode === "allocate" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Expected return date <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="date"
                      value={expectedReturn}
                      onChange={(e) => setExpectedReturn(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Allocated by</label>
                    <input
                      value={allocatedBy}
                      onChange={(e) => setAllocatedBy(e.target.value)}
                      placeholder="Your name"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                    />
                  </div>
                </>
              )}

              {mode === "transfer-form" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Reason for transfer</label>
                  <textarea
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    rows={3}
                    placeholder="Explain why this asset should move..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 resize-none"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200/60 transition-colors">
            Cancel
          </button>
          {mode === "allocate" && (
            <button
              disabled={!canAllocate}
              onClick={() =>
                onAllocate({
                  assetId,
                  holderType,
                  holderName: holderName.trim(),
                  expectedReturn: expectedReturn ? new Date(expectedReturn) : null,
                  allocatedBy: allocatedBy.trim(),
                })
              }
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              <UserPlus size={15} /> Allocate asset
            </button>
          )}
          {mode === "transfer-form" && (
            <button
              disabled={!canTransfer}
              onClick={() =>
                onRequestTransfer({
                  assetId,
                  toHolder: holderName.trim(),
                  toHolderType: holderType,
                  reason: transferReason.trim(),
                })
              }
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-white bg-violet-700 hover:bg-violet-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              <ArrowLeftRight size={15} /> Submit transfer request
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReturnModal({ asset, onClose, onReturn }) {
  const [condition, setCondition] = useState("Good");
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Mark as returned</h2>
            <p className="text-xs text-slate-500 mt-0.5">{asset.name} · {asset.id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Condition check-in</label>
            <div className="flex gap-2">
              {Object.keys(CONDITION_META).map((c) => (
                <button
                  key={c}
                  onClick={() => setCondition(c)}
                  className="flex-1 px-2 py-2 rounded-lg text-xs font-semibold border transition-colors"
                  style={
                    condition === c
                      ? { backgroundColor: CONDITION_META[c].bg, color: CONDITION_META[c].color, borderColor: CONDITION_META[c].color }
                      : { backgroundColor: "white", color: "#64748B", borderColor: "#E2E8F0" }
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Check-in notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any visible wear, damage, or missing accessories..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200/60 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onReturn({ condition, notes: notes.trim() })}
            className="px-3.5 py-2 rounded-lg text-sm font-medium text-white bg-green-700 hover:bg-green-800 transition-colors flex items-center gap-1.5"
          >
            <Undo2 size={15} /> Confirm return
          </button>
        </div>
      </div>
    </div>
  );
}


function AssetDrawer({ asset, history, transfers, onClose, onAllocateClick, onTransferClick, onReturnClick }) {
  const status = deriveStatus(asset);
  const meta = STATUS_META[status];
  const overdueDays = isOverdue(asset.holder)
    ? Math.ceil((NOW.getTime() - asset.holder.expectedReturn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <p className="text-xs font-semibold text-slate-400">{asset.id}</p>
            <h2 className="text-base font-semibold text-slate-900 mt-0.5">{asset.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{asset.category}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <Badge label={status} color={meta.color} bg={meta.bg} border={meta.border} />

          {status === "Overdue" && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 flex items-start gap-2.5">
              <ShieldAlert size={15} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-rose-800 leading-relaxed">
                <span className="font-semibold">{overdueDays} day{overdueDays === 1 ? "" : "s"} overdue.</span> Expected
                return was {fmtDate(asset.holder.expectedReturn)}. This has been flagged on the dashboard and
                notifications.
              </p>
            </div>
          )}

          {asset.holder ? (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Current holder</p>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                    <HolderIcon type={asset.holder.type} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{asset.holder.name}</p>
                    <p className="text-[11px] text-slate-400">{asset.holder.type}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                  <div>
                    <p className="text-slate-400">Allocated</p>
                    <p className="text-slate-700 font-medium">{fmtDate(asset.holder.allocatedDate)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Expected return</p>
                    <p className="text-slate-700 font-medium">
                      {asset.holder.expectedReturn ? fmtDate(asset.holder.expectedReturn) : "Open-ended"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-100 rounded-lg p-3.5 text-sm text-green-800">
              This asset is currently unassigned and available for allocation.
            </div>
          )}

          {transfers.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Transfer requests</p>
              <div className="space-y-2">
                {transfers.map((t) => {
                  const tm = TRANSFER_META[t.status];
                  const TIcon = tm.icon;
                  return (
                    <div key={t.id} className="border border-slate-100 rounded-lg p-3 bg-white">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-semibold text-slate-400">{t.id}</p>
                        <Badge label={t.status} color={tm.color} bg={tm.bg} icon={TIcon} />
                      </div>
                      <p className="text-xs text-slate-700">
                        {t.fromHolder || "Unassigned"} <ChevronRight size={11} className="inline" /> {t.toHolder}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">{t.reason}</p>
                      {t.status === "Requested" && (
                        <button
                          onClick={() => onTransferClick(t.id)}
                          className="mt-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-2.5 py-1 hover:bg-blue-100 transition-colors"
                        >
                          Approve transfer
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
              <History size={13} /> History
            </p>
            <div className="space-y-3">
              {history.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                    {i < history.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm text-slate-800">{h.event}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {h.by} · {fmtDateTime(h.at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-2 justify-end">
          {asset.holder ? (
            <>
              <button
                onClick={() => onTransferClick(null, asset.id)}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-violet-700 bg-white border border-violet-200 hover:bg-violet-50 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeftRight size={15} /> Request transfer
              </button>
              <button
                onClick={() => onReturnClick(asset.id)}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-white bg-green-700 hover:bg-green-800 transition-colors flex items-center gap-1.5"
              >
                <Undo2 size={15} /> Mark returned
              </button>
            </>
          ) : (
            <button
              onClick={() => onAllocateClick(asset.id)}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <UserPlus size={15} /> Allocate this asset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


export default function AssetAllocationScreen() {
  const [assets, setAssets] = useState(SEED_ASSETS);
  const [historyMap, setHistoryMap] = useState(SEED_HISTORY);
  const [transfers, setTransfers] = useState(SEED_TRANSFERS);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocatePreset, setAllocatePreset] = useState(null);
  const [returnAssetId, setReturnAssetId] = useState(null);
  const [transferPreset, setTransferPreset] = useState(null); // assetId to pre-fill transfer form

  const addHistory = (assetId, event, by, type) =>
    setHistoryMap((prev) => ({
      ...prev,
      [assetId]: [...(prev[assetId] || []), { at: new Date(), event, by, type }],
    }));


  const handleAllocate = ({ assetId, holderType, holderName, expectedReturn, allocatedBy }) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? { ...a, holder: { type: holderType, name: holderName, allocatedDate: new Date(), expectedReturn, allocatedBy } }
          : a
      )
    );
    addHistory(assetId, `Allocated to ${holderName}`, allocatedBy, "allocate");
    setShowAllocateModal(false);
  };

 
  const handleRequestTransfer = ({ assetId, toHolder, toHolderType, reason }) => {
    const asset = assets.find((a) => a.id === assetId);
    const id = nextTransferId();
    setTransfers((prev) => [
      ...prev,
      {
        id,
        assetId,
        fromHolder: asset?.holder?.name || null,
        toHolder,
        toHolderType,
        reason,
        requestedBy: "A. Sharma",
        status: "Requested",
        requestedAt: new Date(),
        approvedAt: null,
      },
    ]);
    addHistory(assetId, `Transfer requested: to ${toHolder}`, "A. Sharma", "transfer-request");
    setShowAllocateModal(false);
  };

 
  const handleApproveTransfer = (transferId) => {
    const t = transfers.find((x) => x.id === transferId);
    if (!t) return;
    setTransfers((prev) =>
      prev.map((x) => (x.id === transferId ? { ...x, status: "Re-allocated", approvedAt: new Date() } : x))
    );
    setAssets((prev) =>
      prev.map((a) =>
        a.id === t.assetId
          ? {
              ...a,
              holder: {
                type: t.toHolderType,
                name: t.toHolder,
                allocatedDate: new Date(),
                expectedReturn: null,
                allocatedBy: "T. Adeyemi",
              },
            }
          : a
      )
    );
    addHistory(
      t.assetId,
      `Transfer approved and re-allocated to ${t.toHolder}`,
      "T. Adeyemi (Asset Manager)",
      "transfer"
    );
  };


  const handleReturn = ({ condition, notes }) => {
    const asset = assets.find((a) => a.id === returnAssetId);
    setAssets((prev) => prev.map((a) => (a.id === returnAssetId ? { ...a, holder: null } : a)));
    addHistory(
      returnAssetId,
      `Returned by ${asset?.holder?.name} — condition: ${condition}${notes ? ` (${notes})` : ""}`,
      asset?.holder?.name || "Unknown",
      "return"
    );
    setReturnAssetId(null);
  };

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || null;
  const returnAsset = assets.find((a) => a.id === returnAssetId) || null;

  const overdueAssets = assets.filter((a) => isOverdue(a.holder));

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      const status = deriveStatus(a);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        (a.holder && a.holder.name.toLowerCase().includes(q))
      );
    });
  }, [assets, search, statusFilter]);

  const openAllocateFor = (assetId) => {
    setAllocatePreset(assetId);
    setShowAllocateModal(true);
  };

  const openTransferFor = (transferIdToApprove, assetIdToRequest) => {
    if (transferIdToApprove) {
      handleApproveTransfer(transferIdToApprove);
      return;
    }
    setAllocatePreset(assetIdToRequest);
    setShowAllocateModal(true);
  };

  return (
    <div
      className="min-h-screen w-full bg-slate-50 text-slate-900"
      style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
    >
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Boxes size={17} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none">Asset Allocation &amp; Transfer</p>
              <p className="text-[11px] text-slate-400 mt-1">AssetFlow · Who holds what</p>
            </div>
          </div>
          <button
            onClick={() => {
              setAllocatePreset(null);
              setShowAllocateModal(true);
            }}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
          >
            <UserPlus size={15} /> Allocate Asset
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {overdueAssets.length > 0 && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={17} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-rose-900">
                  {overdueAssets.length} overdue allocation{overdueAssets.length === 1 ? "" : "s"} — past expected
                  return date
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {overdueAssets.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAssetId(a.id)}
                      className="text-xs font-medium text-rose-800 bg-white border border-rose-200 rounded-md px-2.5 py-1 hover:bg-rose-100 transition-colors"
                    >
                      {a.name} ({a.id}) · held by {a.holder.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Allocation Registry</h1>
            <p className="text-xs text-slate-500 mt-0.5">{assets.length} tracked assets · {overdueAssets.length} overdue</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search asset or holder..."
                className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg w-full sm:w-60 focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 text-slate-700"
              >
                <option value="all">All statuses</option>
                <option value="Available">Available</option>
                <option value="Allocated">Allocated</option>
                <option value="Overdue">Overdue</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-3 border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <div className="col-span-3">Asset</div>
            <div className="col-span-3">Current holder</div>
            <div className="col-span-2">Expected return</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.map((a) => {
              const status = deriveStatus(a);
              const meta = STATUS_META[status];
              return (
                <div key={a.id} className="grid grid-cols-2 sm:grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-slate-50/60 transition-colors">
                  <button onClick={() => setSelectedAssetId(a.id)} className="col-span-2 sm:col-span-3 text-left min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{a.name}</p>
                    <p className="text-xs text-slate-400">{a.id} · {a.category}</p>
                  </button>
                  <div className="col-span-2 sm:col-span-3 min-w-0">
                    {a.holder ? (
                      <div className="flex items-center gap-1.5 text-sm text-slate-700">
                        <HolderIcon type={a.holder.type} />
                        <span className="truncate">{a.holder.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">Unassigned</span>
                    )}
                  </div>
                  <div className="col-span-1 sm:col-span-2 text-sm text-slate-600">
                    {a.holder?.expectedReturn ? fmtDate(a.holder.expectedReturn) : a.holder ? "Open-ended" : "—"}
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <Badge label={status} color={meta.color} bg={meta.bg} border={meta.border} />
                  </div>
                  <div className="col-span-2 sm:col-span-2 flex sm:justify-end gap-1.5">
                    {a.holder ? (
                      <>
                        <button
                          onClick={() => openTransferFor(null, a.id)}
                          title="Request transfer"
                          className="p-2 rounded-md hover:bg-violet-50 text-violet-600 transition-colors"
                        >
                          <ArrowLeftRight size={15} />
                        </button>
                        <button
                          onClick={() => setReturnAssetId(a.id)}
                          title="Mark returned"
                          className="p-2 rounded-md hover:bg-green-50 text-green-600 transition-colors"
                        >
                          <Undo2 size={15} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => openAllocateFor(a.id)}
                        title="Allocate"
                        className="p-2 rounded-md hover:bg-blue-50 text-blue-600 transition-colors"
                      >
                        <UserPlus size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-14 text-center text-sm text-slate-400">No assets match your filters.</div>
            )}
          </div>
        </div>

        {transfers.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-bold text-slate-700 mb-3">Transfer Requests</h2>
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
              {transfers
                .slice()
                .reverse()
                .map((t) => {
                  const tm = TRANSFER_META[t.status];
                  const TIcon = tm.icon;
                  const asset = assets.find((a) => a.id === t.assetId);
                  return (
                    <div key={t.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-semibold text-slate-400">{t.id}</p>
                          <Badge label={t.status} color={tm.color} bg={tm.bg} icon={TIcon} />
                        </div>
                        <p className="text-sm text-slate-800 mt-1">
                          {asset?.name} ({t.assetId}): {t.fromHolder || "Unassigned"}{" "}
                          <ChevronRight size={12} className="inline text-slate-400" /> {t.toHolder}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{t.reason}</p>
                      </div>
                      {t.status === "Requested" && (
                        <button
                          onClick={() => handleApproveTransfer(t.id)}
                          className="flex-shrink-0 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md px-3 py-1.5 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </main>

      {showAllocateModal && (
        <AllocateModal
          assets={assets}
          presetAssetId={allocatePreset}
          onClose={() => setShowAllocateModal(false)}
          onAllocate={handleAllocate}
          onRequestTransfer={handleRequestTransfer}
        />
      )}

      {returnAsset && (
        <ReturnModal asset={returnAsset} onClose={() => setReturnAssetId(null)} onReturn={handleReturn} />
      )}

      {selectedAsset && (
        <AssetDrawer
          asset={selectedAsset}
          history={(historyMap[selectedAsset.id] || []).slice().sort((a, b) => b.at.getTime() - a.at.getTime())}
          transfers={transfers.filter((t) => t.assetId === selectedAsset.id)}
          onClose={() => setSelectedAssetId(null)}
          onAllocateClick={openAllocateFor}
          onTransferClick={openTransferFor}
          onReturnClick={(id) => setReturnAssetId(id)}
        />
      )}
    </div>
  );
}
