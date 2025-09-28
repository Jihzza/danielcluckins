// auth/ensureAuthUid.js
export async function ensureAuthUid(supabase) {
    // If a user (real or anonymous) already exists, reuse it
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  
    // Otherwise create an anonymous user
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data.user.id;
  }
  