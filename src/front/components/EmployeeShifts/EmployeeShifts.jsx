// src/front/js/pages/EmployeeShifts.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Calendar } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getShiftTypes, listShifts } from "../../services/shiftsAPI";
import "./EmployeeShifts.css";

export const EmployeeShifts = () => {
  const { token } = useAuth();

  const [monthDate, setMonthDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [types, setTypes] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const WEEKDAYS_ES = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

  const pad2 = (n) => String(n).padStart(2, "0");
  const toISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const fmtYearMonth = (d) => `${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
  const mondayIndex = (jsDay) => (jsDay + 6) % 7;

  const parseISODateUTC = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  };
  const formatLocalDay = (iso, locale = "es-ES", tz = "Europe/Madrid") => {
    const dt = parseISODateUTC(iso);
    return new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      timeZone: tz,
    }).format(dt).replace(/\.$/, "");
  };
  const weekdayShort = (iso, locale = "es-ES", tz = "Europe/Madrid") => {
    const dt = parseISODateUTC(iso);
    return new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: tz })
      .format(dt)
      .replace(/\.$/, "");
  };

  const monthBounds = useMemo(() => {
    const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    return { first, last, fromISO: toISO(first), toISO: toISO(last) };
  }, [monthDate]);

  useEffect(() => {
    if (!token) return;
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [tList, shifts] = await Promise.all([
          getShiftTypes(token),
          listShifts({ from: monthBounds.fromISO, to: monthBounds.toISO, token }),
        ]);
        if (cancel) return;
        setTypes(tList || []);
        setItems(shifts || []);
      } catch (e) {
        if (!cancel) setError(e.message || "Error cargando turnos");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [token, monthBounds.fromISO, monthBounds.toISO]);

  const byDate = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      const k = it.date;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(it);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.start_time.localeCompare(b.start_time));
    return map;
  }, [items]);

  const legend = useMemo(() => {
    return types.map(t => ({ id: t.id, name: t.name, code: t.code, color: t.color_hex }));
  }, [types]);

  const monthCells = useMemo(() => {
    const cells = [];
    const { first, last } = monthBounds;
    const lead = mondayIndex(first.getDay());
    for (let i = 0; i < lead; i++) cells.push({ type: "empty", key: `e-${i}` });
    for (let day = 1; day <= last.getDate(); day++) {
      const d = new Date(first.getFullYear(), first.getMonth(), day);
      const iso = toISO(d);
      const dayShifts = byDate.get(iso) || [];
      cells.push({ type: "day", key: `d-${iso}`, dateISO: iso, dayNum: day, shifts: dayShifts });
    }
    const rem = cells.length % 7;
    if (rem !== 0) {
      const add = 7 - rem;
      for (let i = 0; i < add; i++) cells.push({ type: "empty", key: `t-${i}` });
    }
    return cells;
  }, [monthBounds, byDate]);

  const monthList = useMemo(() => {
    const list = [];
    const { first, last } = monthBounds;
    for (let day = 1; day <= last.getDate(); day++) {
      const d = new Date(first.getFullYear(), first.getMonth(), day);
      const iso = toISO(d);
      list.push({
        key: `ml-${iso}`,
        iso,
        dayNum: day,
        shifts: byDate.get(iso) || []
      });
    }
    return list;
  }, [monthBounds, byDate]);

  const upcoming = useMemo(() => {
    const todayISO = toISO(new Date());
    const future = items
      .filter(x => x.date >= todayISO)
      .slice(0)
      .sort((a, b) => (a.date === b.date ? a.start_time.localeCompare(b.start_time) : a.date.localeCompare(b.date)));
    return future.slice(0, 8);
  }, [items]);

  const moveMonth = (delta) => {
    const y = monthDate.getFullYear();
    const m = monthDate.getMonth();
    setMonthDate(new Date(y, m + delta, 1));
  };

  const typeFor = (shift) => shift?.type || null;
  const chipStyle = (shift) => {
    const t = typeFor(shift);
    return t?.color_hex ? { backgroundColor: t.color_hex } : {};
  };

  const headers = WEEKDAYS_ES.map((d) => (
    <div className="calendar-day-header" key={d}>{d}</div>
  ));

  const monthGrid = (
    <>
      {headers}
      {monthCells.map((cell) => {
        if (cell.type === "empty") return <div className="calendar-day empty" key={cell.key} />;
        return (
          <div className="calendar-day" key={cell.key}>
            <div className="day-number">{cell.dayNum}</div>
            {cell.shifts.map((sh, idx) => (
              <div
                key={idx}
                className={`shift-block${sh.generated ? " generated" : ""}`}
                title={`${(typeFor(sh)?.name || "Turno")} · ${sh.start_time}-${sh.end_time}`}
                style={chipStyle(sh)}
              >
                {sh.start_time}-{sh.end_time}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );

  const monthColumn = (
    <div className="month-list">
      {monthList.map((d) => (
        <div className="month-list-item" key={d.key}>
          <div className="ml-head">
            <span className="ml-weekday">{weekdayShort(d.iso)}</span>
            <span className="ml-daynum">{d.dayNum}</span>
          </div>

          <div className="ml-shifts">
            {d.shifts.length === 0 && <span className="shift-empty">Sin turnos</span>}
            {d.shifts.map((sh, idx) => (
              <div
                key={idx}
                className={`shift-block${sh.generated ? " generated" : ""}`}
                title={`${(typeFor(sh)?.name || "Turno")} · ${sh.start_time}-${sh.end_time}`}
                style={chipStyle(sh)}
              >
                {sh.start_time}-{sh.end_time}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="shifts-container">
      <div className="shifts-header">
        <div className="shifts-title">
          <div className="content-title">Mis Horarios</div>
          <p>Consulta tus horarios de trabajo del mes.</p>
        </div>
        <div className="month-selector">
          <button className="nav-btn" onClick={() => moveMonth(-1)}><ChevronLeft size={16} /></button>
          <span>{fmtYearMonth(monthDate)}</span>
          <button className="nav-btn" onClick={() => moveMonth(1)}><ChevronRight size={16} /></button>
        </div>
      </div>

      {loading && <div className="loading-row">Cargando horarios…</div>}
      {error && <div className="error-row">Error: {error}</div>}
      {!token && <div className="error-row">Inicia sesión para ver tus horarios.</div>}

      <div className="calendar-section">
        <div className="calendar-header">
          <Calendar size={20} />
          <h2>Calendario programado</h2>
        </div>

        {isMobile ? (
          <div className="month-list-wrapper">{monthColumn}</div>
        ) : (
          <div className="calendar-grid">{monthGrid}</div>
        )}

        <div className="calendar-legend">
          {legend.map((l) => (
            <div className="legend-item" key={l.id}>
              <div className="legend-dot" style={{ backgroundColor: l.color }} />
              <span>{l.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bottom-section">
        <div className="upcoming-shifts">
          <div className="section-header">
            <Clock size={20} />
            <h3>Próximos turnos</h3>
          </div>
          <div className="shifts-list">
            {upcoming.length === 0 && <div className="empty-hint">No hay turnos próximos en el rango.</div>}
            {upcoming.map((s, i) => (
              <div className="shift-item" key={`${s.date}-${s.start_time}-${i}`}>
                <div className="shift-info">
                  <h4>{formatLocalDay(s.date)}</h4>
                  <p>{s.start_time} - {s.end_time}</p>
                </div>
                <span className="shift-status" style={chipStyle(s)}>
                  {typeFor(s)?.name || "Turno"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
