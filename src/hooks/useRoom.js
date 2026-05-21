import { useState, useEffect, useRef } from 'react';
import { supabase, ensureAnonSession } from '../lib/supabase';
import { CHANNEL_PREFIX, LOCATION_EVENT } from '../config/constants';

export function useRoom({ roomCode, userName, avatar, myLocation }) {
  const [partner, setPartner] = useState(null);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [channelReady, setChannelReady] = useState(false);
  const channelRef = useRef(null);
  const myKeyRef = useRef(`user_${Date.now()}_${Math.random().toString(36).slice(2)}`);

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

      const channelName = `${CHANNEL_PREFIX}${roomCode}`;
      const channel = supabase.channel(channelName, {
        config: {
          presence: { key: myKeyRef.current },
          broadcast: { self: false },
        },
      });

      channel.on('broadcast', { event: LOCATION_EVENT }, ({ payload }) => {
        if (!active) return;
        if (payload?.key === myKeyRef.current) return;

        setPartner({
          lat: payload.lat,
          lon: payload.lon,
          name: payload.name,
          avatar: payload.avatar || null,
          key: payload.key,
          updatedAt: Date.now(),
        });
        setPartnerOnline(true);
      });

      channel.on('presence', { event: 'sync' }, () => {
        if (!active) return;
        const state = channel.presenceState();
        const keys = Object.keys(state).filter((k) => k !== myKeyRef.current);
        setPartnerOnline(keys.length > 0);
        if (keys.length === 0) setPartner(null);
      });

      channel.on('presence', { event: 'join' }, ({ key }) => {
        if (!active || key === myKeyRef.current) return;
        setPartnerOnline(true);
        // Reenviar ubicación actual al partner que acaba de entrar
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
      });

      channel.on('presence', { event: 'leave' }, ({ key }) => {
        if (!active || key === myKeyRef.current) return;
        const state = channel.presenceState();
        const remaining = Object.keys(state).filter((k) => k !== myKeyRef.current);
        if (remaining.length === 0) {
          setPartnerOnline(false);
          setPartner(null);
        }
      });

      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && active) {
          await channel.track({ name: userName, avatar: avatar || null });
          setChannelReady(true);
        }
      });

      channelRef.current = channel;
    }

    subscribe();

    return () => {
      active = false;
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
  // no haya cambio de GPS o se haya perdido el evento de join
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
