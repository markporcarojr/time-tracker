// app/api/webhooks/clerk/route.ts
export const runtime = "nodejs";

import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    console.log(
      "[WH] DB host:",
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0]
    );

    const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!secret)
      return new Response("Missing CLERK_WEBHOOK_SIGNING_SECRET", {
        status: 500,
      });

    const payload = await req.text();
    const hdrs = await headers(); // Next 15: must await
    const svixId = hdrs.get("svix-id");
    const svixTs = hdrs.get("svix-timestamp");
    const svixSig = hdrs.get("svix-signature");
    if (!svixId || !svixTs || !svixSig)
      return new Response("Missing svix headers", { status: 400 });

    const wh = new Webhook(secret);
    const event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTs,
      "svix-signature": svixSig,
    }) as WebhookEvent;

    console.log("[WH] event.type:", event.type);

    if (event.type === "user.created") {
      const d = event.data as Record<string, unknown>;
      const email =
        d?.primary_email_address?.email_address ??
        d?.email_addresses?.[0]?.email_address ??
        null;
      const name =
        [d?.first_name, d?.last_name].filter(Boolean).join(" ") ||
        d?.username ||
        null;

      console.log("[WH] upsert clerkId:", d.id, "email:", email, "name:", name);

      // de-dupe: prefer linking by email if it exists
      const existingByClerk = await prisma.user.findUnique({
        where: { clerkId: d.id },
      });
      if (existingByClerk) {
        await prisma.user.update({
          where: { clerkId: d.id },
          data: { email: email ?? undefined, name: name ?? undefined },
        });
      } else if (email) {
        const existingByEmail = await prisma.user.findUnique({
          where: { email },
        });
        if (existingByEmail) {
          await prisma.user.update({
            where: { email },
            data: { clerkId: d.id, name: name ?? undefined },
          });
        } else {
          await prisma.user.create({ data: { clerkId: d.id, email, name } });
        }
      } else {
        await prisma.user.create({
          data: { clerkId: d.id, email: null, name },
        });
      }

      // 🔥 READ BACK to confirm it exists
      const row = await prisma.user.findUnique({ where: { clerkId: d.id } });
      console.log(
        "[WH] read-back row:",
        row ? { id: row.id, clerkId: row.clerkId, email: row.email } : null
      );
    }

    return new Response("OK", { status: 200 });
  } catch (err: unknown) {
    console.error("[WH] verify or DB error:", err instanceof Error ? err.message : err);
    return new Response("Webhook error", { status: 400 });
  }
}
