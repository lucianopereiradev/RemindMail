import { useEffect } from "react";

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · RemindMail` : "RemindMail · Lembretes por e-mail na hora certa";
  }, [title]);
}
