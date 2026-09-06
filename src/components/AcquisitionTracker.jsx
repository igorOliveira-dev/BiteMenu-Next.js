"use client";

import { useEffect } from "react";
import { captureAcquisitionSource } from "@/utils/acquisitionSource";

export default function AcquisitionTracker() {
  useEffect(() => {
    captureAcquisitionSource();
  }, []);

  return null;
}
