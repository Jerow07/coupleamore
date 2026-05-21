import { useState, useEffect, useRef } from 'react';
import { supabase, ensureAnonSession } from '../lib/supabase';

const TABLE = 'couple_locations';
const PARTNER_TIMEOUT_MS = 15000;

export function useRoom({ roomCode, userName, avatar, myLocation }) {
  const [partner, setPartner] = useState(null);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [channelReady, setChannelReady] = useState(false);
  const myKeyRef = useRef(`user_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const channelRef = useRef(null);
  const partnerTimeoutRef = useRef(null);

  const myLocationRef = useRef(myLocation);
  const userNameRef = useRef(userName);
  const avatarRef = useRef(avatar);

  useEffect(() => { myLocationRef.current = myLocation; }, [myLocation]);
  useEffect(() => { userNameRef.current = userName; }, [userName]);
  useEffect(() => { avatarRef.current = avatar; }, [avatar]);

  // Suscribir a cambios en la tabla para recibir ubicación del partner
  useEffect(() => {
    if (!roomCode) return;

    let active = true;

    async function subscribe() {
      await ensureAnonSession();

      const channel = supabase
        .channel(`db-room-${roomCode}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: TABLE,
            filter: `room_code=eq.${roomCode}`,
          },
          (payload) => {
            if (!active) return;
            const row = payload.new || payload.old;
            if (!row || row.user_key === myKeyRef.current) return;

            if (payload.eventType === 'DELETE') {
              setPartnerOnline(false);
              setPartner(null);
              return;
            }

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
              if (active) {
                setPartnerOnline(false);
                setPartner(null);
              }
            }, PARTNER_TIMEOUT_MS);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED' && active) {
            setChannelReady(true);
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
      // Borrar fila propia al salir
      supabase
        .from(TABLE)
        .delete()
        .eq('room_code', roomCode)
        .eq('user_key', myKeyRef.current)
        .then(() => {});
      setChannelReady(false);
      setPartner(null);
      setPartnerOnline(false);
    };
  }, [roomCode]);

  // Escribir ubicación propia en la tabla cuando cambia
  useEffect(() => {
    if (!channelReady || !myLocation) return;

    supabase
      .from(TABLE)
      .upsert({
        room_code: roomCode,
        user_key: myKeyRef.current,
        name: userName,
        avatar: avatar || null,
        lat: myLocation.lat,
        lon: myLocation.lon,
        updated_at: new Date().toISOString(),
      })
      .then(() => {});
  }, [myLocation, channelReady, userName, avatar, roomCode]);

  // Heartbeat cada 5s para mantener la fila fresca
  useEffect(() => {
    if (!channelReady) return;
    const id = setInterval(() => {
      const loc = myLocationRef.current;
      if (!loc) return;
      supabase
        .from(TABLE)
        .upsert({
          room_code: roomCode,
          user_key: myKeyRef.current,
          name: userNameRef.current,
          avatar: avatarRef.current || null,
          lat: loc.lat,
          lon: loc.lon,
          updated_at: new Date().toISOString(),
        })
        .then(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [channelReady, roomCode]);

  return { partner, partnerOnline, channelReady };
}
