import { RequireCounselorAuth } from "../../components/auth-guards";

export default function CounselingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireCounselorAuth>{children}</RequireCounselorAuth>;
}
