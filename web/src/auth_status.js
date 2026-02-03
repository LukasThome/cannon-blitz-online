export async function checkAuthStatus(idToken, fetcher = fetch) {
  if (!idToken) {
    return { ok: false, reason: 'missing' };
  }
  try {
    const res = await fetcher('/auth/verify', {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) {
      return { ok: false, reason: `status_${res.status}` };
    }
    const data = await res.json();
    return { ok: true, uid: data.uid || '' };
  } catch (err) {
    return { ok: false, reason: 'network' };
  }
}
