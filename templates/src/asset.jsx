import React, { useState, useMemo } from "react";
import {
  Search, X, Package, LayoutGrid, ArrowLeftRight, Calendar, BarChart3,
  Settings, User, Check, ShieldCheck, Clock, AlertCircle, ChevronDown, Send
} from "lucide-react";

const PEOPLE = ["Priya Nair", "Arjun Mehta", "Rahul Deshmukh", "Sana Iyer", "Vikram Shah"];

const initialAssets = [
  { id: "AST-1042", name: "MacBook Pro 16\"", category: "Laptop", status: "Allocated", holder: "Priya Nair", since: "2026-06-02" },
  { id: "AST-1043", name: "Dell UltraSharp 27\"", category: "Monitor", status: "Available", holder: null, since: null },
  { id: "AST-1044", name: "Herman Miller Aeron", category: "Furniture", status: "Available", holder: null, since: null },
  { id: "AST-1047", name: "Sony PXW Camera", category: "AV Equipment", status: "Allocated", holder: "Rahul Deshmukh", since: "2026-06-19" },
  { id: "AST-1050", name: "iPhone 16 Pro (Pool)", category: "Mobile", status: "Allocated", holder: "Sana Iyer", since: "2026-05-11" },
  { id: "AST-1051", name: "Epson Projector", category: "AV Equipment", status: "Available", holder: null, since: null },
  { id: "AST-1052", name: "Standing Desk", category: "Furniture", status: "Allocated", holder: "Vikram Shah", since: "2026-04-30" },
];

function Sidebar() {
  const items = [
    { icon: LayoutGrid, label: "Dashboard" },
    { icon: Package, label: "Assets" },
    { icon: ArrowLeftRight, label: "Allocations", active: true },
    { icon: Calendar, label: "Bookings" },
    { icon: BarChart3, label: "Reports" },
    { icon: Settings, label: "Settings" },
  ];
  return (
    <div className="w-56 bg-slate-900 text-slate-300 flex flex-col shrink-0">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-800">
        <div className="w-7 h-7 rounded bg-teal-500 flex items-center justify-center">
          <Package size={16} className="text-slate-900" />
        </div>
        <span className="text-white font-semibold tracking-tight">AssetFlow</span>
      </div>
      <nav className="flex-1 py-4">
        {items.map(({ icon: Icon, label, active }) => (
          <div
            key={label}
            className={`flex items-center gap-3 px-5 py-2.5 text-sm cursor-pointer ${
              active ? "bg-slate-800 text-white border-r-2 border-teal-400" : "hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <Icon size={16} />
            {label}
          </div>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-slate-800 text-xs text-slate-500">
        Pune HQ Workspace
      </div>
    </div>
  );
}

function AssetTag({ id }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs px-2 py-1 rounded bg-slate-900 text-slate-50">
      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
      {id}
    </span>
  );
}

function AllocateModal({ asset, onClose, onAllocate }) {
  const [person, setPerson] = useState(PEOPLE[0]);
  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Allocate asset</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-2">
            <AssetTag id={asset.id} />
            <span className="text-sm font-medium text-slate-800">{asset.name}</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Allocate to</label>
            <select
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {PEOPLE.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Cancel</button>
          <button
            onClick={() => onAllocate(asset.id, person)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded hover:bg-teal-700"
          >
            <Check size={15} /> Confirm allocation
          </button>
        </div>
      </div>
    </div>
  );
}

function RequestTransferModal({ asset, onClose, onRequest }) {
  const [requester, setRequester] = useState(PEOPLE.find((p) => p !== asset.holder) || PEOPLE[0]);
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Request transfer</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-2">
            <AssetTag id={asset.id} />
            <span className="text-sm font-medium text-slate-800">{asset.name}</span>
          </div>
          <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded px-3 py-2 flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            Currently held by {asset.holder}. This will create a pending transfer request for admin approval.
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Requesting for</label>
            <select
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {PEOPLE.filter((p) => p !== asset.holder).map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Needed for onsite client visit"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Cancel</button>
          <button
            onClick={() => onRequest(asset.id, requester, reason)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded hover:bg-amber-700"
          >
            <Send size={14} /> Submit request
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AssetAllocation() {
  const [assets, setAssets] = useState(initialAssets);
  const [query, setQuery] = useState("");
  const [allocateTarget, setAllocateTarget] = useState(null);
  const [transferTarget, setTransferTarget] = useState(null);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [adminMode, setAdminMode] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((a) => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q));
  }, [assets, query]);

  const handleAllocate = (assetId, person) => {
    setAssets((prev) => prev.map((a) => a.id === assetId
      ? { ...a, status: "Allocated", holder: person, since: new Date().toISOString().slice(0, 10) }
      : a));
    setAllocateTarget(null);
  };

  const handleRequestTransfer = (assetId, requester, reason) => {
    const asset = assets.find((a) => a.id === assetId);
    setPendingTransfers((prev) => [
      ...prev,
      { id: `TR-${Date.now()}`, assetId, assetName: asset.name, from: asset.holder, to: requester, reason, requestedOn: new Date().toISOString().slice(0, 10) },
    ]);
    setTransferTarget(null);
  };

  const approveTransfer = (transferId) => {
    const tr = pendingTransfers.find((t) => t.id === transferId);
    if (!tr) return;
    setAssets((prev) => prev.map((a) => a.id === tr.assetId
      ? { ...a, holder: tr.to, since: new Date().toISOString().slice(0, 10) }
      : a));
    setPendingTransfers((prev) => prev.filter((t) => t.id !== transferId));
  };

  const rejectTransfer = (transferId) => {
    setPendingTransfers((prev) => prev.filter((t) => t.id !== transferId));
  };

  return (
    <div className="flex h-[720px] bg-slate-50 font-sans text-slate-900 rounded-lg overflow-hidden border border-slate-200">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Asset Allocation & Transfer</h1>
            <p className="text-xs text-slate-500">{assets.filter(a => a.status === "Allocated").length} allocated &middot; {assets.filter(a => a.status === "Available").length} available</p>
          </div>
          <button
            onClick={() => setAdminMode((v) => !v)}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded border ${
              adminMode ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-300"
            }`}
          >
            <ShieldCheck size={15} />
            Admin mode
            <span className={`w-8 h-5 rounded-full relative transition-colors ${adminMode ? "bg-teal-500" : "bg-slate-300"}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${adminMode ? "translate-x-3.5" : "translate-x-0.5"}`} />
            </span>
          </button>
        </div>

        {adminMode && (
          <div className="px-6 py-3 border-b border-slate-200 bg-amber-50/60">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
              <Clock size={13} /> Pending transfer approvals ({pendingTransfers.length})
            </div>
            {pendingTransfers.length === 0 ? (
              <div className="text-xs text-slate-500">No pending transfer requests.</div>
            ) : (
              <div className="space-y-2">
                {pendingTransfers.map((tr) => (
                  <div key={tr.id} className="flex items-center justify-between bg-white border border-amber-200 rounded px-3 py-2">
                    <div className="text-sm text-slate-700">
                      <span className="font-medium">{tr.assetName}</span>
                      <span className="text-slate-400 mx-1.5">&middot;</span>
                      {tr.from} <ArrowLeftRight size={11} className="inline mx-1 text-slate-400" /> {tr.to}
                      {tr.reason && <span className="text-slate-400 ml-1.5">&mdash; "{tr.reason}"</span>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => rejectTransfer(tr.id)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-rose-600"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => approveTransfer(tr.id)}
                        className="px-2.5 py-1 text-xs font-medium text-white bg-emerald-600 rounded hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-2 flex-1 max-w-sm border border-slate-300 rounded px-3 py-1.5">
            <Search size={15} className="text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search assets to allocate"
              className="flex-1 text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((a) => (
              <div key={a.id} className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <AssetTag id={a.id} />
                    <div className="mt-1.5 font-medium text-slate-800 text-sm">{a.name}</div>
                    <div className="text-xs text-slate-400">{a.category}</div>
                  </div>
                  {a.status === "Available" ? (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Available
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <User size={11} /> Held by {a.holder}
                    </span>
                  )}
                </div>

                {a.status === "Allocated" && (
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={11} /> Since {a.since}
                  </div>
                )}

                <div className="mt-auto pt-1">
                  {a.status === "Available" ? (
                    <button
                      onClick={() => setAllocateTarget(a)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-white bg-teal-600 rounded hover:bg-teal-700"
                    >
                      <Check size={14} /> Allocate
                    </button>
                  ) : (
                    <button
                      onClick={() => setTransferTarget(a)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100"
                    >
                      <ArrowLeftRight size={14} /> Request transfer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {allocateTarget && (
        <AllocateModal asset={allocateTarget} onClose={() => setAllocateTarget(null)} onAllocate={handleAllocate} />
      )}
      {transferTarget && (
        <RequestTransferModal asset={transferTarget} onClose={() => setTransferTarget(null)} onRequest={handleRequestTransfer} />
      )}
    </div>
  );
}