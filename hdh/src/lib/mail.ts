import fs from "node:fs";
import path from "node:path";

/**
 * Mail adapter. No provider is wired yet, so messages are written to a local
 * outbox folder (demo mode). Replace `sendMail` with a real provider for production.
 */
export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export function outboxDir(): string {
  return process.env.HDH_MAIL_OUTBOX || path.join(process.cwd(), "data", "outbox");
}

export async function sendMail(mail: Mail): Promise<{ delivered: false; outboxFile: string }> {
  const dir = outboxDir();
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${Date.now()}-${mail.to.replace(/[^a-z0-9@.]/gi, "_")}.txt`);
  fs.writeFileSync(file, `To: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}\n`);
  console.info(`[mail:outbox] ${mail.subject} -> ${mail.to} (${file})`);
  return { delivered: false, outboxFile: file };
}
