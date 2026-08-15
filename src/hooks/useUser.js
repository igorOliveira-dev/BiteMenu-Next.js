"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

let cachedProfile = null;
let cachedUserId = null;
let pendingProfileFetch = null; // { userId, promise } — evita 2 requests simultâneas para o mesmo usuário

function fetchProfile(userId) {
  if (cachedUserId === userId && cachedProfile) {
    return Promise.resolve(cachedProfile);
  }

  if (pendingProfileFetch && pendingProfileFetch.userId === userId) {
    return pendingProfileFetch.promise;
  }

  const promise = supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()
    .then(({ data, error }) => {
      pendingProfileFetch = null;

      if (error) {
        // erro não deixa um profile antigo preso no cache
        if (cachedUserId === userId) {
          cachedProfile = null;
          cachedUserId = null;
        }
        return null;
      }

      cachedProfile = data ?? null;
      cachedUserId = userId;
      return cachedProfile;
    });

  pendingProfileFetch = { userId, promise };
  return promise;
}

export default function useUser() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(cachedProfile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        fetchProfile(currentUser.id).then((data) => mounted && setProfile(data));
      } else {
        cachedProfile = null;
        cachedUserId = null;
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        fetchProfile(currentUser.id).then((data) => mounted && setProfile(data));
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}
