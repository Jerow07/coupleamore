// Hook para sincronización en tiempo real de una sala con Supabase Realtime

import { useState, useEffect, useRef } from 'react';
import { supabase, ensureAnonSession } from '../lib/supabase';
import { CHANNEL_PREFIX, LOCATION_EVENT } from '../config/constants';

/**
 * Gestiona la presencia y ubicación en una sala compartida.
 *
 * @param {object} params
 * @param {string} params.roomCode - Código de la sala (6 chars)
 * @param {string} params.userName - Nombre del usuario actual
 * @param {string|null} params.avatar - URI de avatar (puede ser null)
 * @param {{lat: number, lon: number}|null} params.myLocation - Ubicación actual del usuario
 * @returns {{ partner: object|null, partnerOnline: boolean, channelReady: boolean }}
 */
export function useRoom({ roomCode, userName, avatar, myLocation }) {
  const [partner, setPartner] = useState(null);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [channelReady, setChannelReady] = useState(false);
  const channelRef = useRef(null);
  const myKeyRef = useRef(`user_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  // Suscribirse al canal de la sala
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

      // Escuchar broadcasts de ubicación
      channel.on('broadcast', { event: LOCATION_EVENT }, ({ payload }) => {
        if (!active) return;
        if (payload?.key === myKeyRef.current) return; // Ignorar propio

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

      // Presencia para detectar si la pareja está online
      channel.on('presence', { event: 'sync' }, () => {
        if (!active) return;
        const state = channel.presenceState();
        const keys = Object.keys(state).filter((k) => k !== myKeyRef.current);
        setPartnerOnline(keys.length > 0);
        if (keys.length === 0) {
          setPartner(null);
        }
      });

      channel.on('presence', { event: 'join' }, ({ key }) => {
        if (!active || key === myKeyRef.current) return;
        setPartnerOnline(true);
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
          // Anunciar presencia
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

  return { partner, partnerOnline, channelReady };
}
