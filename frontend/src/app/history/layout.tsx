import { RequireStudentAuth } from "../../components/auth-guards";

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireStudentAuth>{children}</RequireStudentAuth>;
}
