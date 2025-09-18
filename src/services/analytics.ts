import { auth } from "@/firebase";

function alreadyTrackedToday(page: string) {
  const key = `qs_track_${page}_${new Date().toISOString().slice(0,10)}`;
  if (sessionStorage.getItem(key)) return true;
  sessionStorage.setItem(key, "1");
  return false;
}

// úsalo al montar la página
export async function trackVisit(page: string) {
  if (alreadyTrackedToday(page)) return;

  const user = auth.currentUser;
  const idToken = user ? await user.getIdToken().catch(() => null) : null;

  try {
    await fetch("/api/trackVisit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({ page }),
    });
  } catch {}
}
