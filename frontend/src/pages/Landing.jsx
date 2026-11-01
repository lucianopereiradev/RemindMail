import { Link } from "react-router";
import { BellRing, CalendarRange, Globe2, History, PauseCircle, Repeat } from "lucide-react";
import { InboxPreview } from "../components/InboxPreview.jsx";
import { useTitle } from "../components/layouts.jsx";
import { buttonClass } from "../lib/buttonClass.js";
import { useAuth } from "../auth/context.js";

const FEATURES = [
  {
    icon: BellRing,
    title: "Aviso com antecedência",
    text: "Receba na hora do compromisso ou com até um dia de antecedência.",
  },
  {
    icon: Repeat,
    title: "Repetição sem esforço",
    text: "Todos os dias, toda semana, todo mês, todo ano ou só nos dias que você escolher.",
  },
  {
    icon: Globe2,
    title: "No seu fuso horário",
    text: "Mudou de cidade ou de país? Ajuste o fuso e os horários continuam certos.",
  },
  {
    icon: History,
    title: "Histórico de envios",
    text: "Veja o que já foi enviado e quando, separado do que ainda vai chegar.",
  },
  {
    icon: CalendarRange,
    title: "Agenda por dia",
    text: "Seus lembretes organizados em Hoje, Amanhã e nos próximos dias.",
  },
  {
    icon: PauseCircle,
    title: "Pausa quando quiser",
    text: "Vai tirar férias? Pause os e-mails com um clique, sem apagar nada.",
  },
];

const STEPS = [
  { title: "Crie sua conta", text: "Só nome, e-mail e senha. Leva menos de um minuto." },
  { title: "Escreva o lembrete", text: "Diga o que é, quando é e se deve repetir." },
  { title: "Receba o e-mail", text: "Na hora marcada, a mensagem chega na sua caixa de entrada." },
];

export default function Landing() {
  useTitle(null);
  const { user } = useAuth();

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-20">
        <div>
          <h1 className="text-[2.6rem] font-extrabold leading-[1.05] sm:text-6xl">
            O e-mail certo, na hora em que você precisa lembrar.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Anote o compromisso uma vez. O RemindMail manda um e-mail no horário que você escolher, e repete
            quantas vezes for preciso.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {user ? (
              <Link to="/painel" className={buttonClass("primary", "lg")}>
                Abrir meus lembretes
              </Link>
            ) : (
              <>
                <Link to="/cadastro" className={buttonClass("primary", "lg")}>
                  Criar conta grátis
                </Link>
                <Link to="/entrar" className={buttonClass("secondary", "lg")}>
                  Já tenho conta
                </Link>
              </>
            )}
          </div>
          <p className="mt-4 text-sm text-ink-faint">Gratuito, sem cartão e sem aplicativo para instalar.</p>
        </div>
        <InboxPreview />
      </section>

      <section className="border-y border-line bg-card">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <h2 className="text-3xl font-bold sm:text-4xl">Como funciona</h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative pl-14">
                <span className="absolute left-0 top-0 grid size-10 place-items-center rounded-full bg-ink font-display text-lg font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="text-lg font-bold">{step.title}</h3>
                <p className="mt-1 leading-relaxed text-ink-soft">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <h2 className="max-w-2xl text-3xl font-bold sm:text-4xl">Feito para a rotina de verdade</h2>
        <ul className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <Icon className="mt-0.5 size-6 shrink-0 text-brand" aria-hidden="true" />
              <div>
                <h3 className="font-sans text-base font-bold tracking-normal">{title}</h3>
                <p className="mt-1 leading-relaxed text-ink-soft">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {!user && (
        <section className="px-5 pb-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl bg-ink px-7 py-10 text-white sm:flex-row sm:items-center sm:px-10">
            <div>
              <h2 className="text-3xl font-bold">Comece pelo próximo compromisso.</h2>
              <p className="mt-2 text-white/70">Crie a conta e agende o primeiro lembrete agora.</p>
            </div>
            <Link to="/cadastro" className={buttonClass("secondary", "lg", "shrink-0 border-transparent")}>
              Criar conta grátis
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
