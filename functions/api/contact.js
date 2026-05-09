/**
 * Cloudflare Pages Function: POST /api/contact
 * 1. 運営への通知メールを tonecco.therapy@gmail.com に送信
 * 2. お客様への自動返信メールを送信
 * 環境変数 BREVO_API_KEY を Cloudflare Pages の設定で登録すること
 */
export async function onRequestPost(context) {
  const { request, env } = context;

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

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  const sender = { name: 'とねっこ 藤本', email: 'info@tonecco.net' };

  const notifySubject = subject?.trim()
    ? `【お問い合わせ】${subject.trim()} - ${name.trim()}様より`
    : `【お問い合わせ】${name.trim()}様より`;

  const notifyHtml = `
    <div style="font-family:sans-serif; max-width:600px; margin:0 auto; color:#333;">
      <h2 style="color:#5a3e2b; border-bottom:2px solid #c9a87c; padding-bottom:8px;">
        とねっこ　ウェブサイトからのお問い合わせ
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
      <p style="margin-top:20px; color:#5a3e2b; font-weight:bold;">返信の対応をしてください</p>
    </div>
  `;

  const autoReplyHtml = `
    <div style="font-family:sans-serif; max-width:600px; margin:0 auto; color:#333; line-height:1.8;">
      <h2 style="color:#5a3e2b; border-bottom:2px solid #c9a87c; padding-bottom:8px;">
        お問い合わせありがとうございます
      </h2>
      <p>${escapeHtml(name.trim())} 様</p>
      <p>
        このたびは、とねっこへお問い合わせいただき、誠にありがとうございます。<br>
        内容を確認のうえ、後ほどご連絡させていただきます。<br>
        今しばらくお待ちください。
      </p>
      <hr style="border:none; border-top:1px solid #e5ded6; margin:24px 0;">
      <p style="color:#888; font-size:13px;">
        ※ このメールは自動送信されています。このメールへの返信はできません。<br>
        ご不明な点は <a href="mailto:info@tonecco.net" style="color:#5a3e2b;">info@tonecco.net</a> までご連絡ください。
      </p>
      <p style="color:#5a3e2b; font-size:13px; margin-top:24px;">
        tonecco therapy<br>
        とねっこ 藤本
      </p>
    </div>
  `;

  try {
    // 1. 運営への通知メール
    const notifyRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender,
        to: [{ email: 'tonecco.therapy@gmail.com', name: 'tonecco therapy' }],
        replyTo: { email: email.trim(), name: name.trim() },
        subject: notifySubject,
        htmlContent: notifyHtml,
      }),
    });

    if (!notifyRes.ok) {
      const errText = await notifyRes.text();
      console.error('Brevo notify error:', errText);
      return jsonResponse({ error: 'Failed to send email' }, 502);
    }

    // 2. お客様への自動返信メール
    const replyRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender,
        to: [{ email: email.trim(), name: name.trim() }],
        subject: 'お問い合わせありがとうございます【tonecco therapy】',
        htmlContent: autoReplyHtml,
      }),
    });

    if (!replyRes.ok) {
      // 自動返信の失敗はログのみ（運営への通知は成功しているため）
      const errText = await replyRes.text();
      console.error('Brevo auto-reply error:', errText);
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
