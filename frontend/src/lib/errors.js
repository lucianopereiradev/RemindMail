// Converte erros do Supabase em mensagens claras em português.

const MESSAGES = [
  [/invalid login credentials/i, "E-mail ou senha incorretos."],
  [/email not confirmed/i, "Confirme seu e-mail antes de entrar. Procure a mensagem do RemindMail na sua caixa de entrada."],
  [/user already registered|already been registered/i, "Este e-mail já tem uma conta. Entre ou recupere a senha."],
  [/password should be at least|password is too short/i, "A senha precisa ter pelo menos 8 caracteres."],
  [/weak password|pwned|known to be weak/i, "Essa senha é fraca ou já apareceu em vazamentos. Escolha outra."],
  [/should be different from the old/i, "A nova senha precisa ser diferente da atual."],
  [/rate limit|too many requests|for security purposes/i, "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo."],
  [/jwt expired|invalid jwt|session.*missing|refresh token/i, "Sua sessão expirou. Entre de novo."],
  [/failed to fetch|networkerror|network request failed|load failed/i, "Sem conexão com o servidor. Verifique sua internet e tente de novo."],
  [/unable to validate email|invalid email|email address .* is invalid/i, "Digite um e-mail válido."],
  [/signups not allowed|signup is disabled/i, "Novos cadastros estão desativados no momento."],
];

export function friendlyError(error, fallback = "Não foi possível concluir. Tente de novo.") {
  if (!error) return fallback;
  const message = typeof error === "string" ? error : error.message ?? "";
  for (const [pattern, text] of MESSAGES) {
    if (pattern.test(message)) return text;
  }
  // Mensagens das regras do banco (raise exception ... errcode P0001) já vêm em português
  if (error.code === "P0001" && message) return message;
  return fallback;
}
