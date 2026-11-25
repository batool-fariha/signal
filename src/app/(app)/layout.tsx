import { Shell } from "@/components/Shell";

/** Everything inside the app (dashboard, feedback, themes, ...) shares the sidebar shell. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
