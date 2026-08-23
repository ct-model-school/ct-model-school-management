import { redirect } from "next/navigation";

export default function MemberForgotPage() {
  redirect("/members/recovery");
}
