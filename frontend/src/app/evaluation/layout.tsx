import { RequireStudentAuth } from "../../components/auth-guards";

export default function EvaluationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireStudentAuth>{children}</RequireStudentAuth>;
}
