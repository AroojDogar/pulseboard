"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { buildDataset, type Dataset } from "@/lib/data";

const DataContext = createContext<Dataset | null>(null);

/** Builds the demo dataset in the browser (about 20 ms), so it always ends on the visitor's today */
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [ds, setDs] = useState<Dataset | null>(null);
  useEffect(() => setDs(buildDataset()), []);
  return <DataContext.Provider value={ds}>{children}</DataContext.Provider>;
}

export const useDataset = () => useContext(DataContext);
