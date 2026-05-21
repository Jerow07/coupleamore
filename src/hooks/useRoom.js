import { useState, useEffect, useRef } from 'react';
import { supabase, ensureAnonSession } from '../lib/supabase';
import { CHANNEL_PREFIX, LOCATION_EVENT } from '../config/constants';

// Si no recibimos broadcast del partner en este tiempo, lo marcamos offline
const PARTNER_TIMEOUT_MS = 15000;

export function useRoom({ roomCode, userName, avatar, myLocation }) {
  const [partner, setPartner] = useState(null);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [channelReady, setChannelReady] = useState(false);
  const channelRef = useRef(null);
  const myKeyRef = useRef(`user_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const partnerTimeoutRef = useRef(null);

  // Refs para acceder a valores frescos dentro de callbacks del canal
  const myLocationRef = useRef(myLocation);
  const userNameRef = useRef(userName);
  const avatarRef = useRef(avatar);

  useEffect(() => { myLocationRef.current = myLocation; }, [myLocation]);
  useEffect(() => { userNameRef.current = userName; }, [userName]);
  useEffect(() => { avatarRef.current = avatar; }, [avatar]);

  useEffect(() => {
    if (!roomCode) return;

    let active = true;

    async function subscribe() {
      await ensureAnonSession();

      const channel = supabase.channel(`${CHANNEL_PREFIX}${roomCode}`, {
        config: { broadcast: { self: true } },
      });

      channel.on('broadcast', { event: LOCATION_EVENT }, ({ payload }) => {
        if (!active) return;
        if (payload?.key === myKeyRef.current) return; // ignorar propios

        setPartner({
          lat: payload.lat,
          lon: payload.lon,
          name: payload.name,
          avatar: payload.avatar || null,
          key: payload.key,
          updatedAt: Date.now(),
        });
        setPartnerOnline(true);

        // Reiniciar timeout: si no recibimos más en 15s → offline
        if (partnerTimeoutRef.current) clearTimeout(partnerTimeoutRef.current);
        partnerTimeoutRef.current = setTimeout(() => {
          if (active) {
            setPartnerOnline(false);
            setPartner(null);
          }
        }, PARTNER_TIMEOUT_MS);
      });

      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && active) {
          await channel.track({ key: myKeyRef.current, name: userName });
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
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setChannelReady(false);
      setPartner(null);
      setPartnerOnline(false);
    };
  }, [roomCode]);

  // Emitir ubicación propia cuando cambia
  useEffect(() => {
    if (!channelReady || !myLocation || !channelRef.current) return;

    channelRef.current.send({
      type: 'broadcast',
      event: LOCATION_EVENT,
      payload: {
        key: myKeyRef.current,
        lat: myLocation.lat,
        lon: myLocation.lon,
        name: userName,
        avatar: avatar || null,
      },
    });
  }, [myLocation, channelReady, userName, avatar]);

  // Heartbeat cada 5s: garantiza que el partner vea la ubicación aunque
  // no haya cambio de GPS o se haya perdido el primer broadcast
  useEffect(() => {
    if (!channelReady) return;
    const id = setInterval(() => {
      const loc = myLocationRef.current;
      if (loc && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: LOCATION_EVENT,
          payload: {
            key: myKeyRef.current,
            lat: loc.lat,
            lon: loc.lon,
            name: userNameRef.current,
            avatar: avatarRef.current || null,
          },
        });
      }
    }, 5000);
    return () => clearInterval(id);
  }, [channelReady]);

  return { partner, partnerOnline, channelReady };
}
