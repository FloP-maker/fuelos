import { redirect } from "next/navigation";

export default function LearnPage() {
  redirect("/profil?tab=insights");
}
