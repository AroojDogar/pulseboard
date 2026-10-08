import type { Metadata } from "next";
import { Suspense } from "react";
import { Customers } from "@/components/Customers";

export const metadata: Metadata = { title: "Customers — PulseBoard" };

export default function Page() {
  return (
    <Suspense>
      <Customers />
    </Suspense>
  );
}
