/**
 * Cloudflare Pages Function: POST /api/contact
 * フォームデータをBrevo APIで tonecco.therapy@gmail.com に転送する
 * 環境変数 BREVO_API_KEY を Cloudflare Pages の設定で登録すること
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  // APIキーが設定されているか確認
  if (!env.BREVO_API_KEY) {
    return jsonResponse({ error: 'Server configuration error' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  const { name, email, subject, message } = body;

  // 必須フィールドチェック
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  const mailSubject = subject?.trim()
    ? `【お問い合わせ】${subject.trim()} - ${name.trim()}様より`
    : `【お問い合わせ】${name.trim()}様より`;

  const htmlContent = `
    <div style="font-family:sans-serif; max-width:600px; margin:0 auto; color:#333;">
      <h2 style="color:#5a3e2b; border-bottom:2px solid #c9a87c; padding-bottom:8px;">
        ウェブサイトからのお問い合わせ
      </h2>
      <table style="width:100%; border-collapse:collapse; margin-top:16px;">
        <tr>
          <th style="text-align:left; padding:8px 12px; background:#f5f0ea; width:120px;">お名前</th>
          <td style="padding:8px 12px;">${escapeHtml(name.trim())}</td>
        </tr>
        <tr>
          <th style="text-align:left; padding:8px 12px; background:#f5f0ea;">メールアドレス</th>
          <td style="padding:8px 12px;">${escapeHtml(email.trim())}</td>
        </tr>
        ${subject?.trim() ? `
        <tr>
          <th style="text-align:left; padding:8px 12px; background:#f5f0ea;">件名</th>
          <td style="padding:8px 12px;">${escapeHtml(subject.trim())}</td>
        </tr>` : ''}
        <tr>
          <th style="text-align:left; padding:8px 12px; background:#f5f0ea; vertical-align:top;">メッセージ</th>
          <td style="padding:8px 12px; white-space:pre-wrap;">${escapeHtml(message.trim())}</td>
        </tr>
      </table>
    </div>
  `;

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'tonecco therapy ウェブサイト',
          email: 'tonecco.therapy@gmail.com',
        },
        to: [{ email: 'tonecco.therapy@gmail.com', name: 'tonecco therapy' }],
        replyTo: { email: email.trim(), name: name.trim() },
        subject: mailSubject,
        htmlContent,
      }),
    });

    if (!brevoRes.ok) {
      const errText = await brevoRes.text();
      console.error('Brevo API error:', errText);
      return jsonResponse({ error: 'Failed to send email' }, 502);
    }

    return jsonResponse({ success: true }, 200);
  } catch (err) {
    console.error('Unexpected error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
