import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./useAuth";
import {
  getPunchStatus,
  startShiftApi,
  pauseToggleApi,
  endShiftApi,
  getSummaryApi,
  getPunchesListApi,
} from "../services/timePunchAPI";

/* ===== Helpers (re-exportados para usar desde componentes) ===== */
export const pad2 = (number) => String(number).padStart(2, "0");

export const dateFromISO = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const formatTimeHHMM = (iso) => {
  if (!iso) return "--:--";
  const date = new Date(iso);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

export const formatHMS = (totalSeconds) => {
  if (totalSeconds == null) return "--";
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(sec)}`;
};

export const formatHoursMinutes = (totalSeconds) => {
  if (typeof totalSeconds !== "number") return "--";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export const monthLabelES = (dateObj) =>
  new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" })
    .format(dateObj)
    .replace(/^./, (c) => c.toUpperCase());

/* ===== Timeline ===== */
const BREAK_ALMUERZO_MINUTES = 45;

const buildTimelineFromPunches = (punchesLocalSortedAsc) => {
  const timeline = [];
  let breakStart = null;

  for (const punch of punchesLocalSortedAsc) {
    const punchedLocal = punch.punched_at_local;

    if (punch.punch_type === "IN") {
      timeline.push({ type: "entrada", label: "Entrada", time: formatTimeHHMM(punchedLocal) });
      breakStart = null;
    } else if (punch.punch_type === "BREAK_START") {
      if (!breakStart) breakStart = punchedLocal;
    } else if (punch.punch_type === "BREAK_END") {
      if (breakStart) {
        const start = new Date(breakStart);
        const end = new Date(punchedLocal);
        const minutes = Math.max(0, Math.round((end - start) / 60000));
        const tag = minutes >= BREAK_ALMUERZO_MINUTES ? "almuerzo" : "pausa";
        timeline.push({
          type: tag,
          label: tag === "almuerzo" ? "Almuerzo" : "Pausa",
          time: `${formatTimeHHMM(breakStart)} - ${formatTimeHHMM(punchedLocal)}`,
          minutes,
        });
        breakStart = null;
      }
    } else if (punch.punch_type === "OUT") {
      timeline.push({ type: "salida", label: "Salida", time: formatTimeHHMM(punchedLocal) });
      breakStart = null;
    }
  }

  if (breakStart) {
    timeline.push({ type: "pausa", label: "Pausa (en curso)", time: `${formatTimeHHMM(breakStart)} - —` });
  }

  return timeline.reverse(); // DESC
};

/* ===== Cálculo del tiempo trabajado HOY ===== */
const computeWorkSecondsToday = (punchesLocalSortedAsc, now = new Date()) => {
  let workSeconds = 0;
  let currentIn = null;
  let breakStart = null;
  let breakAccum = 0;

  for (const punch of punchesLocalSortedAsc) {
    const t = new Date(punch.punched_at_local);
    if (punch.punch_type === "IN") {
      currentIn = t;
      breakStart = null;
      breakAccum = 0;
    } else if (punch.punch_type === "BREAK_START") {
      if (currentIn && !breakStart) breakStart = t;
    } else if (punch.punch_type === "BREAK_END") {
      if (currentIn && breakStart) {
        if (t > breakStart) breakAccum += (t - breakStart) / 1000;
        breakStart = null;
      }
    } else if (punch.punch_type === "OUT") {
      if (currentIn) {
        if (breakStart && t > breakStart) {
          breakAccum += (t - breakStart) / 1000;
          breakStart = null;
        }
        const gross = (t - currentIn) / 1000;
        workSeconds += Math.max(0, gross - breakAccum);
        currentIn = null;
        breakAccum = 0;
      }
    }
  }

  if (currentIn) {
    let extraBreak = 0;
    if (breakStart && now > breakStart) extraBreak = (now - breakStart) / 1000;
    const gross = (now - currentIn) / 1000;
    workSeconds += Math.max(0, gross - (breakAccum + extraBreak));
  }

  return Math.max(0, Math.floor(workSeconds));
};

/* ===== Filas para la tabla (mismo formato que usabas) ===== */
const buildRowsFromSessionsNoGroup = (sessions) => {
  return [...(sessions || [])]
    .sort((a, b) => new Date(b.in) - new Date(a.in))
    .map((s) => {
      const isToday =
        s.date === `${new Date().getFullYear()}-${pad2(new Date().getMonth() + 1)}-${pad2(new Date().getDate())}`;
      return {
        key: `${s.date}-${s.in}-${s.out || ""}`,
        dateLabel: new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "2-digit" }).format(dateFromISO(s.date)),
        entrada: formatTimeHHMM(s.in),
        salida: formatTimeHHMM(s.out),
        pausas: formatHoursMinutes(s.break_seconds),
        horas: formatHoursMinutes(s.net_seconds),
        extra: "--",
        estado: "completado",
        isToday,
      };
    });
};

/* ===== Hook compartido ===== */
export const useTimePunch = () => {
  const { token, logout } = useAuth();

  const [status, setStatus] = useState({ open: false, paused: false, last_type: null, last_at: null });
  const [loadingAction, setLoadingAction] = useState(null);
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [todayPunchesRaw, setTodayPunchesRaw] = useState([]);
  const [todayWorkSeconds, setTodayWorkSeconds] = useState(0);
  const [error, setError] = useState(null);

  const { isoFrom, isoTo } = useMemo(() => {
    const y = currentMonthDate.getFullYear();
    const m = currentMonthDate.getMonth();
    const from = new Date(y, m, 1);
    const to = new Date(y, m + 1, 0);
    const fromIso = `${from.getFullYear()}-${pad2(from.getMonth() + 1)}-${pad2(from.getDate())}`;
    const toIso = `${to.getFullYear()}-${pad2(to.getMonth() + 1)}-${pad2(to.getDate())}`;
    return { isoFrom: fromIso, isoTo: toIso };
  }, [currentMonthDate]);

  // Loaders
  const loadStatus = async () => {
    try {
      const data = await getPunchStatus(token);
      setStatus(data);
    } catch (error) {
      if (String(error?.message || "").includes("401")) logout();
      else setError(error.message);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await getSummaryApi(token, isoFrom, isoTo, "Europe/Madrid");
      setSummary(data);
      setRows(buildRowsFromSessionsNoGroup(data.sessions));
    } catch (error) {
      setError(error.message);
    }
  };

  const loadTodayPunches = async () => {
    try {
      const now = new Date();
      const todayIso = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
      const listData = await getPunchesListApi(token, todayIso, todayIso, "Europe/Madrid");
      const punches = (listData.punches || []).sort(
        (a, b) => new Date(a.punched_at_local) - new Date(b.punched_at_local)
      );
      setTodayPunchesRaw(punches);
      setTimelineEvents(buildTimelineFromPunches(punches));
      setTodayWorkSeconds(computeWorkSecondsToday(punches, new Date()));
    } catch (error) {
      setError(error.message);
    }
  };

  // Efecto inicial + cambio de mes
  useEffect(() => {
    if (!token) return;
    (async () => {
      await loadStatus();
      await loadSummary();
      await loadTodayPunches();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isoFrom, isoTo]);

  // Polling si turno abierto
  useEffect(() => {
    if (!token || !status.open) return;
    const id = setInterval(async () => {
      await loadStatus();
      await loadTodayPunches();
    }, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, status.open]);

  // Contador vivo
  useEffect(() => {
    const tick = () => setTodayWorkSeconds(computeWorkSecondsToday(todayPunchesRaw, new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [todayPunchesRaw]);

  // Acciones
  const handleStart = async () => {
    if (!token || status.open || loadingAction) return;
    setError(null);
    setLoadingAction("start");
    try {
      await startShiftApi(token);
      await loadStatus();
      await loadSummary();
      await loadTodayPunches();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePauseToggle = async () => {
    if (!token || !status.open || loadingAction) return;
    setError(null);
    setLoadingAction("pause");
    try {
      await pauseToggleApi(token);
      await loadStatus();
      await loadTodayPunches();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEnd = async () => {
    if (!token || !status.open || loadingAction) return;
    setError(null);
    setLoadingAction("end");
    try {
      await endShiftApi(token);
      await loadStatus();
      await loadSummary();
      await loadTodayPunches();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePrevMonth = () =>
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  return {
    // estado
    status,
    loadingAction,
    currentMonthDate,
    summary,
    rows,
    timelineEvents,
    todayPunchesRaw,
    todayWorkSeconds,
    error,
    isoFrom,
    isoTo,
    // acciones
    handleStart,
    handlePauseToggle,
    handleEnd,
    handlePrevMonth,
    handleNextMonth,
  };
};

