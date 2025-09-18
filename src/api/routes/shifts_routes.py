from flask import jsonify, Blueprint, request
from api.models import db, Employee, Company, Role, Salary, Payroll, Shifts, ShiftType, ShiftSeries, ShiftException
from datetime import date, datetime, timedelta
from flask_cors import CORS
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.exc import IntegrityError
from api.utils_auth.helpers_auth import (
    get_jwt_company_id,
    get_system_role,
    is_admin_or_hr,
    current_employee_id,
    is_ownerdb
)


shift_bp = Blueprint('shift', __name__, url_prefix = '/shifts')

CORS(shift_bp)



# --- helpers básicos ---
def _parse_time_hhmm(s: str):
    return datetime.strptime(s, "%H:%M").time()

def _can_access_employee(target: Employee) -> bool:
    if is_ownerdb():
        return True
    if is_admin_or_hr():
        return target.company_id == get_jwt_company_id()
    try:
        return target.id == int(get_jwt_identity())
    except Exception:
        return False

def _overlaps(a_start, a_end, b_start, b_end) -> bool:
    # Intervalos [start, end); solapa si start < otro_end y otro_start < end
    return (a_start < b_end) and (b_start < a_end)

# Weekday mapping: bit0=Lun ... bit6=Dom
WD2BIT = {"MO":0, "TU":1, "WE":2, "TH":3, "FR":4, "SA":5, "SU":6}

def _weekdays_mask_from_list(lst: list[str]) -> int:
    m = 0
    for s in lst:
        bit = WD2BIT.get(s.upper())
        if bit is None:
            raise ValueError(f"weekday inválido: {s}")
        m |= (1 << bit)
    return m

def _weekday_bit_for_date(d: date) -> int:
    # Monday=0 .. Sunday=6
    return d.weekday()

def _weeks_between(monday0: date, d: date) -> int:
    # semanas enteras entre (alineando a lunes)
    base = monday0 - timedelta(days=monday0.weekday())  # lunes de la semana de monday0
    curr = d - timedelta(days=d.weekday())              # lunes de la semana de d
    return (curr - base).days // 7

# --- Shift types ---
@shift_bp.route("/types", methods=["GET"])
@jwt_required()
def list_shift_types():
    company_id = get_jwt_company_id()
    q = db.select(ShiftType).where(
        (ShiftType.company_id == company_id) | (ShiftType.company_id.is_(None))
    ).order_by(ShiftType.company_id.is_not(None), ShiftType.name.asc())
    items = db.session.execute(q).scalars().all()
    return jsonify([t.serialize() for t in items]), 200


# ========= SHIFTS (EXPRESOS) =========
@shift_bp.route("", methods=["GET"])
@jwt_required()
def list_shifts():
    """
    GET /api/shifts?from=YYYY-MM-DD&to=YYYY-MM-DD&employee_id=
    Devuelve turnos EXPRESOS + expansiones de SERIES (aplicando excepciones).
    Orden: date ASC, start_time ASC.
    Precedencia:
      - Si en una fecha hay turnos explícitos que SOLAPAN con una ocurrencia de serie, se omite esa ocurrencia.
      - Las excepciones 'cancel' eliminan la ocurrencia del día.
      - Las excepciones 'modify' cambian horas/tipo de la ocurrencia.
    V1: no cruzar medianoche (end_time > start_time).
    """
    requester_id = int(get_jwt_identity())
    emp_param = request.args.get("employee_id")
    from_str = request.args.get("from")
    to_str   = request.args.get("to")

    if not from_str or not to_str:
        return jsonify({"error": "Params 'from' y 'to' requeridos (YYYY-MM-DD)."}), 400

    try:
        d_from = date.fromisoformat(from_str)
        d_to   = date.fromisoformat(to_str)
    except ValueError:
        return jsonify({"error": "Fechas inválidas (usa YYYY-MM-DD)."}), 400
    if d_from > d_to:
        return jsonify({"error": "'from' no puede ser mayor que 'to'."}), 400

    # Target employee
    target_id = requester_id
    if emp_param is not None:
        try:
            wanted = int(emp_param)
        except ValueError:
            return jsonify({"error": "employee_id debe ser entero"}), 400
        emp = db.session.get(Employee, wanted)
        if not emp:
            return jsonify({"error": "Empleado no encontrado"}), 404
        if not _can_access_employee(emp):
            return jsonify({"error": "Forbidden"}), 403
        target_id = wanted
    else:
        emp = db.session.get(Employee, requester_id)
        if not emp:
            return jsonify({"error": "Empleado no encontrado"}), 404

    # 1) Shifts explícitos del rango
    explicit = db.session.execute(
        db.select(Shifts)
        .where(
            Shifts.employee_id == target_id,
            Shifts.date >= d_from,
            Shifts.date <= d_to,
        )
        .order_by(Shifts.date.asc(), Shifts.start_time.asc())
    ).scalars().all()

    explicit_serial = [s.serialize() for s in explicit]

    # preparar lookup por fecha para chequear solapamientos con series
    explicit_by_date: dict[str, list[tuple]] = {}
    for s in explicit:
        k = s.date.isoformat()
        explicit_by_date.setdefault(k, []).append((s.start_time, s.end_time))

    # 2) Series activas que intersecten el rango
    series = db.session.execute(
        db.select(ShiftSeries)
        .where(
            ShiftSeries.employee_id == target_id,
            ShiftSeries.active.is_(True),
            ShiftSeries.start_date <= d_to,
            ( (ShiftSeries.end_date.is_(None)) | (ShiftSeries.end_date >= d_from) )
        )
    ).scalars().all()

    # precargar excepciones de las series en rango
    series_ids = [s.id for s in series]
    exceptions_by_series_date: dict[tuple[int, str], ShiftException] = {}
    if series_ids:
        exs = db.session.execute(
            db.select(ShiftException)
            .where(
                ShiftException.series_id.in_(series_ids),
                ShiftException.date >= d_from,
                ShiftException.date <= d_to,
            )
        ).scalars().all()
        for ex in exs:
            key = (ex.series_id, ex.date.isoformat())
            exceptions_by_series_date[key] = ex

    # expandir series
    expanded = []
    for ser in series:
        # límites del loop
        start = max(ser.start_date, d_from)
        end   = min(ser.end_date or d_to, d_to)
        if end < start:
            continue

        # pre-chequeos
        if ser.end_time <= ser.start_time:
            # V1: no cruzar medianoche
            continue
        if ser.weekdays_mask <= 0:
            continue
        if ser.interval_weeks <= 0:
            continue

        day = start
        while day <= end:
            # filtra por weekday
            bit = _weekday_bit_for_date(day)  # 0..6 (Lun..Dom)
            if (ser.weekdays_mask & (1 << bit)) != 0:
                # respeta intervalo de semanas
                weeks = _weeks_between(ser.start_date, day)
                if weeks % ser.interval_weeks == 0:
                    key = (ser.id, day.isoformat())
                    ex = exceptions_by_series_date.get(key)

                    if ex and ex.action == "cancel":
                        pass  # omitimos
                    else:
                        # datos base
                        s_time = ser.start_time
                        e_time = ser.end_time
                        type_id = ser.type_id

                        # aplica modify
                        if ex and ex.action == "modify":
                            if ex.new_start_time: s_time = ex.new_start_time
                            if ex.new_end_time:   e_time = ex.new_end_time
                            if ex.new_type_id:    type_id = ex.new_type_id
                            # V1: si queda inconsistente, omitimos
                            if e_time <= s_time:
                                day += timedelta(days=1)
                                continue

                        # evitar solapamiento con explícitos de ese día
                        overlaps_explicit = False
                        for (a_start, a_end) in explicit_by_date.get(day.isoformat(), []):
                            if _overlaps(s_time, e_time, a_start, a_end):
                                overlaps_explicit = True
                                break
                        if overlaps_explicit:
                            day += timedelta(days=1)
                            continue

                        # cargar tipo (para color) solo si necesario
                        stype = db.session.get(ShiftType, type_id)

                        expanded.append({
                            "id": None,  # ocurrencia generada
                            "company_id": ser.company_id,
                            "employee_id": ser.employee_id,
                            "date": day.isoformat(),
                            "start_time": s_time.strftime("%H:%M"),
                            "end_time": e_time.strftime("%H:%M"),
                            "type": stype.serialize() if stype else None,
                            "notes": ser.notes,
                            "status": "planned",
                            "generated": True,
                            "series_id": ser.id,
                        })
            day += timedelta(days=1)

    # combinar y ordenar
    all_items = explicit_serial + expanded
    all_items.sort(key=lambda x: (x["date"], x["start_time"]))
    return jsonify(all_items), 200


@shift_bp.route("", methods=["POST"])
@jwt_required()
def create_shift():
    """
    POST /api/shifts
    Body:
    - date (YYYY-MM-DD)            [req]
    - start_time (HH:MM)           [req]
    - end_time (HH:MM)             [req]
    - type_id (int)                [req]
    - employee_id (int)            [opcional -> si falta se toma del JWT]
    - notes (str)                  [opcional]
    - status (str: planned/...)    [opcional]
    """
    data = request.get_json(silent=True) or {}

    # employee_id: si no viene, usamos el del token
    emp_id_raw = data.get("employee_id")
    if emp_id_raw is None:
        try:
            emp_id = int(get_jwt_identity())
        except Exception:
            return jsonify({"error": "No se pudo resolver el empleado del token"}), 401
    else:
        try:
            emp_id = int(emp_id_raw)
        except (TypeError, ValueError):
            return jsonify({"error": "employee_id inválido"}), 400

    date_str  = data.get("date")
    start_str = data.get("start_time")
    end_str   = data.get("end_time")
    type_id_raw = data.get("type_id")
    notes   = data.get("notes")
    status  = data.get("status", "planned")

    if not all([date_str, start_str, end_str, type_id_raw]):
        return jsonify({"error": "Campos requeridos: date, start_time, end_time, type_id"}), 400

    # Entidades y permisos
    emp = db.session.get(Employee, emp_id)
    if not emp:
        return jsonify({"error": "Empleado no encontrado"}), 404
    if not _can_access_employee(emp):
        return jsonify({"error": "Forbidden"}), 403

    try:
        d = date.fromisoformat(date_str)
    except ValueError:
        return jsonify({"error": "date inválida (YYYY-MM-DD)"}), 400
    try:
        t_start = _parse_time_hhmm(start_str)
        t_end   = _parse_time_hhmm(end_str)
    except Exception:
        return jsonify({"error": "start_time/end_time inválidos (HH:MM)"}), 400
    if t_end <= t_start:
        return jsonify({"error": "end_time debe ser mayor que start_time (V1 no cruza medianoche)"}), 400

    try:
        type_id = int(type_id_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "type_id inválido"}), 400
    stype = db.session.get(ShiftType, type_id)
    if not stype:
        return jsonify({"error": "type_id inválido"}), 400
    if stype.company_id not in (None, emp.company_id):
        return jsonify({"error": "El tipo de turno no pertenece a tu empresa"}), 400

    # Anti-solapamiento en el mismo día
    existing = db.session.execute(
        db.select(Shifts).where(
            Shifts.employee_id == emp.id,
            Shifts.date == d
        )
    ).scalars().all()
    for e in existing:
        if _overlaps(t_start, t_end, e.start_time, e.end_time):
            return jsonify({"error": "Conflicto: se solapa con otro turno existente en ese día"}), 409

    # Crear turno
    s = Shifts(
        company_id=emp.company_id,
        employee_id=emp.id,
        date=d,
        start_time=t_start,
        end_time=t_end,
        type_id=stype.id,
        notes=notes,
        status=status,
    )
    db.session.add(s)
    db.session.commit()
    db.session.refresh(s)
    return jsonify(s.serialize()), 201



@shift_bp.route("/<int:shift_id>", methods=["PUT"])
@jwt_required()
def update_shift(shift_id: int):
    """
    PUT /api/shifts/:id
    body: puede incluir cualquiera de: { date, start_time, end_time, type_id, notes, status }
    """
    s = db.session.get(Shifts, shift_id)
    if not s:
        return jsonify({"error": "Turno no encontrado"}), 404

    emp = db.session.get(Employee, s.employee_id)
    if not _can_access_employee(emp):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(silent=True) or {}
    # valores por defecto actuales
    d = s.date
    t_start = s.start_time
    t_end = s.end_time
    type_id = s.type_id
    notes = data.get("notes", s.notes)
    status = data.get("status", s.status)

    # parse condicional
    if "date" in data:
        try: d = date.fromisoformat(data["date"])
        except: return jsonify({"error": "date inválida"}), 400
    if "start_time" in data:
        try: t_start = _parse_time_hhmm(data["start_time"])
        except: return jsonify({"error": "start_time inválido"}), 400
    if "end_time" in data:
        try: t_end = _parse_time_hhmm(data["end_time"])
        except: return jsonify({"error": "end_time inválido"}), 400
    if "type_id" in data:
        try:
            type_id = int(data["type_id"])
        except:
            return jsonify({"error": "type_id inválido"}), 400

    # V1 no cruzar medianoche
    if t_end <= t_start:
        return jsonify({"error": "end_time debe ser mayor que start_time"}), 400

    stype = db.session.get(ShiftType, type_id)
    if not stype:
        return jsonify({"error": "type_id inválido"}), 400
    if stype.company_id not in (None, emp.company_id):
        return jsonify({"error": "El tipo de turno no pertenece a tu empresa"}), 400

    # anti-solapamiento (excluye este turno)
    existing = db.session.execute(
        db.select(Shifts).where(
            Shifts.employee_id == emp.id,
            Shifts.date == d,
            Shifts.id != s.id
        )
    ).scalars().all()
    for e in existing:
        if _overlaps(t_start, t_end, e.start_time, e.end_time):
            return jsonify({"error": "Conflicto: se solapa con otro turno existente en ese día"}), 409

    # aplicar cambios
    s.date = d
    s.start_time = t_start
    s.end_time = t_end
    s.type_id = type_id
    s.notes = notes
    s.status = status
    db.session.commit()
    db.session.refresh(s)
    return jsonify(s.serialize()), 200


@shift_bp.route("/<int:shift_id>", methods=["DELETE"])
@jwt_required()
def delete_shift(shift_id: int):
    """
    DELETE /api/shifts/:id
    """
    s = db.session.get(Shifts, shift_id)
    if not s:
        return jsonify({"error": "Turno no encontrado"}), 404
    emp = db.session.get(Employee, s.employee_id)
    if not _can_access_employee(emp):
        return jsonify({"error": "Forbidden"}), 403
    db.session.delete(s)
    db.session.commit()
    return jsonify({"ok": True}), 200


# ========= SERIES =========
@shift_bp.route("/series", methods=["POST"])
@jwt_required()
def create_series():
    """
    body: {
      employee_id, type_id,
      start_date, end_date|null,
      start_time, end_time,
      weekdays: ["MO","TU","WE","TH","FR"],  // obligatorio
      interval_weeks: 1,                     // >=1
      tz_name: "Europe/Madrid",              // opcional
      notes
    }
    """
    data = request.get_json(silent=True) or {}
    emp_id = data.get("employee_id")
    type_id = data.get("type_id")
    start_date = data.get("start_date")
    end_date = data.get("end_date")
    start_time = data.get("start_time")
    end_time = data.get("end_time")
    weekdays = data.get("weekdays", [])
    interval_weeks = int(data.get("interval_weeks", 1))
    tz_name = data.get("tz_name", "Europe/Madrid")
    notes = data.get("notes")

    if not all([emp_id, type_id, start_date, start_time, end_time]) or not weekdays:
        return jsonify({"error": "Faltan campos: employee_id, type_id, start_date, start_time, end_time, weekdays[]"}), 400

    emp = db.session.get(Employee, int(emp_id))
    if not emp:
        return jsonify({"error": "Empleado no encontrado"}), 404
    if not _can_access_employee(emp):
        return jsonify({"error": "Forbidden"}), 403

    stype = db.session.get(ShiftType, int(type_id))
    if not stype:
        return jsonify({"error": "type_id inválido"}), 400
    if stype.company_id not in (None, emp.company_id):
        return jsonify({"error": "El tipo de turno no pertenece a tu empresa"}), 400

    try:
        d_start = date.fromisoformat(start_date)
        d_end = date.fromisoformat(end_date) if end_date else None
        t_start = _parse_time_hhmm(start_time)
        t_end   = _parse_time_hhmm(end_time)
        mask = _weekdays_mask_from_list(weekdays)
    except Exception as e:
        return jsonify({"error": f"Parámetros inválidos: {e}"}), 400

    if d_end and d_end < d_start:
        return jsonify({"error": "end_date no puede ser menor que start_date"}), 400
    if t_end <= t_start:
        return jsonify({"error": "end_time debe ser mayor que start_time (V1 no cruza medianoche)"}), 400
    if interval_weeks < 1:
        return jsonify({"error": "interval_weeks debe ser >= 1"}), 400
    if mask <= 0:
        return jsonify({"error": "weekdays inválidos"}), 400

    ser = ShiftSeries(
        company_id=emp.company_id,
        employee_id=emp.id,
        type_id=stype.id,
        start_date=d_start,
        end_date=d_end,
        start_time=t_start,
        end_time=t_end,
        weekdays_mask=mask,
        interval_weeks=interval_weeks,
        tz_name=tz_name,
        notes=notes,
        active=True,
    )
    db.session.add(ser)
    db.session.commit()
    db.session.refresh(ser)
    return jsonify(ser.serialize()), 201


@shift_bp.route("/series", methods=["GET"])
@jwt_required()
def list_series():
    """
    GET /api/shifts/series?employee_id=
    Lista series del empleado (por defecto, el propio).
    """
    requester_id = int(get_jwt_identity())
    emp_param = request.args.get("employee_id")
    target_id = requester_id

    if emp_param is not None:
        try:
            wanted = int(emp_param)
        except ValueError:
            return jsonify({"error": "employee_id debe ser entero"}), 400
        emp = db.session.get(Employee, wanted)
        if not emp:
            return jsonify({"error": "Empleado no encontrado"}), 404
        if not _can_access_employee(emp):
            return jsonify({"error": "Forbidden"}), 403
        target_id = wanted

    items = db.session.execute(
        db.select(ShiftSeries).where(ShiftSeries.employee_id == target_id).order_by(ShiftSeries.start_date.desc())
    ).scalars().all()
    return jsonify([s.serialize() for s in items]), 200


@shift_bp.route("/series/<int:series_id>", methods=["PUT"])
@jwt_required()
def update_series(series_id: int):
    """
    PUT /api/shifts/series/:id
    body: cualquiera de { type_id, start_date, end_date, start_time, end_time, weekdays, interval_weeks, tz_name, notes, active }
    """
    ser = db.session.get(ShiftSeries, series_id)
    if not ser:
        return jsonify({"error": "Serie no encontrada"}), 404

    emp = db.session.get(Employee, ser.employee_id)
    if not _can_access_employee(emp):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(silent=True) or {}

    type_id = ser.type_id
    d_start = ser.start_date
    d_end = ser.end_date
    t_start = ser.start_time
    t_end = ser.end_time
    mask = ser.weekdays_mask
    interval_weeks = ser.interval_weeks
    tz_name = data.get("tz_name", ser.tz_name)
    notes = data.get("notes", ser.notes)
    active = bool(data.get("active", ser.active))

    if "type_id" in data:
        try: type_id = int(data["type_id"])
        except: return jsonify({"error": "type_id inválido"}), 400

    if "start_date" in data:
        try: d_start = date.fromisoformat(data["start_date"])
        except: return jsonify({"error": "start_date inválida"}), 400
    if "end_date" in data:
        v = data["end_date"]
        if v is None:
            d_end = None
        else:
            try: d_end = date.fromisoformat(v)
            except: return jsonify({"error": "end_date inválida"}), 400

    if "start_time" in data:
        try: t_start = _parse_time_hhmm(data["start_time"])
        except: return jsonify({"error": "start_time inválido"}), 400
    if "end_time" in data:
        try: t_end = _parse_time_hhmm(data["end_time"])
        except: return jsonify({"error": "end_time inválido"}), 400

    if "weekdays" in data:
        try: mask = _weekdays_mask_from_list(data["weekdays"])
        except Exception as e:
            return jsonify({"error": f"weekdays inválidos: {e}"}), 400

    if "interval_weeks" in data:
        try:
            interval_weeks = int(data["interval_weeks"])
        except:
            return jsonify({"error": "interval_weeks inválido"}), 400

    # Validaciones
    stype = db.session.get(ShiftType, type_id)
    if not stype:
        return jsonify({"error": "type_id inválido"}), 400
    if stype.company_id not in (None, ser.company_id):
        return jsonify({"error": "El tipo no pertenece a tu empresa"}), 400
    if d_end and d_end < d_start:
        return jsonify({"error": "end_date no puede ser menor que start_date"}), 400
    if t_end <= t_start:
        return jsonify({"error": "end_time debe ser mayor que start_time (V1 no cruza medianoche)"}), 400
    if interval_weeks < 1:
        return jsonify({"error": "interval_weeks debe ser >= 1"}), 400
    if mask <= 0:
        return jsonify({"error": "weekdays inválidos"}), 400

    ser.type_id = type_id
    ser.start_date = d_start
    ser.end_date = d_end
    ser.start_time = t_start
    ser.end_time = t_end
    ser.weekdays_mask = mask
    ser.interval_weeks = interval_weeks
    ser.tz_name = tz_name
    ser.notes = notes
    ser.active = active

    db.session.commit()
    db.session.refresh(ser)
    return jsonify(ser.serialize()), 200


@shift_bp.route("/series/<int:series_id>", methods=["DELETE"])
@jwt_required()
def delete_series(series_id: int):
    """
    DELETE /api/shifts/series/:id
    Borra la serie y sus excepciones (cascade).
    """
    ser = db.session.get(ShiftSeries, series_id)
    if not ser:
        return jsonify({"error": "Serie no encontrada"}), 404
    emp = db.session.get(Employee, ser.employee_id)
    if not _can_access_employee(emp):
        return jsonify({"error": "Forbidden"}), 403
    db.session.delete(ser)
    db.session.commit()
    return jsonify({"ok": True}), 200


# ========= EXCEPCIONES =========
@shift_bp.route("/series/<int:series_id>/exceptions", methods=["POST"])
@jwt_required()
def upsert_exception(series_id: int):
    """
    Crea o actualiza una excepción para una fecha concreta.
    body: { date:'YYYY-MM-DD', action:'cancel'|'modify', new_start_time?, new_end_time?, new_type_id?, note? }
    """
    ser = db.session.get(ShiftSeries, series_id)
    if not ser:
        return jsonify({"error": "Serie no encontrada"}), 404

    emp = db.session.get(Employee, ser.employee_id)
    if not _can_access_employee(emp):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(silent=True) or {}
    date_str = data.get("date")
    action = data.get("action")
    new_start = data.get("new_start_time")
    new_end = data.get("new_end_time")
    new_type_id = data.get("new_type_id")
    note = data.get("note")

    if not date_str or action not in ("cancel", "modify"):
        return jsonify({"error": "Campos requeridos: date y action ('cancel'|'modify')"}), 400

    try:
        d = date.fromisoformat(date_str)
    except Exception:
        return jsonify({"error": "date inválida"}), 400

    if action == "modify":
        if not any([new_start, new_end, new_type_id]):
            return jsonify({"error": "Modificar requiere new_start_time y/o new_end_time y/o new_type_id"}), 400
        if new_start:
            try: _parse_time_hhmm(new_start)
            except: return jsonify({"error": "new_start_time inválido"}), 400
        if new_end:
            try: _parse_time_hhmm(new_end)
            except: return jsonify({"error": "new_end_time inválido"}), 400
        if new_start and new_end and _parse_time_hhmm(new_end) <= _parse_time_hhmm(new_start):
            return jsonify({"error": "new_end_time debe ser > new_start_time"}), 400
        if new_type_id:
            st = db.session.get(ShiftType, int(new_type_id))
            if not st:
                return jsonify({"error": "new_type_id inválido"}), 400
            if st.company_id not in (None, ser.company_id):
                return jsonify({"error": "El tipo no pertenece a tu empresa"}), 400

    # upsert (única por serie+fecha)
    ex = db.session.execute(
        db.select(ShiftException).where(ShiftException.series_id == ser.id, ShiftException.date == d)
    ).scalar_one_or_none()
    if not ex:
        ex = ShiftException(series_id=ser.id, date=d, action=action)
        db.session.add(ex)

    ex.action = action
    ex.note = note
    ex.new_start_time = _parse_time_hhmm(new_start) if new_start else None
    ex.new_end_time   = _parse_time_hhmm(new_end) if new_end else None
    ex.new_type_id    = int(new_type_id) if new_type_id else None

    db.session.commit()
    db.session.refresh(ex)
    return jsonify(ex.serialize()), 201


@shift_bp.route("/series/<int:series_id>/exceptions", methods=["DELETE"])
@jwt_required()
def delete_exception_by_series_date(series_id: int):
    """
    DELETE /api/shifts/series/:series_id/exceptions?date=YYYY-MM-DD
    Elimina la excepción de ese día para la serie dada.
    """
    ser = db.session.get(ShiftSeries, series_id)
    if not ser:
        return jsonify({"error": "Serie no encontrada"}), 404
    emp = db.session.get(Employee, ser.employee_id)
    if not _can_access_employee(emp):
        return jsonify({"error": "Forbidden"}), 403

    date_str = request.args.get("date")
    if not date_str:
        return jsonify({"error": "Query param 'date' requerido (YYYY-MM-DD)"}), 400
    try:
        d = date.fromisoformat(date_str)
    except:
        return jsonify({"error": "date inválida"}), 400

    ex = db.session.execute(
        db.select(ShiftException).where(ShiftException.series_id == series_id, ShiftException.date == d)
    ).scalar_one_or_none()
    if not ex:
        return jsonify({"error": "Excepción no encontrada"}), 404

    db.session.delete(ex)
    db.session.commit()
    return jsonify({"ok": True}), 200


@shift_bp.route("/exceptions/<int:ex_id>", methods=["DELETE"])
@jwt_required()
def delete_exception_by_id(ex_id: int):
    """
    DELETE /api/shifts/exceptions/:id
    Borra una excepción por su id.
    """
    ex = db.session.get(ShiftException, ex_id)
    if not ex:
        return jsonify({"error": "Excepción no encontrada"}), 404
    ser = db.session.get(ShiftSeries, ex.series_id)
    emp = db.session.get(Employee, ser.employee_id)
    if not _can_access_employee(emp):
        return jsonify({"error": "Forbidden"}), 403
    db.session.delete(ex)
    db.session.commit()
    return jsonify({"ok": True}), 200