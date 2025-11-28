import NetInfo from "@react-native-community/netinfo";
import { queueRequest } from "../utils/offlineQueue";

export async function inscrireTournoiOfflineSafe(
  userId: string,
  tournoiId: string,
  token: string,
  tournamentDetails?: any
) {
  const state = await NetInfo.fetch();

  const url = `http://localhost:3000/api/v1/user/${userId}/tournoi/${tournoiId}`;

  const request = {
    method: "PATCH",
    url,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: null,
    meta: { tournamentDetails },
  };

  if (!state.isConnected) {
    await queueRequest(request);
    return { offlineQueued: true };
  }

  try {
    const res = await fetch(url, request);
    const data = await res.json();

    if (!res.ok) return { ok: false, message: data.message };

    return { ok: true, data };
  } catch (err) {
    await queueRequest(request);
    return { offlineQueued: true };
  }
}
