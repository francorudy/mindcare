"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CounselingDetailsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  useEffect(() => {
    if (id) {
      router.replace(`/admin/case/${id}`);
    } else {
      router.replace("/admin");
    }
  }, [router, id]);

  return null;
}

export default function CounselingDetailsPage() {
  return (
    <Suspense fallback={null}>
      <CounselingDetailsRedirect />
    </Suspense>
  );
}
