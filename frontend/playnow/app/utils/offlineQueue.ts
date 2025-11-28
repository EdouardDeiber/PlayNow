import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Alert } from "react-native";

export interface QueuedRequest {
  method: string;
  url: string;
  headers?: any;
  body?: any;
  meta?: any;
}

export function getPendingTournaments(): Promise<any[]> {
  return getQueue().then((queue) => {
    return queue
      .filter((req) => req.meta && req.meta.tournamentDetails)
      .map((req) => ({
        ...req.meta.tournamentDetails,
        _pending: true, // Marqueur pour l'UI
      }));
  });
}

const STORAGE_KEY = "offlineQueue";

// Utilitaire d’alerte compatible Web & Mobile
export function showAlert(title: string, message: string) {
  if (typeof window !== "undefined" && window.alert) {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

//  Ajout sécurisé
async function getQueue(): Promise<QueuedRequest[]> {
  const json = (await AsyncStorage.getItem(STORAGE_KEY)) || "[]";

  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueuedRequest[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export async function queueRequest(req: QueuedRequest) {
  const queue = await getQueue();
  queue.push(req);
  await saveQueue(queue);
}

// Synchronisation automatique
export async function processOfflineQueue() {
  const state = await NetInfo.fetch();

  if (!state.isConnected) return;

  const queue = await getQueue();
  if (queue.length === 0) return;

  const remaining: QueuedRequest[] = [];
  let successCount = 0;

  for (let req of queue) {
    try {
      const res = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body ? JSON.stringify(req.body) : undefined,
      });

      if (!res.ok) {
        remaining.push(req);
      } else {
        successCount++; // ✓ Synchronisation réussie
      }
    } catch (err) {
      remaining.push(req);
    }
  }

  await saveQueue(remaining);

  //  Si une ou plusieurs requêtes ont été synchronisées
  if (successCount > 0) {
    showAlert(
      "Synchronisation réussie",
      successCount === 1
        ? "Votre inscription hors-ligne a été synchronisée."
        : `${successCount} inscriptions hors-ligne ont été synchronisées.`
    );
  }
}

// Worker → vérifie toutes les 5 secondes
export function startOfflineSyncWorker() {
  setInterval(() => {
    processOfflineQueue();
  }, 5000);
}
