// Cloudflare Worker — cominvent.com contact form → Brevo transactional email.
// Secret: BREVO_API_KEY. Vars: TO_EMAIL, FROM_EMAIL, FROM_NAME, ALLOWED_ORIGINS.
// The site's form posts JSON here; the Brevo key never touches the browser.

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
    const cors = {
      "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : (allowed[0] || "*"),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405, cors);
    if (allowed.length && !allowed.includes(origin)) return json({ ok: false, error: "Forbidden origin" }, 403, cors);

    let data;
    try { data = await request.json(); } catch { return json({ ok: false, error: "Bad request" }, 400, cors); }

    // Honeypot: real users leave the hidden "company" field empty; bots fill it. Silently accept + drop.
    if (data.company) return json({ ok: true }, 200, cors);

    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim();
    const message = String(data.message || "").trim();

    if (!name || !email || !message) return json({ ok: false, error: "Please fill in all fields." }, 422, cors);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: "Please enter a valid email address." }, 422, cors);
    if (name.length > 200 || email.length > 200 || message.length > 5000)
      return json({ ok: false, error: "Message is too long." }, 422, cors);

    const payload = {
      sender: { name: env.FROM_NAME || "Website", email: env.FROM_EMAIL },
      to: [{ email: env.TO_EMAIL }],
      replyTo: { email, name },
      subject: `Contact form — ${name}`,
      textContent: `From: ${name} <${email}>\nSent from: ${origin}\n\n${message}`,
      htmlContent:
        `<p><strong>From:</strong> ${esc(name)} &lt;${esc(email)}&gt;</p>` +
        `<p><strong>Sent from:</strong> ${esc(origin)}</p><hr>` +
        `<p>${esc(message).replace(/\n/g, "<br>")}</p>`,
    };

    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", "accept": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      console.log("Brevo error", r.status, await r.text());
      return json({ ok: false, error: "Sorry — couldn't send right now. Please try again later." }, 502, cors);
    }
    return json({ ok: true }, 200, cors);
  },
};

const json = (obj, status, cors) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", ...cors } });

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
