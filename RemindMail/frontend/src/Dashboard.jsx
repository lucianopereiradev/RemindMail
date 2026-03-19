import API_URL from "./api.js";
import { useEffect, useState } from "react";
import { Button } from "./components/ui/button.jsx";
import { Input } from "./components/ui/input.jsx";
import { Textarea } from "./components/ui/textarea.jsx";
import { Bell, LogOut, Plus, Trash2, Edit2, Save, Clock, CalendarDays, Info, X } from "lucide-react";
import { motion } from "framer-motion";

const RECURRING_LABELS = { daily: "Diário", weekly: "Semanal", monthly: "Mensal" };

function Tooltip({ text }) {
  return (
    <span className="group relative cursor-help">
      <Info size={14} className="text-white/40 hover:text-white/70 transition" />
      <span className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs rounded-lg px-3 py-2 w-52 text-center opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
        {text}
      </span>
    </span>
  );
}

export default function Dashboard({ onLogout }) {
  const [reminders, setReminders] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState("daily");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editRecurring, setEditRecurring] = useState(false);
  const [editRecurringType, setEditRecurringType] = useState("daily");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("reminders");

  useEffect(() => { loadReminders(); }, []);

  function parseServerTimestampAsLocal(value) {
    if (!value) return null;
    const normalized = value.replace(" ", "T").replace(".000Z", "");
    const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!match) {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }
    const [, year, month, day, hour, minute, second = "00"] = match;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  }

  function toLocalDateTime(value) {
    const d = parseServerTimestampAsLocal(value);
    if (!d) return "";
    const pad = (v) => String(v).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function formatDateTime(value) {
    const d = parseServerTimestampAsLocal(value);
    if (!d) return value;
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  async function loadReminders() {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/reminders`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setReminders(Array.isArray(data) ? data : []);
  }

  async function createReminder() {
    if (!title || !date) return alert("Preencha o título e a data/hora do lembrete.");
    const token = localStorage.getItem("token");
    await fetch(`${API_URL}/reminder`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, description, remind_at: date, recurring, recurring_type: recurring ? recurringType : null }),
    });
    setTitle(""); setDescription(""); setDate(""); setRecurring(false); setRecurringType("daily");
    loadReminders();
  }

  async function deleteReminder(id) {
    const token = localStorage.getItem("token");
    await fetch(`${API_URL}/reminder/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    loadReminders();
  }

  function startEdit(r) {
    setEditingId(r.id);
    setEditTitle(r.title);
    setEditDescription(r.description || "");
    setEditDate(toLocalDateTime(r.remind_at));
    setEditRecurring(r.recurring);
    setEditRecurringType(r.recurring_type || "daily");
  }

  async function saveEdit(id) {
    const token = localStorage.getItem("token");
    await fetch(`${API_URL}/reminder/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: editTitle, description: editDescription, remind_at: editDate, recurring: editRecurring, recurring_type: editRecurring ? editRecurringType : null }),
    });
    setEditingId(null);
    loadReminders();
  }

  async function deleteAccount() {
    const token = localStorage.getItem("token");
    await fetch(`${API_URL}/delete-account`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    localStorage.removeItem("token");
    window.location.reload();
  }

  const selectClass = "w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white text-sm appearance-none cursor-pointer focus:outline-none focus:border-blue-400";

  return (
    <div className="min-h-screen pb-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-white">
          <div className="flex items-center gap-2 font-bold text-xl sm:text-2xl">
            <Bell size={22} className="text-blue-300" /> RemindMail
          </div>
          <div className="flex gap-2 rounded-full bg-white/10 p-1">
            <button onClick={() => setActiveTab("reminders")} className={`px-3 py-1 text-xs sm:text-sm rounded-full transition ${activeTab === "reminders" ? "bg-blue-500 text-white" : "text-white/80 hover:text-white"}`}>
              Lembretes
            </button>
            <button onClick={() => setActiveTab("account")} className={`px-3 py-1 text-xs sm:text-sm rounded-full transition ${activeTab === "account" ? "bg-teal-500 text-white" : "text-white/80 hover:text-white"}`}>
              Conta
            </button>
          </div>
        </motion.div>

        {activeTab === "reminders" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 sm:p-6 shadow-2xl text-white">
              <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                <Plus size={20} className="text-blue-300" /> Novo lembrete
              </h3>
              <p className="text-white/50 text-xs mb-4">Ex: "Futebol 18:00" — avise às 17:00</p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-white/60 flex items-center gap-1">
                    Título <Tooltip text="Nome do seu compromisso. Ex: Reunião com cliente, Futebol, Dentista." />
                  </label>
                  <Input placeholder="Ex: Reunião com o cliente" value={title} onChange={e => setTitle(e.target.value)} className="bg-white/10 border-white/20 text-white placeholder-white/30 text-sm" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-white/60 flex items-center gap-1">
                    Descrição <Tooltip text="Opcional. Adicione detalhes extras que aparecerão no e-mail." />
                  </label>
                  <Textarea placeholder="Ex: Sala 3, trazer relatório" value={description} onChange={e => setDescription(e.target.value)} className="resize-none bg-white/10 border-white/20 text-white placeholder-white/30 text-sm h-20" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-white/60 flex items-center gap-1">
                    <CalendarDays size={12} /> Quando avisar? <Tooltip text="Defina a data e a hora que você quer receber o e-mail." />
                  </label>
                  <Input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="bg-white/10 border-white/20 text-white text-sm" />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recurring}
                      onChange={e => setRecurring(e.target.checked)}
                      className="w-4 h-4 rounded accent-blue-400 cursor-pointer"
                    />
                    <span>Repetir automaticamente</span>
                    <Tooltip text="O lembrete se repetirá no mesmo horário conforme a frequência escolhida." />
                  </label>

                  {recurring && (
                    <div className="space-y-1">
                      <label className="text-xs text-white/60">Frequência</label>
                      <select
                        value={recurringType}
                        onChange={e => setRecurringType(e.target.value)}
                        className={selectClass}
                      >
                        <option value="daily" className="bg-gray-800">Diariamente</option>
                        <option value="weekly" className="bg-gray-800">Semanalmente</option>
                        <option value="monthly" className="bg-gray-800">Mensalmente</option>
                      </select>
                    </div>
                  )}
                </div>

                <Button onClick={createReminder} className="w-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2 font-semibold">
                  <Plus size={16} /> Criar lembrete
                </Button>
              </div>
            </motion.div>

            {/* List */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="lg:col-span-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 sm:p-6 shadow-2xl text-white">
              <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                <Clock size={20} className="text-purple-300" /> Seus lembretes
              </h3>
              <p className="text-white/50 text-xs mb-4">{reminders.length} lembrete{reminders.length !== 1 ? "s" : ""} agendado{reminders.length !== 1 ? "s" : ""}</p>

              <div className="space-y-3 max-h-[500px] overflow-auto pr-1">
                {reminders.map((r, idx) => (
                  <motion.div key={r.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * idx }}
                    className="bg-white/10 border border-white/10 rounded-2xl p-4 hover:bg-white/15 transition">
                    {editingId === r.id ? (
                      <div className="space-y-3">
                        <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="bg-white/10 border-white/20 text-white text-sm" placeholder="Título" />
                        <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} className="bg-white/10 border-white/20 text-white resize-none text-sm h-16" placeholder="Descrição" />
                        <Input type="datetime-local" value={editDate} onChange={e => setEditDate(e.target.value)} className="bg-white/10 border-white/20 text-white text-sm" />
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={editRecurring} onChange={e => setEditRecurring(e.target.checked)} className="w-4 h-4 rounded accent-blue-400 cursor-pointer" />
                          Repetir automaticamente
                        </label>
                        {editRecurring && (
                          <select value={editRecurringType} onChange={e => setEditRecurringType(e.target.value)} className={selectClass}>
                            <option value="daily" className="bg-gray-800">Diariamente</option>
                            <option value="weekly" className="bg-gray-800">Semanalmente</option>
                            <option value="monthly" className="bg-gray-800">Mensalmente</option>
                          </select>
                        )}
                        <div className="flex gap-2">
                          <Button onClick={() => saveEdit(r.id)} className="flex-1 gap-2 bg-green-600 hover:bg-green-700 rounded-full text-sm">
                            <Save size={14} /> Salvar
                          </Button>
                          <Button onClick={() => setEditingId(null)} className="flex-1 gap-2 bg-white/10 hover:bg-white/20 rounded-full text-sm">
                            <X size={14} /> Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base truncate">{r.title}</p>
                          {r.description && <p className="text-sm text-white/60 mt-0.5 line-clamp-2">{r.description}</p>}
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="text-xs text-white/50 flex items-center gap-1">
                              <Clock size={11} />
                              {formatDateTime(r.remind_at)}
                            </span>
                            {r.recurring && (
                              <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-400/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <RefreshCw size={10} /> {RECURRING_LABELS[r.recurring_type] || r.recurring_type}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="icon" onClick={() => startEdit(r)} className="bg-white/10 hover:bg-blue-600 h-8 w-8 rounded-xl transition">
                            <Edit2 size={13} />
                          </Button>
                          <Button size="icon" onClick={() => deleteReminder(r.id)} className="bg-white/10 hover:bg-red-600 h-8 w-8 rounded-xl transition">
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {reminders.length === 0 && (
                  <div className="text-center py-12 text-white/40">
                    <Bell size={36} className="mx-auto mb-3 opacity-30" />
                    <p>Nenhum lembrete agendado.</p>
                    <p className="text-xs mt-1">Crie um lembrete ao lado para começar!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
            <h3 className="font-bold text-xl mb-2">Conta</h3>
            <p className="text-white/70 mb-4">Gerencie sua conta, saia da sessão ou exclua completamente todos os dados.</p>
            <div className="space-y-3 text-sm text-white/90">
              <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                <p className="text-xs uppercase tracking-wide text-white/50 mb-1">Autenticação</p>
                <p>Token salvo no armazenamento local.</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                <p className="text-xs uppercase tracking-wide text-white/50 mb-1">Ações</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={onLogout} className="flex-1 bg-white/10 hover:bg-white/20 rounded-full gap-2 justify-center">
                    <LogOut size={14} /> Sair
                  </Button>
                  <Button onClick={() => setShowDeleteConfirm(true)} className="flex-1 bg-red-500/20 hover:bg-red-500/40 rounded-full gap-2 justify-center">
                    <Trash2 size={14} /> Excluir conta
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Modal de confirmação de exclusão de conta */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-white text-center space-y-4">
            <div className="text-red-400 text-4xl">⚠️</div>
            <h3 className="font-bold text-xl">Excluir conta?</h3>
            <p className="text-white/60 text-sm">Todos os seus lembretes serão apagados permanentemente. Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <Button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-white/10 hover:bg-white/20 rounded-full">Cancelar</Button>
              <Button onClick={deleteAccount} className="flex-1 bg-red-600 hover:bg-red-700 rounded-full">Sim, excluir</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function RefreshCw({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}
