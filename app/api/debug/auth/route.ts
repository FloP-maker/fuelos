import { NextResponse } from "next/server";
import { getAuthEnvDiagnostics } from "@/lib/authEnvDiagnostics";

/** JSON pour scripts / outils. Même contenu que la page /debug/auth (aucune valeur secrète). */
export async function GET() {
  return NextResponse.json(getAuthEnvDiagnostics());
}
