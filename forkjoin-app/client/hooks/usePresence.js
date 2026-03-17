import { useEffect, useState, useCallback, useRef } from 'react';
const DEFAULT_COLLECTIVE = {
  activeVisitors: 0,
  interactionIntensity: 0.3,
  primaryEmotion: 'curious',
  valence: 0.2,
  arousal: 0.4,
};
const COLLECTIVE_FOREGROUND_POLL_MS = 7000;
const COLLECTIVE_BACKGROUND_POLL_MS = 20000;
const COLLECTIVE_POLL_JITTER_MS = 1000;
export function usePresence() {
  const [visitors, setVisitors] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [collective, setCollective] = useState(DEFAULT_COLLECTIVE);
  const [chatMessages, setChatMessages] = useState([]);
  const [voiceParticipants, setVoiceParticipants] = useState([]);
  const [visitorColor, setVisitorColor] = useState('#336699');
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const collectivePollTimeoutRef = useRef(null);
  const collectiveFetchInFlightRef = useRef(false);
  const visitorIdRef = useRef(null);
  const getVisitorId = useCallback(() => {
    if (visitorIdRef.current) return visitorIdRef.current;
    const stored = localStorage.getItem('aeon-visitor-id');
    if (stored) {
      visitorIdRef.current = stored;
      return stored;
    }
    const id = crypto.randomUUID();
    localStorage.setItem('aeon-visitor-id', id);
    visitorIdRef.current = id;
    return id;
  }, []);
  const sendPresenceMessage = useCallback((type, payload) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type, payload }));
  }, []);
  const patchVisitor = useCallback((visitorId, updater) => {
    setVisitors((prev) => {
      const index = prev.findIndex((visitor) => visitor.id === visitorId);
      if (index === -1) {
        return [...prev, updater(null)];
      }
      const next = [...prev];
      next[index] = updater(prev[index]);
      return next;
    });
  }, []);
  const handleMessage = useCallback(
    (message) => {
      switch (message.type) {
        case 'state': {
          const payload = toRecord(message.payload);
          const visitorList = Array.isArray(payload?.visitors)
            ? payload.visitors
            : [];
          const parsedVisitors = visitorList
            .map((value) => toVisitor(value))
            .filter((visitor) => visitor !== null);
          const count = asNumber(payload?.count) ?? parsedVisitors.length;
          setVisitors(parsedVisitors);
          setCollective((prev) => ({ ...prev, activeVisitors: count }));
          break;
        }
        case 'cursor': {
          const payload = toRecord(message.payload);
          if (!payload) break;
          setVisitors((prev) => {
            const next = [...prev];
            for (const [id, value] of Object.entries(payload)) {
              const cursorData = toRecord(value);
              const x = asNumber(cursorData?.x);
              const y = asNumber(cursorData?.y);
              if (x == null || y == null) continue;
              const color =
                typeof cursorData?.color === 'string'
                  ? cursorData.color
                  : '#60a5fa';
              const existing = next.find((visitor) => visitor.id === id);
              if (existing) {
                existing.cursor = { x, y };
                existing.lastActivityAt = Date.now();
              } else {
                next.push({
                  id,
                  color,
                  cursor: { x, y },
                  region: 'unknown',
                  connectedAt: Date.now(),
                  lastActivityAt: Date.now(),
                });
              }
            }
            return next;
          });
          break;
        }
        case 'join': {
          const payload = toRecord(message.payload);
          if (
            typeof payload?.visitorId !== 'string' ||
            typeof payload.color !== 'string'
          ) {
            break;
          }
          const visitorId = payload.visitorId;
          const color = payload.color;
          const region =
            typeof payload.region === 'string' ? payload.region : 'unknown';
          setVisitors((prev) => {
            if (prev.find((visitor) => visitor.id === visitorId)) {
              return prev;
            }
            return [
              ...prev,
              {
                id: visitorId,
                color,
                cursor: null,
                region,
                connectedAt: Date.now(),
                lastActivityAt: Date.now(),
              },
            ];
          });
          setCollective((prev) => ({
            ...prev,
            activeVisitors: prev.activeVisitors + 1,
          }));
          break;
        }
        case 'leave': {
          const payload = toRecord(message.payload);
          if (typeof payload?.visitorId !== 'string') break;
          setVisitors((prev) =>
            prev.filter((visitor) => visitor.id !== payload.visitorId)
          );
          setCollective((prev) => ({
            ...prev,
            activeVisitors: Math.max(0, prev.activeVisitors - 1),
          }));
          break;
        }
        case 'focus': {
          const payload = toRecord(message.payload);
          if (
            typeof payload?.visitorId !== 'string' ||
            typeof payload.focusNode !== 'string'
          ) {
            break;
          }
          const visitorId = payload.visitorId;
          const focusNode = payload.focusNode;
          patchVisitor(visitorId, (existing) => ({
            ...(existing ?? createVisitor(visitorId)),
            focusNode,
            lastActivityAt: Date.now(),
          }));
          break;
        }
        case 'selection': {
          const payload = toRecord(message.payload);
          if (typeof payload?.visitorId !== 'string') break;
          const selection = toSelection(payload.selection);
          if (!selection) break;
          const visitorId = payload.visitorId;
          patchVisitor(visitorId, (existing) => ({
            ...(existing ?? createVisitor(visitorId)),
            selection,
            lastActivityAt: Date.now(),
          }));
          break;
        }
        case 'typing': {
          const payload = toRecord(message.payload);
          if (typeof payload?.visitorId !== 'string') break;
          const typing = toTyping(payload.typing);
          if (!typing) break;
          const visitorId = payload.visitorId;
          patchVisitor(visitorId, (existing) => ({
            ...(existing ?? createVisitor(visitorId)),
            typing,
            lastActivityAt: Date.now(),
          }));
          break;
        }
        case 'scroll': {
          const payload = toRecord(message.payload);
          if (typeof payload?.visitorId !== 'string') break;
          const scroll = toScroll(payload.scroll);
          if (!scroll) break;
          const visitorId = payload.visitorId;
          patchVisitor(visitorId, (existing) => ({
            ...(existing ?? createVisitor(visitorId)),
            scroll,
            lastActivityAt: Date.now(),
          }));
          break;
        }
        case 'viewport': {
          const payload = toRecord(message.payload);
          if (typeof payload?.visitorId !== 'string') break;
          const viewport = toViewport(payload.viewport);
          if (!viewport) break;
          const visitorId = payload.visitorId;
          patchVisitor(visitorId, (existing) => ({
            ...(existing ?? createVisitor(visitorId)),
            viewport,
            lastActivityAt: Date.now(),
          }));
          break;
        }
        case 'input_state': {
          const payload = toRecord(message.payload);
          if (typeof payload?.visitorId !== 'string') break;
          const inputState = toInputState(payload.inputState);
          if (!inputState) break;
          const visitorId = payload.visitorId;
          patchVisitor(visitorId, (existing) => ({
            ...(existing ?? createVisitor(visitorId)),
            inputState,
            lastActivityAt: Date.now(),
          }));
          break;
        }
        case 'emotion': {
          const payload = toRecord(message.payload);
          if (typeof payload?.visitorId !== 'string') break;
          const emotion = toEmotion(payload.emotion);
          if (!emotion) break;
          const visitorId = payload.visitorId;
          patchVisitor(visitorId, (existing) => ({
            ...(existing ?? createVisitor(visitorId)),
            emotion,
            lastActivityAt: Date.now(),
          }));
          break;
        }
        case 'chat': {
          const payload = toRecord(message.payload);
          if (
            typeof payload?.visitorId !== 'string' ||
            typeof payload.color !== 'string' ||
            typeof payload.message !== 'string'
          ) {
            break;
          }
          const chatMessage = {
            id: crypto.randomUUID(),
            visitorId: payload.visitorId,
            color: payload.color,
            message: payload.message,
            timestamp: Date.now(),
          };
          setChatMessages((prev) => [...prev.slice(-99), chatMessage]);
          break;
        }
        case 'voice_join': {
          const payload = toRecord(message.payload);
          if (
            typeof payload?.visitorId !== 'string' ||
            typeof payload.color !== 'string'
          ) {
            break;
          }
          const visitorId = payload.visitorId;
          const color = payload.color;
          setVoiceParticipants((prev) => {
            if (prev.find((participant) => participant.id === visitorId)) {
              return prev;
            }
            return [
              ...prev,
              {
                id: visitorId,
                color,
                isMuted: true,
                isSpeaking: false,
              },
            ];
          });
          break;
        }
        case 'voice_leave': {
          const payload = toRecord(message.payload);
          if (typeof payload?.visitorId !== 'string') break;
          setVoiceParticipants((prev) =>
            prev.filter((participant) => participant.id !== payload.visitorId)
          );
          break;
        }
        case 'pong':
          break;
      }
    },
    [patchVisitor]
  );
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const visitorId = getVisitorId();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?visitor_id=${visitorId}`;
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => {
        setIsConnected(true);
        sendPresenceMessage('viewport', {
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (typeof message.type !== 'string') return;
          handleMessage({ type: message.type, payload: message.payload });
        } catch {
          // Silenced — malformed frame, skip
        }
      };
      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
      ws.onerror = () => {
        // Silenced — onclose handles reconnection
      };
    } catch {
      // Silenced — reconnect will retry
    }
  }, [getVisitorId, handleMessage, sendPresenceMessage]);
  const sendCursor = useCallback(
    (x, y) => {
      sendPresenceMessage('cursor', { x, y });
    },
    [sendPresenceMessage]
  );
  const sendChat = useCallback(
    (message) => {
      sendPresenceMessage('chat', { message });
    },
    [sendPresenceMessage]
  );
  const joinVoice = useCallback(() => {
    sendPresenceMessage('voice_join');
  }, [sendPresenceMessage]);
  const leaveVoice = useCallback(() => {
    sendPresenceMessage('voice_leave');
  }, [sendPresenceMessage]);
  const sendFocusNode = useCallback(
    (focusNode) => {
      sendPresenceMessage('focus', { focusNode });
    },
    [sendPresenceMessage]
  );
  const sendSelection = useCallback(
    (selection) => {
      sendPresenceMessage('selection', selection);
    },
    [sendPresenceMessage]
  );
  const sendTyping = useCallback(
    (typing) => {
      sendPresenceMessage('typing', typing);
    },
    [sendPresenceMessage]
  );
  const sendScroll = useCallback(
    (scroll) => {
      sendPresenceMessage('scroll', {
        ...scroll,
        depth: Math.max(0, Math.min(1, scroll.depth)),
      });
    },
    [sendPresenceMessage]
  );
  const sendViewport = useCallback(
    (viewport) => {
      sendPresenceMessage('viewport', viewport);
    },
    [sendPresenceMessage]
  );
  const sendInputState = useCallback(
    (inputState) => {
      sendPresenceMessage('input_state', inputState);
    },
    [sendPresenceMessage]
  );
  const sendEmotionState = useCallback(
    (emotion) => {
      sendPresenceMessage('emotion', {
        ...emotion,
        updatedAt: emotion.updatedAt ?? new Date().toISOString(),
      });
    },
    [sendPresenceMessage]
  );
  useEffect(() => {
    connect();
    const heartbeat = setInterval(() => {
      sendPresenceMessage('ping');
    }, 30000);
    return () => {
      clearInterval(heartbeat);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect, sendPresenceMessage]);
  useEffect(() => {
    const handleResize = () => {
      sendViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [sendViewport]);
  useEffect(() => {
    let active = true;
    const clearCollectivePollTimer = () => {
      if (collectivePollTimeoutRef.current) {
        clearTimeout(collectivePollTimeoutRef.current);
        collectivePollTimeoutRef.current = null;
      }
    };
    const fetchCollective = async () => {
      if (collectiveFetchInFlightRef.current) return;
      collectiveFetchInFlightRef.current = true;
      try {
        const response = await fetch('/api/collective', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        const nextCollective = {
          activeVisitors: data.activeVisitors || 0,
          interactionIntensity: data.interactionIntensity || 0.3,
          primaryEmotion: data.emotionAggregates?.primary || 'curious',
          valence: data.emotionAggregates?.valence || 0,
          arousal: data.emotionAggregates?.arousal || 0.3,
        };
        setCollective((prev) => {
          if (
            prev.activeVisitors === nextCollective.activeVisitors &&
            prev.interactionIntensity === nextCollective.interactionIntensity &&
            prev.primaryEmotion === nextCollective.primaryEmotion &&
            prev.valence === nextCollective.valence &&
            prev.arousal === nextCollective.arousal
          ) {
            return prev;
          }
          return nextCollective;
        });
      } catch {
        // Ignore collective fetch errors
      } finally {
        collectiveFetchInFlightRef.current = false;
      }
    };
    const scheduleNextCollectivePoll = () => {
      if (!active) return;
      const baseInterval =
        document.visibilityState === 'visible'
          ? COLLECTIVE_FOREGROUND_POLL_MS
          : COLLECTIVE_BACKGROUND_POLL_MS;
      const jitterMs = Math.floor(Math.random() * COLLECTIVE_POLL_JITTER_MS);
      collectivePollTimeoutRef.current = setTimeout(async () => {
        await fetchCollective();
        scheduleNextCollectivePoll();
      }, baseInterval + jitterMs);
    };
    void fetchCollective().then(() => {
      scheduleNextCollectivePoll();
    });
    const handleVisibilityChange = () => {
      clearCollectivePollTimer();
      if (document.visibilityState === 'visible') {
        void fetchCollective();
      }
      scheduleNextCollectivePoll();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      active = false;
      clearCollectivePollTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  useEffect(() => {
    const stored = localStorage.getItem('aeon-visitor-color');
    if (stored) {
      setVisitorColor(stored);
      return;
    }
    const id = getVisitorId();
    const hash = id
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360;
    const color = `hsl(${hue}, 70%, 60%)`;
    setVisitorColor(color);
    localStorage.setItem('aeon-visitor-color', color);
  }, [getVisitorId]);
  return {
    visitors,
    isConnected,
    collective,
    chatMessages,
    voiceParticipants,
    visitorId: visitorIdRef.current || '',
    visitorColor,
    sendCursor,
    sendChat,
    joinVoice,
    leaveVoice,
    sendFocusNode,
    sendSelection,
    sendTyping,
    sendScroll,
    sendViewport,
    sendInputState,
    sendEmotionState,
  };
}
function createVisitor(visitorId) {
  return {
    id: visitorId,
    color: '#60a5fa',
    cursor: null,
    region: 'unknown',
    connectedAt: Date.now(),
    lastActivityAt: Date.now(),
  };
}
function toRecord(value) {
  return typeof value === 'object' && value !== null ? value : null;
}
function asNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
function toSelection(value) {
  const record = toRecord(value);
  const start = asNumber(record?.start);
  const end = asNumber(record?.end);
  if (start == null || end == null) return null;
  return {
    start,
    end,
    direction:
      record?.direction === 'forward' ||
      record?.direction === 'backward' ||
      record?.direction === 'none'
        ? record.direction
        : undefined,
    path: typeof record?.path === 'string' ? record.path : undefined,
  };
}
function toTyping(value) {
  const record = toRecord(value);
  if (typeof record?.isTyping !== 'boolean') return null;
  return {
    isTyping: record.isTyping,
    field: typeof record.field === 'string' ? record.field : undefined,
    isComposing:
      typeof record.isComposing === 'boolean' ? record.isComposing : undefined,
    startedAt:
      typeof record.startedAt === 'string' ? record.startedAt : undefined,
    stoppedAt:
      typeof record.stoppedAt === 'string' ? record.stoppedAt : undefined,
  };
}
function toScroll(value) {
  const record = toRecord(value);
  if (!record) return null;
  const depth = asNumber(record?.depth);
  if (depth == null) return null;
  return {
    depth: Math.max(0, Math.min(1, depth)),
    y: asNumber(record.y) ?? undefined,
    viewportHeight: asNumber(record.viewportHeight) ?? undefined,
    documentHeight: asNumber(record.documentHeight) ?? undefined,
    path: typeof record.path === 'string' ? record.path : undefined,
  };
}
function toViewport(value) {
  const record = toRecord(value);
  const width = asNumber(record?.width);
  const height = asNumber(record?.height);
  if (width == null || height == null) return null;
  return { width, height };
}
function toInputState(value) {
  const record = toRecord(value);
  if (
    typeof record?.field !== 'string' ||
    typeof record.hasFocus !== 'boolean'
  ) {
    return null;
  }
  return {
    field: record.field,
    hasFocus: record.hasFocus,
    valueLength: asNumber(record.valueLength) ?? undefined,
    selectionStart: asNumber(record.selectionStart) ?? undefined,
    selectionEnd: asNumber(record.selectionEnd) ?? undefined,
    isComposing:
      typeof record.isComposing === 'boolean' ? record.isComposing : undefined,
    inputMode:
      typeof record.inputMode === 'string' ? record.inputMode : undefined,
  };
}
function toEmotion(value) {
  const record = toRecord(value);
  if (!record) return null;
  const emotion = {
    primary: typeof record.primary === 'string' ? record.primary : undefined,
    secondary:
      typeof record.secondary === 'string' ? record.secondary : undefined,
    confidence: asNumber(record.confidence) ?? undefined,
    intensity: asNumber(record.intensity) ?? undefined,
    valence: asNumber(record.valence) ?? undefined,
    arousal: asNumber(record.arousal) ?? undefined,
    dominance: asNumber(record.dominance) ?? undefined,
    source:
      record.source === 'self-report' ||
      record.source === 'inferred' ||
      record.source === 'sensor' ||
      record.source === 'hybrid'
        ? record.source
        : undefined,
    updatedAt:
      typeof record.updatedAt === 'string' ? record.updatedAt : undefined,
  };
  if (
    !emotion.primary &&
    !emotion.secondary &&
    emotion.confidence === undefined &&
    emotion.intensity === undefined &&
    emotion.valence === undefined &&
    emotion.arousal === undefined &&
    emotion.dominance === undefined &&
    !emotion.source &&
    !emotion.updatedAt
  ) {
    return null;
  }
  return emotion;
}
function toVisitor(value) {
  const record = toRecord(value);
  if (
    !record ||
    typeof record.id !== 'string' ||
    typeof record.color !== 'string'
  ) {
    return null;
  }
  const cursorRecord = toRecord(record.cursor);
  const cursorX = asNumber(cursorRecord?.x);
  const cursorY = asNumber(cursorRecord?.y);
  return {
    id: record.id,
    color: record.color,
    cursor:
      cursorX != null && cursorY != null ? { x: cursorX, y: cursorY } : null,
    viewport: toViewport(record.viewport) ?? undefined,
    focusNode:
      typeof record.focusNode === 'string' ? record.focusNode : undefined,
    selection: toSelection(record.selection) ?? undefined,
    typing: toTyping(record.typing) ?? undefined,
    scroll: toScroll(record.scroll) ?? undefined,
    inputState: toInputState(record.inputState) ?? undefined,
    emotion: toEmotion(record.emotion) ?? undefined,
    editing: typeof record.editing === 'string' ? record.editing : undefined,
    region: typeof record.region === 'string' ? record.region : 'unknown',
    connectedAt: asNumber(record.connectedAt) ?? undefined,
    lastActivityAt: asNumber(record.lastActivityAt) ?? undefined,
  };
}
//# sourceMappingURL=usePresence.js.map
