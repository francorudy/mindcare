"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthSession } from "../contexts/auth-session";
import { AuthRequiredModal } from "./auth-required-modal";
import { startNewEvaluation } from "../lib/evaluation-session";

type EvaluationStartButtonProps = {
  href?: string;
  className?: string;
  children: React.ReactNode;
  leadingIcon?: React.ReactNode;
};

export function EvaluationStartButton({
  href = "/evaluation",
  className,
  children,
  leadingIcon,
}: EvaluationStartButtonProps) {
  const router = useRouter();
  const { session, isHydrated } = useAuthSession();
  const [showModal, setShowModal] = useState(false);

  function handleClick(e: React.MouseEvent) {
    if (!isHydrated) {
      e.preventDefault();
      return;
    }
    if (!session || session.role !== "student") {
      e.preventDefault();
      setShowModal(true);
      return;
    }

    startNewEvaluation();
  }

  return (
    <>
      <Link href={href} onClick={handleClick} className={className}>
        {leadingIcon ? (
          <span className="grid h-5 w-5 place-items-center">{leadingIcon}</span>
        ) : null}
        {children}
      </Link>
      <AuthRequiredModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          router.push("/");
        }}
      />
    </>
  );
}
