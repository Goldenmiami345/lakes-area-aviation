import type { APIRoute } from 'astro';

export const prerender = false;

// POST /api/lead — training-plan request. Emails the school via Resend when RESEND_API_KEY is set
// in the Vercel project's environment; never stores or logs personal data otherwise.
//   RESEND_API_KEY  (required to send)
//   LEAD_TO         default golden@golden.miami
//   LEAD_FROM       default "Lakes Area Aviation <onboarding@resend.dev>" (use a verified domain in production)

const env = (k: string) => (typeof process !== 'undefined' ? process.env[k] : undefined) ?? (import.meta.env as Record<string, string | undefined>)[k];
// Single-line fields lose every control character; multi-line fields keep line breaks.
const clean = (v: FormDataEntryValue | null, max = 500, multiline = false) => (typeof v === 'string' ? v.replace(multiline ? /[\u0000-\u0009\u000b-\u001f\u007f]/g : /[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '');
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const POST: APIRoute = async ({ request }) => {
  // Script-enhanced submissions ask for JSON; a plain form post (no JavaScript) gets a redirect back.
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  const reply = (body: { ok: boolean; error?: string }, status = 200) => {
    if (wantsJson) return json(body, status);
    const q = body.ok ? 'sent=1' : `error=${encodeURIComponent(body.error ?? 'Something went wrong.')}`;
    return new Response(null, { status: 303, headers: { location: `/contact?${q}#request` } });
  };
  let form: FormData;
  try { form = await request.formData(); } catch { return reply({ ok: false, error: 'Invalid form.' }, 400); }
  // Honeypot: real visitors never fill this hidden field.
  if (clean(form.get('company'))) return reply({ ok: true });

  const lead = {
    firstName: clean(form.get('firstName'), 80),
    lastName: clean(form.get('lastName'), 80),
    email: clean(form.get('email'), 160),
    phone: clean(form.get('phone'), 40),
    goal: clean(form.get('goal'), 80),
    experience: clean(form.get('experience'), 80),
    location: clean(form.get('location'), 40),
    start: clean(form.get('start'), 40),
    message: clean(form.get('message'), 3000, true),
    plan: clean(form.get('plan'), 2000, true),
  };
  if (!lead.firstName || !lead.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) {
    return reply({ ok: false, error: 'Please add your first name and a valid email.' }, 422);
  }

  const key = env('RESEND_API_KEY');
  if (!key) return reply({ ok: false, error: 'The form is not connected yet. Please call 318-347-9004.' }, 503);

  const rows = Object.entries(lead).filter(([, v]) => v).map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${esc(k)}</td><td>${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env('LEAD_FROM') ?? 'Lakes Area Aviation <onboarding@resend.dev>',
      to: [env('LEAD_TO') ?? 'golden@golden.miami'],
      reply_to: lead.email,
      subject: `Training plan request: ${lead.firstName} ${lead.lastName}${lead.goal ? ` (${lead.goal})` : ''}`,
      html: `<h2 style="font-family:sans-serif">New training plan request</h2><table style="font-family:sans-serif;font-size:14px">${rows}</table>`,
    }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!res || !res.ok) return reply({ ok: false, error: 'Your request didn’t send. Please try again or call 318-347-9004.' }, 502);
  return reply({ ok: true });
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}
