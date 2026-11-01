// Datas e fusos horários.
// O banco guarda tudo em UTC (timestamptz). A tela trabalha no fuso escolhido pelo usuário,
// e não no fuso do navegador nem do servidor: isso corrige o erro de 3h da versão antiga.

export const DEFAULT_TZ = "America/Sao_Paulo";

function partsOf(date, tz) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const out = {};
  for (const p of dtf.formatToParts(date)) out[p.type] = p.value;
  return out;
}

// Diferença em minutos entre o fuso `tz` e UTC no instante `date`
export function getOffsetMinutes(date, tz) {
  const p = partsOf(date, tz);
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  const truncated = Math.floor(date.getTime() / 1000) * 1000;
  return (asUtc - truncated) / 60000;
}

// "2026-11-01T19:00" no fuso `tz` -> Date (instante UTC)
export function wallTimeToUtc(value, tz = DEFAULT_TZ) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value ?? "");
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const first = getOffsetMinutes(new Date(guess), tz);
  let result = guess - first * 60000;
  const second = getOffsetMinutes(new Date(result), tz);
  if (second !== first) result = guess - second * 60000;
  return new Date(result);
}

// Date/ISO -> "2026-11-01T19:00" no fuso `tz` (formato do <input type="datetime-local">)
export function utcToWallTime(value, tz = DEFAULT_TZ) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const p = partsOf(date, tz);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export function dayKey(value, tz = DEFAULT_TZ) {
  return utcToWallTime(value, tz).slice(0, 10);
}

function addDaysToKey(key, days) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function dayLabel(value, tz = DEFAULT_TZ, now = new Date()) {
  const key = dayKey(value, tz);
  const today = dayKey(now, tz);
  if (key === today) return "Hoje";
  if (key === addDaysToKey(today, 1)) return "Amanhã";
  if (key === addDaysToKey(today, -1)) return "Ontem";
  const date = value instanceof Date ? value : new Date(value);
  const sameYear = key.slice(0, 4) === today.slice(0, 4);
  const label = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: tz,
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatTime(value, tz = DEFAULT_TZ) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(
    new Date(value),
  );
}

export function formatDateTime(value, tz = DEFAULT_TZ) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  }).format(new Date(value));
}

// Agrupa por dia (no fuso do usuário), mantendo a ordem recebida
export function groupByDay(items, getDate, tz = DEFAULT_TZ, now = new Date()) {
  const groups = [];
  const index = new Map();
  for (const item of items) {
    const value = getDate(item);
    const key = dayKey(value, tz);
    if (!index.has(key)) {
      const group = { key, label: dayLabel(value, tz, now), items: [] };
      index.set(key, group);
      groups.push(group);
    }
    index.get(key).items.push(item);
  }
  return groups;
}

export const NOTIFY_OPTIONS = [
  { value: 0, label: "Na hora" },
  { value: 5, label: "5 minutos antes" },
  { value: 10, label: "10 minutos antes" },
  { value: 15, label: "15 minutos antes" },
  { value: 30, label: "30 minutos antes" },
  { value: 60, label: "1 hora antes" },
  { value: 120, label: "2 horas antes" },
  { value: 1440, label: "1 dia antes" },
];

export const RECURRENCE_OPTIONS = [
  { value: "none", label: "Não repetir" },
  { value: "daily", label: "Todos os dias" },
  { value: "custom_weekly", label: "Em dias da semana" },
  { value: "weekly", label: "Toda semana" },
  { value: "monthly", label: "Todo mês" },
  { value: "yearly", label: "Todo ano" },
];

export const WEEKDAYS = [
  { value: 0, short: "Dom", long: "domingo" },
  { value: 1, short: "Seg", long: "segunda" },
  { value: 2, short: "Ter", long: "terça" },
  { value: 3, short: "Qua", long: "quarta" },
  { value: 4, short: "Qui", long: "quinta" },
  { value: 5, short: "Sex", long: "sexta" },
  { value: 6, short: "Sáb", long: "sábado" },
];

export function recurrenceLabel(recurrence, days) {
  if (!recurrence || recurrence === "none") return null;
  if (recurrence === "custom_weekly") {
    const list = [...(days ?? [])].sort((a, b) => a - b);
    if (list.length === 7) return "Todos os dias";
    if (list.join() === "1,2,3,4,5") return "Dias úteis";
    if (list.join() === "0,6") return "Fins de semana";
    return list.map((d) => WEEKDAYS[d]?.short).filter(Boolean).join(", ");
  }
  return RECURRENCE_OPTIONS.find((o) => o.value === recurrence)?.label ?? null;
}

export function notifyLabel(minutes) {
  if (!minutes) return null;
  return NOTIFY_OPTIONS.find((o) => o.value === minutes)?.label ?? `${minutes} minutos antes`;
}

export function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TZ;
  } catch {
    return DEFAULT_TZ;
  }
}

export function listTimezones() {
  try {
    if (typeof Intl.supportedValuesOf === "function") return Intl.supportedValuesOf("timeZone");
  } catch {
    // navegador antigo: cai na lista curta abaixo
  }
  return [
    "America/Sao_Paulo",
    "America/Manaus",
    "America/Cuiaba",
    "America/Belem",
    "America/Fortaleza",
    "America/Recife",
    "America/Noronha",
    "America/Rio_Branco",
    "Europe/Lisbon",
    "UTC",
  ];
}
