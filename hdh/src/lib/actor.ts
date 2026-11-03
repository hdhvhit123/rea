import { accountAgeDays, currentUser } from "./auth";
import { clientIp } from "./ratelimit";
import type { Actor } from "./links";

export async function actorFrom(req: Request): Promise<Actor> {
  const user = await currentUser();
  return { userId: user?.id ?? null, ip: clientIp(req.headers), accountAgeDays: accountAgeDays(user) };
}
