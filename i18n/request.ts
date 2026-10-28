import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  // European Portuguese: drives <html lang>, Intl formatting and plural
  // rules (pt-PT: 0 is "other" — "0 instrutores", not "0 instrutor").
  const locale = "pt-PT";

  return {
    locale,
    timeZone: "Europe/Lisbon",
    messages: (await import("../messages/pt.json")).default,
  };
});
