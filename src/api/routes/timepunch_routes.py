from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import CORS
from api.models import db, Employee, TimePunch, PunchType
from datetime import datetime, date, time, timedelta, timezone
from zoneinfo import ZoneInfo 
from api.utils_auth.helpers_auth import (
    get_jwt_company_id,
    is_admin_or_hr,
    is_ownerdb
)

time_punch_bp = Blueprint("time_punch_bp", __name__, url_prefix="/time-punch")
CORS(time_punch_bp)

def _now_utc() -> datetime:
    return datetime.now(timezone.utc)

def _ultimo_fichaje(employee_id: int) -> TimePunch | None:
    return db.session.execute(
        db.select(TimePunch)
        .where(TimePunch.employee_id == employee_id)
        .order_by(TimePunch.punched_at.desc())
        .limit(1)
    ).scalar_one_or_none()

DEBOUNCE_SECONDS = 2  # ventana anti-doble-click

def _ultimo_reciente(employee_id: int) -> TimePunch | None:
    ultimo = _ultimo_fichaje(employee_id)
    if not ultimo:
        return None
    delta = (_now_utc() - ultimo.punched_at).total_seconds()
    return ultimo if delta < DEBOUNCE_SECONDS else None


def _crear_fichaje(employee_id: int, punch_type: PunchType, note: str | None = None, at: datetime | None = None) -> TimePunch:
    """
    Crea el objeto TimePunch y lo añade a la sesión, PERO NO hace commit.
    El endpoint llamará a db.session.commit() cuando corresponda.
    """
    fichaje = TimePunch(
        employee_id=employee_id,
        punch_type=punch_type,
        punched_at=(at or _now_utc()),
        note=note,
    )
    db.session.add(fichaje)
    return fichaje



@time_punch_bp.route("/start", methods=["POST"])
@jwt_required()
def start_shift():
    employee_id = int(get_jwt_identity())
    empleado = db.session.get(Employee, employee_id)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404

    # Si el último fichaje es MUY reciente y ya es IN, tratamos como idempotente
    ultimo_reciente = _ultimo_reciente(employee_id)
    if ultimo_reciente and ultimo_reciente.punch_type == PunchType.IN:
        return jsonify({
            "ok": True,
            "punch": ultimo_reciente.serialize(),
            "idempotent": True
        }), 200

    ultimo = _ultimo_fichaje(employee_id)
    if ultimo and ultimo.punch_type != PunchType.OUT:
        return jsonify({"error": "Ya tienes un turno abierto"}), 409 

    try:
        note = (request.get_json(silent=True) or {}).get("note")
        fichaje = _crear_fichaje(employee_id, PunchType.IN, note=note)
        db.session.commit()
        return jsonify({"ok": True, "punch": fichaje.serialize()}), 201
    except Exception:
        db.session.rollback()
        return jsonify({"error": "No se pudo iniciar el turno"}), 500





@time_punch_bp.route("/pause-toggle", methods=["POST"])
@jwt_required()
def pause_toggle():
    employee_id = int(get_jwt_identity())
    empleado = db.session.get(Employee, employee_id)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404

    # Si el último fichaje es MUY reciente (cualquier tipo), ignora como doble click
    ultimo_reciente = _ultimo_reciente(employee_id)
    if ultimo_reciente:
        return jsonify({
            "ok": True,
            "punch": ultimo_reciente.serialize(),
            "idempotent": True
        }), 200

    ultimo = _ultimo_fichaje(employee_id)
    if not ultimo or ultimo.punch_type == PunchType.OUT:
        return jsonify({"error": "No hay turno en curso"}), 409

    try:
        note = (request.get_json(silent=True) or {}).get("note")
        if ultimo.punch_type in (PunchType.IN, PunchType.BREAK_END):
            fichaje = _crear_fichaje(employee_id, PunchType.BREAK_START, note=note)
        elif ultimo.punch_type == PunchType.BREAK_START:
            fichaje = _crear_fichaje(employee_id, PunchType.BREAK_END, note=note)
        else:
            return jsonify({"error": "Acción de pausa no válida en este estado"}), 409

        db.session.commit()
        return jsonify({"ok": True, "punch": fichaje.serialize()}), 201
    except Exception:
        db.session.rollback()
        return jsonify({"error": "No se pudo cambiar el estado de pausa"}), 500





@time_punch_bp.route("/end", methods=["POST"])
@jwt_required()
def end_shift():
    employee_id = int(get_jwt_identity())
    empleado = db.session.get(Employee, employee_id)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404

    # Si el último fichaje es OUT muy reciente, trata como idempotente
    ultimo_reciente = _ultimo_reciente(employee_id)
    if ultimo_reciente and ultimo_reciente.punch_type == PunchType.OUT:
        return jsonify({
            "ok": True,
            "punch": ultimo_reciente.serialize(),
            "idempotent": True
        }), 200

    ultimo = _ultimo_fichaje(employee_id)
    if not ultimo or ultimo.punch_type == PunchType.OUT:
        return jsonify({"error": "No hay turno en curso"}), 409

    created: list[TimePunch] = []
    try:
        body = request.get_json(silent=True) or {}
        note = body.get("note")

        # Si está en pausa, cerramos la pausa antes de cerrar el turno
        if ultimo.punch_type == PunchType.BREAK_START:
            cierre = _crear_fichaje(employee_id, PunchType.BREAK_END, note=note)
            created.append(cierre)

        cierre_turno = _crear_fichaje(employee_id, PunchType.OUT, note=note)
        created.append(cierre_turno)

        db.session.commit()
        return jsonify({"ok": True, "punches": [p.serialize() for p in created]}), 201
    except Exception:
        db.session.rollback()
        return jsonify({"error": "No se pudo cerrar el turno"}), 500





# (Opcional) estado para la UI: qué botones habilitar
@time_punch_bp.route("/status", methods=["GET"])
@jwt_required()
def status():
    employee_id = int(get_jwt_identity())
    ultimo = _ultimo_fichaje(employee_id)
    estado = {
        "open": bool(ultimo and ultimo.punch_type != PunchType.OUT),
        "paused": bool(ultimo and ultimo.punch_type == PunchType.BREAK_START),
        "last_type": (ultimo.punch_type.value if ultimo else None),
        "last_at": (ultimo.punched_at.isoformat() if ultimo else None)
    }
    return jsonify(estado), 200


def summarize_time_punches(
    employee_id: int,
    date_from: date,
    date_to: date,
    tz_name: str = "Europe/Madrid",
) -> dict:
    """
    Resume días trabajados y horas totales netas en [date_from, date_to] (ambos inclusive).
    - Cuenta un 'día trabajado' cuando hay una sesión completa IN→OUT.
    - Resta todos los intervalos de BREAK_START→BREAK_END.
    - Asigna la sesión al día local del IN (aunque cruce medianoche).
    """
    tz = ZoneInfo(tz_name)

    # Ventana local [00:00 del from, 00:00 del día siguiente a to) → convertida a UTC
    start_local = datetime.combine(date_from, time(0, 0), tzinfo=tz)
    end_local = datetime.combine(date_to + timedelta(days=1), time(0, 0), tzinfo=tz)
    start_utc = start_local.astimezone(timezone.utc)
    end_utc = end_local.astimezone(timezone.utc)

    punches = db.session.execute(
        db.select(TimePunch)
        .where(
            TimePunch.employee_id == employee_id,
            TimePunch.punched_at >= start_utc,
            TimePunch.punched_at < end_utc,
        )
        .order_by(TimePunch.punched_at.asc())
    ).scalars().all()

    sessions: list[dict] = []
    current_in: datetime | None = None
    current_break_start: datetime | None = None
    total_break: timedelta = timedelta(0)

    for p in punches:
        if p.punch_type == PunchType.IN:
            # Si había un IN colgado sin OUT anterior, lo descartamos empezando una nueva sesión
            current_in = p.punched_at
            current_break_start = None
            total_break = timedelta(0)

        elif p.punch_type == PunchType.BREAK_START:
            if current_in is not None and current_break_start is None:
                current_break_start = p.punched_at

        elif p.punch_type == PunchType.BREAK_END:
            if current_in is not None and current_break_start is not None:
                if p.punched_at > current_break_start:
                    total_break += p.punched_at - current_break_start
                current_break_start = None

        elif p.punch_type == PunchType.OUT:
            if current_in is not None:
                # Si hay una pausa abierta, la cerramos al momento del OUT
                if current_break_start is not None and p.punched_at > current_break_start:
                    total_break += p.punched_at - current_break_start
                    current_break_start = None

                gross = p.punched_at - current_in
                net = gross - total_break
                if net.total_seconds() > 0:
                    in_local = current_in.astimezone(tz)
                    out_local = p.punched_at.astimezone(tz)
                    sessions.append({
                        "date": in_local.date().isoformat(),
                        "in": in_local.isoformat(),
                        "out": out_local.isoformat(),
                        "gross_seconds": int(gross.total_seconds()),
                        "break_seconds": int(total_break.total_seconds()),
                        "net_seconds": int(net.total_seconds()),
                    })

                # Reset para la siguiente sesión
                current_in = None
                current_break_start = None
                total_break = timedelta(0)

    days_worked = len(sessions)
    total_seconds = sum(s["net_seconds"] for s in sessions)
    total_hours = round(total_seconds / 3600, 2)
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    human_total = f"{hours}h {minutes}m"

    return {
        "days_worked": days_worked,
        "total_seconds": total_seconds,
        "total_hours": total_hours,   # número decimal (2 decimales)
        "human_total": human_total,   # "Xh Ym"
        "sessions": sessions,         # detalle por sesión
    }



@time_punch_bp.route("/summary", methods=["GET"])
@jwt_required()
def time_punch_summary():
    requester_employee_id = int(get_jwt_identity())
    requested_employee_id_param = request.args.get("employee_id")

    # Por defecto, el resumen es del usuario logueado
    target_employee_id = requester_employee_id

    # Si piden otro empleado, solo lo permitimos para ADMIN/HR/OWNERDB
    if requested_employee_id_param is not None:
        if not (is_admin_or_hr() or is_ownerdb()):
            return jsonify({"error": "Forbidden"}), 403
        try:
            requested_employee_id = int(requested_employee_id_param)
        except (TypeError, ValueError):
            return jsonify({"error": "employee_id debe ser un entero"}), 400

        employee_target = db.session.get(Employee, requested_employee_id)
        if not employee_target:
            return jsonify({"error": "Empleado no encontrado"}), 404

        # Si NO eres OWNERDB, debes pertenecer a la misma company que el empleado solicitado
        if not is_ownerdb():
            requester_company_id = get_jwt_company_id()
            if requester_company_id is None or employee_target.company_id != requester_company_id:
                return jsonify({"error": "Forbidden: el empleado no pertenece a tu empresa"}), 403

        target_employee_id = requested_employee_id

    date_from_str = request.args.get("from")   # 'YYYY-MM-DD'
    date_to_str   = request.args.get("to")     # 'YYYY-MM-DD'
    tz_name       = request.args.get("tz", "Europe/Madrid")

    if not date_from_str or not date_to_str:
        return jsonify({"error": "Params 'from' y 'to' son requeridos (YYYY-MM-DD)."}), 400

    try:
        date_from = date.fromisoformat(date_from_str)
        date_to   = date.fromisoformat(date_to_str)
    except ValueError:
        return jsonify({"error": "Formato de fecha inválido. Usa YYYY-MM-DD."}), 400

    if date_from > date_to:
        return jsonify({"error": "'from' no puede ser mayor que 'to'."}), 400

    data = summarize_time_punches(target_employee_id, date_from, date_to, tz_name)
    # Si quieres, añade el empleado objetivo en la respuesta:
    data["employee_id"] = target_employee_id
    return jsonify(data), 200


@time_punch_bp.route("/list", methods=["GET"])
@jwt_required()
def time_punch_list():
    """
    Lista fichajes crudos en una ventana local [from, to] (ambos inclusivos),
    retornando timestamps en UTC y en la TZ solicitada (por defecto Europe/Madrid).
    Admin/HR/OwnerDB pueden pasar ?employee_id=; empleados ven solo los suyos.
    """
    requester_employee_id = int(get_jwt_identity())
    requested_employee_id_param = request.args.get("employee_id")
    tz_name = request.args.get("tz", "Europe/Madrid")
    date_from_str = request.args.get("from")  # 'YYYY-MM-DD'
    date_to_str   = request.args.get("to")    # 'YYYY-MM-DD'

    if not date_from_str or not date_to_str:
        return jsonify({"error": "Params 'from' y 'to' son requeridos (YYYY-MM-DD)."}), 400

    try:
        date_from = date.fromisoformat(date_from_str)
        date_to   = date.fromisoformat(date_to_str)
    except ValueError:
        return jsonify({"error": "Formato de fecha inválido. Usa YYYY-MM-DD."}), 400

    if date_from > date_to:
        return jsonify({"error": "'from' no puede ser mayor que 'to'."}), 400

    # Target employee resolver
    target_employee_id = requester_employee_id
    if requested_employee_id_param is not None:
        if not (is_admin_or_hr() or is_ownerdb()):
            return jsonify({"error": "Forbidden"}), 403
        try:
            requested_employee_id = int(requested_employee_id_param)
        except (TypeError, ValueError):
            return jsonify({"error": "employee_id debe ser un entero"}), 400
        employee_target = db.session.get(Employee, requested_employee_id)
        if not employee_target:
            return jsonify({"error": "Empleado no encontrado"}), 404
        if not is_ownerdb():
            requester_company_id = get_jwt_company_id()
            if requester_company_id is None or employee_target.company_id != requester_company_id:
                return jsonify({"error": "Forbidden: el empleado no pertenece a tu empresa"}), 403
        target_employee_id = requested_employee_id

    # Ventana local -> UTC
    tz = ZoneInfo(tz_name)
    start_local = datetime.combine(date_from, time(0, 0), tzinfo=tz)
    end_local   = datetime.combine(date_to + timedelta(days=1), time(0, 0), tzinfo=tz)
    start_utc = start_local.astimezone(timezone.utc)
    end_utc   = end_local.astimezone(timezone.utc)

    punches = db.session.execute(
        db.select(TimePunch)
        .where(
            TimePunch.employee_id == target_employee_id,
            TimePunch.punched_at >= start_utc,
            TimePunch.punched_at < end_utc,
        )
        .order_by(TimePunch.punched_at.asc())
    ).scalars().all()

    def to_local_iso(dt_aware):
        return dt_aware.astimezone(tz).isoformat()

    result = [
        {
            "id": p.id,
            "employee_id": p.employee_id,
            "punch_type": p.punch_type.value,
            "punched_at_utc": p.punched_at.astimezone(timezone.utc).isoformat(),
            "punched_at_local": to_local_iso(p.punched_at),
            "note": p.note,
        }
        for p in punches
    ]
    return jsonify({"employee_id": target_employee_id, "tz": tz_name, "punches": result}), 200