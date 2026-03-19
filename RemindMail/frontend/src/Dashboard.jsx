import API_URL from "./api.js";
import { useEffect, useState } from "react";
import { Button } from "./components/ui/button.jsx";
import { Input } from "./components/ui/input.jsx";
import { Textarea } from "./components/ui/textarea.jsx";
import { Bell, Plus, Trash2, Edit2, Save, Clock, CalendarDays, Info, X, User, LogOut, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const RECURRING_LABELS = { daily: "Diariamente", weekly: "Semanalmente", monthly: "Mensalmente" };

function Tooltip({ text }) {
  return (
    <span className="group relative cursor-help inline-flex">
      <Info size={13} className="text-white/40 hover:text-white/70 transition" />
      <span className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/10 text-white text-xs rounded-xl px-3 py-2 w-52 text-center opacity-0 group-hover:opacity-100 transition pointer-events-none z-50 shadow-xl">
        {text}
      </span>
    </span>
  );
}

const selectClass = "w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white text-sm cursor-pointer focus:outline-none focus:border-blue-400";

export default function Dashboard({ onLogout }) {
  const [tab, setTab] = useState("reminders");
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

  useEffect(() => { loadReminders(); }, []);

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
    setEditDate(r.remind_at.slice(0, 16));
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

  return (
    <div className="min-h-screen pb-16">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center text-white">
          <div className="flex items-center gap-2 font-bold text-xl sm:text-2xl">
            <Bell size={22} className="text-blue-300" /> RemindMail
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span className="hidden sm:inline">
              {reminders.length} lembrete{reminders.length !== 1 ? "s" : ""} agendado{reminders.length !== 1 ? "s" : ""}
            </span>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white/10 border border-white/20 rounded-2xl p-1 w-fit">
          {[
            { key: "reminders", label: "Lembretes", icon: <Clock size={15} /> },
            { key: "account", label: "Conta", icon: <User size={15} /> },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
                tab === t.key ? "bg-white text-blue-700 shadow" : "text-white/60 hover:text-white"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Lembretes */}
        {tab === "reminders" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 sm:p-6 text-white">
              <h3 className="font-bold text-base mb-0.5 flex items-center gap-2">
                <Plus size={18} className="text-blue-300" /> Novo lembrete
              </h3>
              <p className="text-white/40 text-xs mb-4">Ex: "Futebol 18:00" — avise às 17:00</p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-white/50 flex items-center gap-1">
                    Título <Tooltip text="Nome do compromisso. Ex: Reunião, Futebol, Dentista." />
                  </label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Reunião com cliente" className="bg-white/10 border-white/20 text-white placeholder-white/25 text-sm" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-white/50 flex items-center gap-1">
                    Descrição <Tooltip text="Opcional. Aparecerá no e-mail de aviso." />
                  </label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Sala 3, trazer relatório" className="resize-none bg-white/10 border-white/20 text-white placeholder-white/25 text-sm h-18" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-white/50 flex items-center gap-1">
                    <CalendarDays size={11} /> Quando avisar? <Tooltip text="Data e hora do e-mail de aviso." />
                  </label>
                  <Input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="bg-white/10 border-white/20 text-white text-sm" />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} className="w-4 h-4 rounded accent-blue-400 cursor-pointer" />
                    <span>Repetir automaticamente</span>
                    <Tooltip text="O aviso se repetirá no mesmo horário na frequência escolhida." />
                  </label>
                  {recurring && (
                    <div className="space-y-1">
                      <label className="text-xs text-white/50">Frequência</label>
                      <select value={recurringType} onChange={e => setRecurringType(e.target.value)} className={selectClass}>
                        <option value="daily" className="bg-gray-800">Diariamente</option>
                        <option value="weekly" className="bg-gray-800">Semanalmente</option>
                        <option value="monthly" className="bg-gray-800">Mensalmente</option>
                      </select>
                    </div>
                  )}
                </div>

                <Button onClick={createReminder} className="w-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold gap-2 py-2">
                  <Plus size={16} /> Criar lembrete
                </Button>
              </div>
            </motion.div>

            {/* List */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="lg:col-span-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 sm:p-6 text-white">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                <Clock size={18} className="text-purple-300" /> Seus lembretes
              </h3>

              <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                {reminders.map((r, idx) => (
                  <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * idx }}
                    className="bg-white/10 border border-white/10 rounded-2xl p-4 hover:bg-white/15 transition">
                    {editingId === r.id ? (
                      <div className="space-y-3">
                        <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Título" className="bg-white/10 border-white/20 text-white text-sm" />
                        <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Descrição" className="bg-white/10 border-white/20 text-white resize-none text-sm h-16" />
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
                          <Button onClick={() => saveEdit(r.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm gap-1.5">
                            <Save size={13} /> Salvar
                          </Button>
                          <Button onClick={() => setEditingId(null)} className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm gap-1.5">
                            <X size={13} /> Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base truncate">{r.title}</p>
                          {r.description && <p className="text-xs text-white/55 mt-0.5 line-clamp-2">{r.description}</p>}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs text-white/45 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(r.remind_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {r.recurring && (
                              <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-400/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <RefreshCw size={10} /> {RECURRING_LABELS[r.recurring_type] || r.recurring_type}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Button size="icon" onClick={() => startEdit(r)} className="bg-white/10 hover:bg-blue-600 text-white h-8 w-8 rounded-xl">
                            <Edit2 size={13} />
                          </Button>
                          <Button size="icon" onClick={() => deleteReminder(r.id)} className="bg-white/10 hover:bg-red-600 text-white h-8 w-8 rounded-xl">
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}

                {reminders.length === 0 && (
                  <div className="text-center py-14 text-white/35">
                    <Bell size={32} className="mx-auto mb-3 opacity-25" />
                    <p className="text-sm">Nenhum lembrete agendado ainda.</p>
                    <p className="text-xs mt-1">Use o formulário ao lado para criar o primeiro!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Tab: Conta */}
        {tab === "account" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md space-y-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-white space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <User size={18} className="text-blue-300" /> Minha conta
              </h3>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white/60 space-y-2">
                <p>Gerencie suas preferências e ações de conta aqui.</p>
              </div>

              <Button
                onClick={onLogout}
                className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full gap-2 font-medium"
              >
                <LogOut size={16} /> Sair da conta
              </Button>
            </div>

            <div className="bg-red-500/10 border border-red-400/20 rounded-3xl p-6 text-white space-y-3">
              <h3 className="font-bold text-base text-red-300 flex items-center gap-2">
                ⚠️ Zona de perigo
              </h3>
              <p className="text-sm text-white/50">
                Ao excluir sua conta, todos os seus lembretes serão apagados permanentemente. Esta ação não pode ser desfeita.
              </p>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 rounded-full gap-2 font-medium transition"
              >
                <Trash2 size={15} /> Excluir minha conta
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Modal confirmação exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-white text-center space-y-4 shadow-2xl">
            <div className="text-5xl">⚠️</div>
            <h3 className="font-bold text-xl">Excluir conta?</h3>
            <p className="text-white/55 text-sm leading-relaxed">
              Todos os seus lembretes serão apagados permanentemente. Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 pt-1">
              <Button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium">
                Cancelar
              </Button>
              <Button onClick={deleteAccount} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium">
                Sim, excluir
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
