import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerState, WorkSession } from '../types';
import { addSession, updateSession } from '../utils/storage';

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const useTimer = () => {
  const [state, setState] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    elapsed: 0,
    isCommuting: false,
    commuteStartTime: null,
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.isRunning && state.startTime) {
      intervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          elapsed: Date.now() - (prev.startTime ?? Date.now()),
        }));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isRunning, state.startTime]);

  const startWork = useCallback(async (mode: 'manual' | 'auto') => {
    const now = Date.now();
    const id = generateId();
    const session: WorkSession = { id, startTime: now, mode };
    await addSession(session);
    setActiveSessionId(id);
    setState({
      isRunning: true,
      startTime: now,
      elapsed: 0,
      isCommuting: false,
      commuteStartTime: null,
    });
  }, []);

  const stopWork = useCallback(async () => {
    if (!activeSessionId) return;
    const now = Date.now();
    await updateSession(activeSessionId, { endTime: now });
    setActiveSessionId(null);
    setState(prev => ({
      ...prev,
      isRunning: false,
      elapsed: now - (prev.startTime ?? now),
    }));
  }, [activeSessionId]);

  const startCommute = useCallback(() => {
    setState(prev => ({ ...prev, isCommuting: true, commuteStartTime: Date.now() }));
  }, []);

  const stopCommute = useCallback(async () => {
    if (!activeSessionId) return;
    const now = Date.now();
    await updateSession(activeSessionId, {
      commuteStartTime: state.commuteStartTime ?? undefined,
      commuteEndTime: now,
    });
    setState(prev => ({ ...prev, isCommuting: false }));
  }, [activeSessionId, state.commuteStartTime]);

  return { state, activeSessionId, startWork, stopWork, startCommute, stopCommute };
};
