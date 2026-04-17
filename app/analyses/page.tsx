import { redirect } from "next/navigation";

export default function AnalysesPage() {
  redirect("/profil?tab=insights");
}
