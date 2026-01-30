import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

const TOURNAMENTS_CACHE_KEY = "cached_all_tournaments";
const LAST_SYNC_KEY = "last_tournament_sync";

export interface Tournament {
  _id: string;
  sport: string | null;
  date: string;
  heure: string;
  lieu: string;
  materiel: string;
  nbrParticipant: number;
  users_id: string[];
  createdAt?: string;
}

/**
 * Récupère tous les tournois avec synchronisation incrémentale
 */
export async function fetchTournamentsIncremental(
  token: string
): Promise<Tournament[]> {
  const state = await NetInfo.fetch();

  // 1. Charger le cache local d'abord
  const cachedTournaments = await getCachedTournaments();
  const lastSync = await getLastSyncTimestamp();

  // 2. Si hors ligne, retourner le cache
  if (!state.isConnected) {
    return cachedTournaments;
  }

  try {
    // 3. Si en ligne, récupérer seulement les nouveaux tournois
    const url = lastSync
      ? `http://localhost:3000/api/v1/tournoi?since=${lastSync}`
      : "http://localhost:3000/api/v1/tournoi";

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Erreur réseau");

    const newTournaments: Tournament[] = await res.json();

    // 4. Fusionner avec le cache (éviter les doublons)
    const merged = mergeTournaments(cachedTournaments, newTournaments);

    // 5. Sauvegarder en cache
    await saveTournamentsToCache(merged);
    await updateLastSyncTimestamp();

    return merged;
  } catch (error) {
    console.error("Erreur lors de la sync des tournois:", error);
    // En cas d'erreur, retourner le cache
    return cachedTournaments;
  }
}

/**
 * Fusionne deux listes de tournois en évitant les doublons
 */
function mergeTournaments(
  cached: Tournament[],
  newOnes: Tournament[]
): Tournament[] {
  const map = new Map<string, Tournament>();

  // Ajouter les tournois du cache
  cached.forEach((t) => map.set(t._id, t));

  // Ajouter/remplacer avec les nouveaux
  newOnes.forEach((t) => map.set(t._id, t));

  return Array.from(map.values());
}

async function getCachedTournaments(): Promise<Tournament[]> {
  try {
    const json = await AsyncStorage.getItem(TOURNAMENTS_CACHE_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

async function saveTournamentsToCache(tournaments: Tournament[]) {
  await AsyncStorage.setItem(TOURNAMENTS_CACHE_KEY, JSON.stringify(tournaments));
}

async function getLastSyncTimestamp(): Promise<string | null> {
  return await AsyncStorage.getItem(LAST_SYNC_KEY);
}

async function updateLastSyncTimestamp() {
  await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
}
