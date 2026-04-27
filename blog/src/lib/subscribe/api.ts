async function api(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, { credentials: "include", ...options });
}

export async function subscribe(
  apiBase: string,
  email: string
): Promise<{ message: string; alreadySubscribed?: boolean }> {
  const res = await api(apiBase + "/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to subscribe");
  return data;
}

export interface NotificationRecord {
  sent_at: string;
  count: number;
}

export async function fetchNotificationStatus(
  apiBase: string,
  slug: string
): Promise<{ history: NotificationRecord[] }> {
  const res = await api(
    apiBase + "/subscribe/status?slug=" + encodeURIComponent(slug)
  );
  if (!res.ok) throw new Error("Failed to fetch status");
  return res.json();
}

export async function sendNotification(
  apiBase: string,
  slug: string
): Promise<{ sent: number }> {
  const res = await api(apiBase + "/subscribe/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send notifications");
  return data;
}

export async function unsubscribeByToken(
  apiBase: string,
  token: string
): Promise<{ message: string }> {
  const res = await api(
    apiBase + "/subscribe/unsubscribe?token=" + encodeURIComponent(token)
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to unsubscribe");
  return data;
}
