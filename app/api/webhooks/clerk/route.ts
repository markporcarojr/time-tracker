// app/api/webhooks/clerk/route.ts
export const runtime = "nodejs";

import { Webhook } from "svix";
import type { WebhookEvent, UserJSON } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

/** Prefer primary email -> verified -> first available */
function getEmail(user: UserJSON): string | null {
  const emails = Array.isArray(user.email_addresses)
    ? user.email_addresses
    : [];
  const primaryId = user.primary_email_address_id ?? null;

  if (primaryId) {
    const primary = emails.find((e) => e.id === primaryId);
    if (primary?.email_address) return primary.email_address;
  }

  const verified = emails.find((e) => e.verification?.status === "verified");
  if (verified?.email_address) return verified.email_address;

  return emails[0]?.email_address ?? null;
}

function getName(user: UserJSON): string | null {
  const first = (user.first_name ?? "").trim();
  const last = (user.last_name ?? "").trim();
  const full = [first, last].filter(Boolean).join(" ");
  return full || user.username || null;
}

export async function POST(req: Request) {
  try {
    console.log(
      "[WH] DB host:",
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0]
    );

    const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!secret) {
      return new Response("Missing CLERK_WEBHOOK_SIGNING_SECRET", {
        status: 500,
      });
    }

    const payload = await req.text();
    const hdrs = await headers(); // Next 15: must await
    const svixId = hdrs.get("svix-id");
    const svixTs = hdrs.get("svix-timestamp");
    const svixSig = hdrs.get("svix-signature");
    if (!svixId || !svixTs || !svixSig) {
      return new Response("Missing svix headers", { status: 400 });
    }

    const wh = new Webhook(secret);
    const event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTs,
      "svix-signature": svixSig,
    }) as WebhookEvent;

    console.log("[WH] event.type:", event.type);

    if (event.type === "user.created") {
      const user = event.data as UserJSON;

      const email = getEmail(user);
      const name = getName(user);

      console.log(
        "[WH] upsert clerkId:",
        user.id,
        "email:",
        email,
        "name:",
        name
      );

      // de-dupe: prefer linking by email if it exists
      const existingByClerk = await prisma.user.findUnique({
        where: { clerkId: user.id },
      });

      if (existingByClerk) {
        await prisma.user.update({
          where: { clerkId: user.id },
          data: { email: email ?? undefined, name: name ?? undefined },
        });
      } else if (email) {
        const existingByEmail = await prisma.user.findUnique({
          where: { email },
        });
        if (existingByEmail) {
          await prisma.user.update({
            where: { email },
            data: { clerkId: user.id, name: name ?? undefined },
          });
        } else {
          await prisma.user.create({
            data: { clerkId: user.id, email, name },
          });
        }
      } else {
        await prisma.user.create({
          data: { clerkId: user.id, email: null, name },
        });
      }

      // 🔥 READ BACK to confirm it exists
      const row = await prisma.user.findUnique({
        where: { clerkId: user.id },
        select: { id: true, clerkId: true, email: true },
      });
      console.log("[WH] read-back row:", row ?? null);
    }

    return new Response("OK", { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[WH] verify or DB error:", msg);
    return new Response("Webhook error", { status: 400 });
  }
}
