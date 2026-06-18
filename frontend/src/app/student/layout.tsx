import { RequireStudentAuth } from "../../components/auth-guards";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireStudentAuth>{children}</RequireStudentAuth>;
}
