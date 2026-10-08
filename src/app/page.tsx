import { Suspense } from "react";
import { Overview } from "@/components/Overview";

export default function Page() {
  return (
    <Suspense>
      <Overview />
    </Suspense>
  );
}
