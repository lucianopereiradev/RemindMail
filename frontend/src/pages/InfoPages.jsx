import { Link } from "react-router";
import { useTitle } from "../lib/useTitle.js";
import { buttonClass } from "../lib/buttonClass.js";
import { CONTACT_EMAIL, GITHUB_URL } from "../lib/supabase.js";

function Prose({ title, updated, children }) {
  return (
    <article className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <h1 className="text-4xl font-bold sm:text-5xl">{title}</h1>
      {updated && <p className="mt-3 text-sm text-ink-faint">Última atualização: {updated}</p>}
      <div className="mt-8 space-y-5 text-[17px] leading-relaxed text-ink-soft [&_a]:font-semibold [&_a]:text-brand [&_a:hover]:underline [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_strong]:text-ink [&_ul]:space-y-2">
        {children}
      </div>
    </article>
  );
}

export function About() {
  useTitle("Sobre");
  return (
    <Prose title="Sobre o RemindMail">
      <p>
        O RemindMail nasceu de um problema simples: a gente anota um compromisso e esquece de olhar a anotação. Em vez de
        mais um aplicativo com notificações que acabam ignoradas, ele usa o lugar que todo mundo já confere: a caixa de
        e-mail.
      </p>
      <p>
        Você escreve o lembrete, escolhe o horário e, se quiser, quantas vezes ele deve repetir. Na hora certa, a mensagem
        chega.
      </p>
      <h2>Quem fez</h2>
      <p>
        O projeto foi criado por <strong>Luciano Pereira</strong>, estudante de desenvolvimento de sistemas, como forma de
        praticar desenvolvimento web de ponta a ponta: interface em React, banco de dados PostgreSQL no Supabase, envio de
        e-mails pela Brevo e hospedagem na Cloudflare.
      </p>
      <p>
        O código é aberto e está no <a href={GITHUB_URL}>GitHub</a>. Sugestões e dúvidas:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </Prose>
  );
}

export function Terms() {
  useTitle("Termos de uso");
  return (
    <Prose title="Termos de uso" updated="1º de novembro de 2026">
      <p>Ao criar uma conta no RemindMail você concorda com estes termos.</p>
      <h2>O serviço</h2>
      <p>
        O RemindMail envia e-mails de lembrete nos horários que você agenda. É um projeto pessoal e gratuito, oferecido
        no estado em que se encontra, sem garantia de disponibilidade contínua.
      </p>
      <h2>Limites</h2>
      <ul>
        <li>Cada conta pode ter até 100 lembretes.</li>
        <li>Os envios dependem de serviços de terceiros e podem atrasar alguns minutos.</li>
        <li>Não use o RemindMail para compromissos críticos de saúde ou segurança sem outro meio de aviso.</li>
      </ul>
      <h2>Uso adequado</h2>
      <p>
        Não é permitido usar o serviço para enviar spam, conteúdo ilegal ou para incomodar outras pessoas. Contas que
        fizerem isso podem ser removidas.
      </p>
      <h2>Encerramento</h2>
      <p>
        Você pode excluir sua conta a qualquer momento na página Conta. O serviço também pode ser encerrado, com aviso
        prévio por e-mail sempre que possível.
      </p>
      <h2>Contato</h2>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </Prose>
  );
}

export function Privacy() {
  useTitle("Privacidade");
  return (
    <Prose title="Política de privacidade" updated="1º de novembro de 2026">
      <p>Esta política explica quais dados o RemindMail guarda e por quê, em linha com a LGPD (Lei 13.709/2018).</p>
      <h2>Dados que guardamos</h2>
      <ul>
        <li>
          <strong>Conta:</strong> nome, e-mail e senha (guardada de forma criptografada; ninguém consegue lê-la).
        </li>
        <li>
          <strong>Lembretes:</strong> título, detalhes, data, frequência e o histórico de envios.
        </li>
        <li>
          <strong>Preferências:</strong> fuso horário e se os e-mails estão ativos.
        </li>
      </ul>
      <h2>Para que usamos</h2>
      <p>Somente para enviar os seus lembretes. Não vendemos, não compartilhamos para publicidade e não enviamos marketing.</p>
      <h2>Quem processa os dados</h2>
      <ul>
        <li>Supabase: banco de dados e autenticação.</li>
        <li>Brevo: envio dos e-mails.</li>
        <li>Cloudflare: hospedagem do site.</li>
        <li>Google: somente se você escolher entrar com sua conta Google.</li>
      </ul>
      <h2>Seus direitos</h2>
      <p>
        Você pode editar seus dados na página Conta e excluir a conta a qualquer momento, o que apaga todos os seus dados.
        Para qualquer pedido, escreva para <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </Prose>
  );
}

export function NotFound() {
  useTitle("Página não encontrada");
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="font-display text-7xl font-extrabold text-brand">404</p>
      <h1 className="mt-4 text-3xl font-bold">Esta página não existe</h1>
      <p className="mt-2 text-ink-soft">O endereço pode ter mudado ou estar digitado errado.</p>
      <Link to="/" className={buttonClass("primary", "md", "mt-8")}>
        Ir para a página inicial
      </Link>
    </div>
  );
}
