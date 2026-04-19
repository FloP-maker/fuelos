import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/passwordCredentials";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const emailRaw = (body as { email?: unknown }).email;
  const passwordRaw = (body as { password?: unknown }).password;
  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const password = typeof passwordRaw === "string" ? passwordRaw : "";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
  }
  if (password.length > 128) {
    return NextResponse.json({ error: "Mot de passe trop long." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { accounts: { select: { provider: true } } },
  });

  if (existing) {
    if (existing.passwordHash) {
      return NextResponse.json({ error: "Un compte existe déjà avec cette adresse e-mail." }, { status: 409 });
    }
    const providers = new Set(existing.accounts.map((a) => a.provider));
    const oauth = ["google", "apple"].some((p) => providers.has(p));
    if (oauth) {
      return NextResponse.json(
        {
          error:
            "Cette adresse est déjà liée à Google ou Apple. Utilisez le même bouton pour vous connecter.",
        },
        { status: 409 }
      );
    }
    if (providers.size > 0) {
      return NextResponse.json(
        {
          error:
            "Cette adresse est déjà enregistrée (lien magique ou autre). Connectez-vous avec la même méthode ou utilisez une autre adresse.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Compte déjà présent." }, { status: 409 });
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash: hashPassword(password),
      emailVerified: new Date(),
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
