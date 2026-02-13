import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { HelpButton } from "@/components/help-button";
import { getSessionUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="md:flex">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6">{children}</main>
      <HelpButton />
    </div>
  );
}
