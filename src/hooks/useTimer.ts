import { useState, useEffect, useRef, useCallback } from 'react';
import { WorkSession } from '../types';
import { addSession, updateSession } from '../utils/storage';

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export interface TimerState {
  isWorking: boolean;
  workStart: number | null;
  workElapsed: number;
  isDelegating: boolean;
  delegationStart: number | null;
  delegationElapsed: number;
}

export const useTimer = () => {
  const [state, setState] = useState<TimerState>({
    isWorking: false,
    workStart: null,
    workElapsed: 0,
    isDelegating: false,
    delegationStart: null,
    delegationElapsed: 0,
  });

  const workSessionId = useRef<string | null>(null);
  const delegationSessionId = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const anyRunning = state.isWorking || state.isDelegating;
    if (anyRunning) {
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

  const startWork = useCallback(async (mode: 'manual' | 'auto') => {
    if (state.isWorking) return;
    const now = Date.now();
    const id = generateId();
    const session: WorkSession = {
      id,
      startTime: now,
      mode,
      type: state.isDelegating ? 'delegation' : 'work',
      ...(state.isDelegating && delegationSessionId.current
        ? { delegation: { destination: 'Delegacja', purpose: '' } }
        : {}),
    };
    await addSession(session);
    workSessionId.current = id;
    setState(prev => ({ ...prev, isWorking: true, workStart: now, workElapsed: 0 }));
  }, [state.isWorking, state.isDelegating]);

  const stopWork = useCallback(async () => {
    if (!state.isWorking || !workSessionId.current) return;
    await updateSession(workSessionId.current, { endTime: Date.now() });
    workSessionId.current = null;
    setState(prev => ({ ...prev, isWorking: false, workStart: null }));
  }, [state.isWorking]);

  const startDelegation = useCallback(async () => {
    if (state.isDelegating) return;
    const now = Date.now();
    const id = generateId();
    const session: WorkSession = {
      id,
      startTime: now,
      mode: 'manual',
      type: 'delegation',
      delegation: { destination: 'Delegacja', purpose: '' },
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

  return { state, startWork, stopWork, startDelegation, stopDelegation };
};
