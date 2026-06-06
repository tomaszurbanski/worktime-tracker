import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerState, WorkSession } from '../types';
import { addSession, updateSession, getSessions } from '../utils/storage';

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export { TimerState };

export const useTimer = () => {
  const [state, setState] = useState<TimerState>({
    isWorking: false,
    workStart: null,
    workElapsed: 0,
    isDelegating: false,
    delegationStart: null,
    delegationElapsed: 0,
    isCommuting: false,
    commuteStart: null,
  });

  const workSessionId = useRef<string | null>(null);
  const delegationSessionId = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.isWorking || state.isDelegating) {
      intervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          workElapsed: prev.isWorking ? Date.now() - (prev.workStart ?? Date.now()) : prev.workElapsed,
          delegationElapsed: prev.isDelegating ? Date.now() - (prev.delegationStart ?? Date.now()) : prev.delegationElapsed,
        }));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.isWorking, state.isDelegating]);

  const forceCloseAnyActive = useCallback(async () => {
    const all = await getSessions();
    const active = all.filter(s => !s.endTime);
    for (const s of active) {
      await updateSession(s.id, { endTime: Date.now() });
    }
    workSessionId.current = null;
  }, []);

  const startWork = useCallback(async (mode: 'manual' | 'auto') => {
    if (state.isWorking) return;
    await forceCloseAnyActive();
    const now = Date.now();
    const id = generateId();
    const session: WorkSession = {
      id,
      startTime: now,
      mode,
      type: 'work',
      ...(state.isDelegating && delegationSessionId.current
        ? { delegationId: delegationSessionId.current }
        : {}),
    };
    await addSession(session);
    workSessionId.current = id;
    setState(prev => ({ ...prev, isWorking: true, workStart: now, workElapsed: 0 }));
  }, [state.isWorking, state.isDelegating, forceCloseAnyActive]);

  const stopWork = useCallback(async () => {
    if (!state.isWorking || !workSessionId.current) return;
    const now = Date.now();
    if (state.isCommuting) {
      await updateSession(workSessionId.current, {
        endTime: now,
        commuteStartTime: state.commuteStart ?? undefined,
        commuteEndTime: now,
      });
    } else {
      await updateSession(workSessionId.current, { endTime: now });
    }
    workSessionId.current = null;
    setState(prev => ({ ...prev, isWorking: false, workStart: null, isCommuting: false, commuteStart: null }));
  }, [state.isWorking, state.isCommuting, state.commuteStart]);

  const startDelegation = useCallback(async () => {
    if (state.isDelegating) return;
    const now = Date.now();
    const id = generateId();
    const session: WorkSession = {
      id,
      startTime: now,
      mode: 'manual',
      type: 'delegation',
      delegation: { destination: 'Delegacja', isTrip: true },
    };
    await addSession(session);
    delegationSessionId.current = id;
    setState(prev => ({ ...prev, isDelegating: true, delegationStart: now, delegationElapsed: 0 }));
  }, [state.isDelegating]);

  const stopDelegation = useCallback(async () => {
    if (!state.isDelegating || !delegationSessionId.current) return;
    if (state.isWorking) await stopWork();
    await updateSession(delegationSessionId.current, { endTime: Date.now() });
    delegationSessionId.current = null;
    setState(prev => ({
      ...prev,
      isDelegating: false,
      delegationStart: null,
      isWorking: false,
      workStart: null,
    }));
  }, [state.isDelegating, state.isWorking, stopWork]);

  const startCommute = useCallback(async () => {
    if (state.isCommuting || !state.isWorking || !workSessionId.current) return;
    const now = Date.now();
    await updateSession(workSessionId.current, { commuteStartTime: now });
    setState(prev => ({ ...prev, isCommuting: true, commuteStart: now }));
  }, [state.isCommuting, state.isWorking]);

  const stopCommute = useCallback(async () => {
    if (!state.isCommuting || !workSessionId.current) return;
    const now = Date.now();
    await updateSession(workSessionId.current, { commuteEndTime: now });
    setState(prev => ({ ...prev, isCommuting: false }));
  }, [state.isCommuting]);

  return { state, startWork, stopWork, startDelegation, stopDelegation, startCommute, stopCommute };
};
