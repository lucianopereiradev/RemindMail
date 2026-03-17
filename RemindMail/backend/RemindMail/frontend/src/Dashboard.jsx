import API_URL from "api.js";
import { useEffect, useState } from "react";
import { Button } from "./components/ui/button.jsx";
import { Input } from "./components/ui/input.jsx";
import { Textarea } from "./components/ui/textarea.jsx";
import { Bell, LogOut, Plus, Trash2, Edit2, Save, Clock } from "lucide-react";
import { motion } from "framer-motion";

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

  useEffect(() => {
    loadReminders();
  }, []);

  async function loadReminders() {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/reminders`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setReminders(data);
  }

  async function createReminder() {
    if (!title || !date) return;

    const token = localStorage.getItem("token");

    await fetch(`${API_URL}/reminder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        description,
        remind_at: date,
        recurring,
        recurring_type: recurring ? recurringType : null,
      }),
    });

    setTitle("");
    setDescription("");
    setDate("");
    setRecurring(false);
    loadReminders();
  }

  async function deleteReminder(id) {
    const token = localStorage.getItem("token");

    await fetch(`${API_URL}/reminder/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    loadReminders();
  }

  function startEdit(reminder) {
    setEditingId(reminder.id);
    setEditTitle(reminder.title);
    setEditDescription(reminder.description || "");
    setEditDate(reminder.remind_at.slice(0, 16));
    setEditRecurring(reminder.recurring);
    setEditRecurringType(reminder.recurring_type || "daily");
  }

  async function saveEdit(id) {
    const token = localStorage.getItem("token");

    await fetch(`${API_URL}/reminder/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: editTitle,
        description: editDescription,
        remind_at: editDate,
        recurring: editRecurring,
        recurring_type: editRecurring ? editRecurringType : null,
      }),
    });

    setEditingId(null);
    loadReminders();
  }

  async function deleteAccount() {
    const token = localStorage.getItem("token");

    await fetch(`${API_URL}/delete-account`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    localStorage.removeItem("token");
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 pb-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto p-6 space-y-8"
      >
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center text-white">
          <div className="flex items-center gap-2 font-bold text-2xl">
            <Bell size={24} /> RemindMail
          </div>

          <div className="flex gap-3">
            <Button onClick={deleteAccount} className="bg-red-600 hover:bg-red-700 rounded-full">
              Excluir conta
            </Button>

            <Button onClick={onLogout} className="bg-blue-600 hover:bg-blue-700 gap-2">
              <LogOut size={16} /> Sair
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Reminder Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-md border border-blue-400/30 rounded-3xl p-6 shadow-2xl text-white">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Plus size={20} className="text-blue-400" /> Novo lembrete
            </h3>

            <div className="space-y-3">
              <Input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} className="bg-white/10 border-white/20 text-white placeholder-white/50" />

              <Textarea
                placeholder="Descrição"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="resize-none bg-white/10 border-white/20 text-white placeholder-white/50"
              />

              <Input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="bg-white/10 border-white/20 text-white" />

              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={recurring}
                    onChange={e => setRecurring(e.target.checked)}
                    className="rounded"
                  />
                  <span>Recorrente</span>
                </label>

                {recurring && (
                  <select
                    value={recurringType}
                    onChange={e => setRecurringType(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white"
                  >
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                )}
              </div>

              <Button onClick={createReminder} className="w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 shadow-lg hover:shadow-xl transition-all duration-200 gap-2">
                <Plus size={16}  /> Criar
              </Button>
            </div>
          </motion.div>

          {/* Reminders List */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-md border border-purple-400/30 rounded-3xl p-6 shadow-2xl text-white">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Clock size={20} className="text-purple-400" /> Seus lembretes
            </h3>

            <div className="space-y-3 max-h-[480px] overflow-auto pr-2">
              {reminders.map((r, idx) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                  className="bg-white/10 border border-white/20 rounded-xl p-4 hover:bg-white/15 transition"
                >
                  {editingId === r.id ? (
                    <div className="space-y-3">
                      <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="bg-white/10 border-white/20 text-white" />
                      <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} className="bg-white/10 border-white/20 text-white resize-none" />
                      <Input type="datetime-local" value={editDate} onChange={e => setEditDate(e.target.value)} className="bg-white/10 border-white/20 text-white" />

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editRecurring}
                          onChange={e => setEditRecurring(e.target.checked)}
                          className="rounded"
                        />
                        Recorrente
                      </label>

                      {editRecurring && (
                        <select
                          value={editRecurringType}
                          onChange={e => setEditRecurringType(e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white"
                        >
                          <option value="daily">Diário</option>
                          <option value="weekly">Semanal</option>
                          <option value="monthly">Mensal</option>
                        </select>
                      )}

                      <Button onClick={() => saveEdit(r.id)} className="mt-3 gap-2 bg-green-600 hover:bg-green-700 w-full">
                        <Save size={16} /> Salvar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{r.title}</p>
                        {r.description && (
                          <p className="text-sm text-white/70 mt-1 whitespace-pre-wrap">{r.description}</p>
                        )}
                        {r.recurring && (
                          <p className="text-xs text-blue-300 mt-2 flex items-center gap-1">
                            <Clock size={14} /> Recorrente ({r.recurring_type})
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button size="icon" onClick={() => startEdit(r)} className="bg-blue-600 hover:bg-blue-700">
                          <Edit2 size={16} />
                        </Button>

                        <Button size="icon" onClick={() => deleteReminder(r.id)} className="bg-red-600 hover:bg-red-700">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {reminders.length === 0 && (
                <p className="text-center text-white/50 py-8">
                  Nenhum lembrete ainda. Crie um novo para começar!
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}