import { describe, expect, it } from "vitest";
import {
  dayLabel,
  formatTime,
  groupByDay,
  recurrenceLabel,
  utcToWallTime,
  wallTimeToUtc,
  notifyLabel,
} from "./datetime.js";
import { friendlyError } from "./errors.js";

describe("conversão de fuso", () => {
  it("interpreta o horário digitado no fuso de São Paulo", () => {
    expect(wallTimeToUtc("2026-11-01T19:00", "America/Sao_Paulo").toISOString()).toBe("2026-11-01T22:00:00.000Z");
  });

  it("faz o caminho de volta sem deslocar horas (bug antigo de 3h)", () => {
    const utc = wallTimeToUtc("2026-11-01T19:00", "America/Sao_Paulo");
    expect(utcToWallTime(utc, "America/Sao_Paulo")).toBe("2026-11-01T19:00");
    expect(utcToWallTime(utc.toISOString(), "America/Sao_Paulo")).toBe("2026-11-01T19:00");
  });

  it("respeita outros fusos", () => {
    expect(wallTimeToUtc("2026-11-01T19:00", "Asia/Tokyo").toISOString()).toBe("2026-11-01T10:00:00.000Z");
    expect(wallTimeToUtc("2026-11-01T19:00", "America/Manaus").toISOString()).toBe("2026-11-01T23:00:00.000Z");
  });

  it("lida com horário de verão (Nova York)", () => {
    expect(wallTimeToUtc("2026-07-01T09:00", "America/New_York").toISOString()).toBe("2026-07-01T13:00:00.000Z");
    expect(wallTimeToUtc("2026-12-01T09:00", "America/New_York").toISOString()).toBe("2026-12-01T14:00:00.000Z");
  });

  it("rejeita valor inválido", () => {
    expect(wallTimeToUtc("", "America/Sao_Paulo")).toBeNull();
    expect(utcToWallTime("abc", "America/Sao_Paulo")).toBe("");
  });

  it("formata a hora no fuso pedido", () => {
    expect(formatTime("2026-11-01T22:00:00Z", "America/Sao_Paulo")).toBe("19:00");
  });
});

describe("rótulos de dia", () => {
  const now = new Date("2026-11-01T15:00:00Z"); // domingo, 12:00 em SP

  it("usa Hoje, Amanhã e Ontem", () => {
    expect(dayLabel("2026-11-01T22:00:00Z", "America/Sao_Paulo", now)).toBe("Hoje");
    expect(dayLabel("2026-11-02T12:00:00Z", "America/Sao_Paulo", now)).toBe("Amanhã");
    expect(dayLabel("2026-10-31T12:00:00Z", "America/Sao_Paulo", now)).toBe("Ontem");
  });

  it("considera o fuso na virada do dia", () => {
    // 02:30 UTC do dia 2 ainda é 23:30 do dia 1 em São Paulo
    expect(dayLabel("2026-11-02T02:30:00Z", "America/Sao_Paulo", now)).toBe("Hoje");
  });

  it("agrupa itens por dia", () => {
    const items = [
      { id: 1, at: "2026-11-01T18:00:00Z" },
      { id: 2, at: "2026-11-01T23:00:00Z" },
      { id: 3, at: "2026-11-05T12:00:00Z" },
    ];
    const groups = groupByDay(items, (i) => i.at, "America/Sao_Paulo", now);
    expect(groups.map((g) => [g.label, g.items.length])).toEqual([
      ["Hoje", 2],
      ["Quinta-feira, 5 de novembro", 1],
    ]);
  });
});

describe("rótulos de recorrência e antecedência", () => {
  it("descreve dias da semana", () => {
    expect(recurrenceLabel("custom_weekly", [3, 1])).toBe("Seg, Qua");
    expect(recurrenceLabel("custom_weekly", [1, 2, 3, 4, 5])).toBe("Dias úteis");
    expect(recurrenceLabel("custom_weekly", [6, 0])).toBe("Fins de semana");
    expect(recurrenceLabel("monthly", null)).toBe("Todo mês");
    expect(recurrenceLabel("none", null)).toBeNull();
  });

  it("descreve antecedência", () => {
    expect(notifyLabel(0)).toBeNull();
    expect(notifyLabel(30)).toBe("30 minutos antes");
  });
});

describe("mensagens de erro", () => {
  it("traduz erros comuns do Supabase", () => {
    expect(friendlyError({ message: "Invalid login credentials" })).toBe("E-mail ou senha incorretos.");
    expect(friendlyError(new TypeError("Failed to fetch"))).toMatch(/Sem conexão/);
  });

  it("repassa mensagens das regras do banco", () => {
    expect(friendlyError({ code: "P0001", message: "O horário do aviso já passou. Escolha uma data futura." })).toBe(
      "O horário do aviso já passou. Escolha uma data futura.",
    );
  });

  it("usa o texto padrão quando não reconhece", () => {
    expect(friendlyError({ message: "boom" }, "Falhou")).toBe("Falhou");
  });
});
