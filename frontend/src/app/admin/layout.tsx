import { RequireCounselorAuth } from "../../components/auth-guards";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireCounselorAuth>{children}</RequireCounselorAuth>;
}
