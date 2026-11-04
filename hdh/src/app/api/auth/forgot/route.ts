import { NextResponse } from "next/server";
import { handle, readJson } from "@/lib/http";
import { createPasswordReset } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { baseUrl } from "@/lib/config";
import { hitCreateBurst, clientIp } from "@/lib/ratelimit";

/** Always answers the same way so the endpoint can't be used to probe which emails exist. */
export const POST = handle(async (req: Request) => {
  hitCreateBurst(clientIp(req.headers));
  const b = await readJson(req);
  const r = createPasswordReset(b.email);
  if (r) {
    await sendMail({
      to: r.user.email,
      subject: "Reset your hdh password",
      text: `Open this link within one hour to choose a new password:\n${baseUrl()}/reset-password?token=${r.token}\n\nIf you didn't ask for this, ignore this email.`,
    });
  }
  return NextResponse.json({ success: true });
});
