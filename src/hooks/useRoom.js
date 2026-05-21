import { useState, useEffect, useRef } from 'react';
import { supabase, ensureAnonSession } from '../lib/supabase';

const TABLE = 'couple_locations';
const PARTNER_TIMEOUT_MS = 15000;
const CONNECT_TIMEOUT_MS = 6000; // Si en 6s no conectó, forzar ready y usar polling
const POLL_INTERVAL_MS = 5000;

export function useRoom({ roomCode, userName, avatar, myLocation }) {
  const [partner, setPartner] = useState(null);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [channelReady, setChannelReady] = useState(false);
  const myKeyRef = useRef(`user_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const channelRef = useRef(null);
  const partnerTimeoutRef = useRef(null);
  const readyRef = useRef(false);

  const myLocationRef = useRef(myLocation);
  const userNameRef = useRef(userName);
  const avatarRef = useRef(avatar);

  useEffect(() => { myLocationRef.current = myLocation; }, [myLocation]);
  useEffect(() => { userNameRef.current = userName; }, [userName]);
  useEffect(() => { avatarRef.current = avatar; }, [avatar]);

  function handlePartnerRow(row) {
    if (!row || row.user_key === myKeyRef.current) return;
    setPartner({
      lat: row.lat,
      lon: row.lon,
      name: row.name,
      avatar: row.avatar || null,
      key: row.user_key,
      updatedAt: Date.now(),
    });
    setPartnerOnline(true);
    if (partnerTimeoutRef.current) clearTimeout(partnerTimeoutRef.current);
    partnerTimeoutRef.current = setTimeout(() => {
      setPartnerOnline(false);
      setPartner(null);
    }, PARTNER_TIMEOUT_MS);
  }

  useEffect(() => {
    if (!roomCode) return;

    let active = true;
    readyRef.current = false;

    function markReady() {
      if (!active || readyRef.current) return;
      readyRef.current = true;
      setChannelReady(true);
    }

    async function subscribe() {
      await ensureAnonSession();

      // Timeout de seguridad: si el canal no conecta en 6s, seguir igual
      const connectTimeout = setTimeout(markReady, CONNECT_TIMEOUT_MS);

      const channel = supabase
        .channel(`db-room-${roomCode}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: TABLE, filter: `room_code=eq.${roomCode}` },
          (payload) => {
            if (!active) return;
            if (payload.eventType === 'DELETE') {
              const row = payload.old;
              if (row?.user_key !== myKeyRef.current) {
                setPartnerOnline(false);
                setPartner(null);
              }
              return;
            }
            handlePartnerRow(payload.new);
          }
        )
        .subscribe((status) => {
          clearTimeout(connectTimeout);
          if ((status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && active) {
            markReady();
          }
        });

      channelRef.current = channel;
    }

    subscribe();

    return () => {
      active = false;
      if (partnerTimeoutRef.current) clearTimeout(partnerTimeoutRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      supabase.from(TABLE).delete()
        .eq('room_code', roomCode).eq('user_key', myKeyRef.current).then(() => {});
      setChannelReady(false);
      readyRef.current = false;
      setPartner(null);
      setPartnerOnline(false);
    };
  }, [roomCode]);

  // Escribir ubicación propia cuando cambia
  useEffect(() => {
    if (!channelReady || !myLocation) return;
    supabase.from(TABLE).upsert({
      room_code: roomCode,
      user_key: myKeyRef.current,
      name: userName,
      avatar: avatar || null,
      lat: myLocation.lat,
      lon: myLocation.lon,
      updated_at: new Date().toISOString(),
    }).then(() => {});
  }, [myLocation, channelReady, userName, avatar, roomCode]);

  // Heartbeat cada 5s: escribe ubicación propia Y lee la del partner (fallback si postgres_changes falla)
  useEffect(() => {
    if (!channelReady) return;
    const id = setInterval(async () => {
      const loc = myLocationRef.current;

      // Escribir propia
      if (loc) {
        supabase.from(TABLE).upsert({
          room_code: roomCode,
          user_key: myKeyRef.current,
          name: userNameRef.current,
          avatar: avatarRef.current || null,
          lat: loc.lat,
          lon: loc.lon,
          updated_at: new Date().toISOString(),
        }).then(() => {});
      }

      // Leer partner (polling fallback)
      const { data } = await supabase
        .from(TABLE)
        .select('*')
        .eq('room_code', roomCode)
        .neq('user_key', myKeyRef.current)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (data?.[0]) handlePartnerRow(data[0]);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(id);
  }, [channelReady, roomCode]);

  return { partner, partnerOnline, channelReady };
}
