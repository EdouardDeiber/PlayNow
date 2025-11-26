import { Stack } from "expo-router";
import { startOfflineSyncWorker } from "./utils/offlineQueue";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    startOfflineSyncWorker(); // démarre la sync offline une seule fois
  }, []);

  return <Stack />;
}
