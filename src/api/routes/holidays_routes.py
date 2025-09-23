# api/routers/holidays.py
from flask import jsonify, Blueprint, request
from api.models import db, Employee, Company, Role, Salary, Payroll, Shifts, Holidays, VacationBalance
from flask_cors import CORS
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, and_, or_, func
from datetime import date, datetime
from api.utils_auth.helpers_auth import (
    get_jwt_company_id,
    is_admin_or_hr,
    current_employee_id,
    is_ownerdb
)
from api.utils_auth.utils_vacations import HolidayStatus, business_days

holidays_bp = Blueprint('holidays', __name__, url_prefix='/holidays')
CORS(holidays_bp)

# ---------- helpers internos ----------

def _parse_iso(d: str) -> date | None:
    try:
        y, m, d = d.split("-")
        return date(int(y), int(m), int(d))
    except Exception:
        return None

def _overlaps(emp_id: int, start: date, end: date, company_id: int, exclude_id: int | None = None) -> bool:
    # """
    # Devuelve True si hay solape con otra solicitud del mismo empleado en estados relevantes.
    # Reglas: Solapa con PENDING o APPROVED.
    # """
    q = select(Holidays).where(
        Holidays.company_id == company_id,
        Holidays.employee_id == emp_id,
        Holidays.status.in_([HolidayStatus.PENDING, HolidayStatus.APPROVED]),
        and_(Holidays.start_date <= end, Holidays.end_date >= start),
    )
    if exclude_id is not None:
        q = q.where(Holidays.id != exclude_id)
    return db.session.execute(q).first() is not None

def _get_or_create_balance(company_id: int, employee_id: int, year: int) -> VacationBalance:
    vb = db.session.execute(
        select(VacationBalance).where(
            VacationBalance.company_id == company_id,
            VacationBalance.employee_id == employee_id,
            VacationBalance.year == year
        )
    ).scalar_one_or_none()
    if vb is None:
        vb = VacationBalance(
            company_id=company_id,
            employee_id=employee_id,
            year=year,
            allocated_days=22,  # default
            used_days=0
        )
        db.session.add(vb)
        db.session.flush()
    return vb

def _pending_days(company_id: int, employee_id: int, year: int, exclude_id: int | None = None) -> int:
    q = select(Holidays.requested_days).where(
        Holidays.company_id == company_id,
        Holidays.employee_id == employee_id,
        Holidays.status == HolidayStatus.PENDING,
        Holidays.start_date >= date(year, 1, 1),
        Holidays.end_date <= date(year, 12, 31),
    )
    if exclude_id is not None:
        q = q.where(Holidays.id != exclude_id)
    rows = db.session.execute(q).all()
    return sum(r[0] or 0 for r in rows)

# ---------- LISTADOS EXISTENTES ----------

@holidays_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_holidays():
    status_param = (request.args.get("status") or "").strip().upper()
    status_filter = None
    if status_param in {e.value for e in HolidayStatus}:
        status_filter = getattr(HolidayStatus, status_param, None)

    if is_ownerdb():
        company_id_param = request.args.get("company_id")
        stmt = select(Holidays)
        if company_id_param is not None:
            try:
                cid = int(company_id_param)
            except (TypeError, ValueError):
                return jsonify({"error": "company_id must be an integer"}), 400
            stmt = stmt.where(Holidays.company_id == cid)
        if status_filter:
            stmt = stmt.where(Holidays.status == status_filter)
        holidays = db.session.execute(stmt).scalars().all()
        return jsonify([h.serialize() for h in holidays]), 200

    company_id = get_jwt_company_id()
    if company_id is None:
        return jsonify({"error": "Unauthorized"}), 401

    if is_admin_or_hr():
        stmt = select(Holidays).where(Holidays.company_id == company_id)
        if status_filter:
            stmt = stmt.where(Holidays.status == status_filter)
        holidays = db.session.execute(stmt).scalars().all()
    else:
        stmt = select(Holidays).where(
            Holidays.company_id == company_id,
            Holidays.employee_id == current_employee_id(),
        )
        if status_filter:
            stmt = stmt.where(Holidays.status == status_filter)
        holidays = db.session.execute(stmt).scalars().all()

    return jsonify([h.serialize() for h in holidays]), 200

@holidays_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_holiday(id):
    holiday = db.session.get(Holidays, id)
    if not holiday:
        return jsonify({"error": "Holiday request not found"}), 404

    if is_ownerdb():
        return jsonify(holiday.serialize()), 200

    company_id = get_jwt_company_id()
    if company_id is None or holiday.company_id != company_id:
        return jsonify({"error": "Holiday request not found"}), 404

    if not is_admin_or_hr() and holiday.employee_id != current_employee_id():
        return jsonify({"error": "Holiday request not found"}), 404

    return jsonify(holiday.serialize()), 200

# ----------  Balance del empleado ----------

@holidays_bp.route("/balance/me", methods=["GET"])
@jwt_required()
def get_my_balance():
    company_id = get_jwt_company_id()
    if company_id is None:
        return jsonify({"error": "Unauthorized"}), 401

    emp_id = current_employee_id()
    year = int(request.args.get("year") or date.today().year)

    vb = _get_or_create_balance(company_id, emp_id, year)
    pending = _pending_days(company_id, emp_id, year)
    remaining = max(0, (vb.allocated_days or 0) - (vb.used_days or 0) - pending)
    payload = vb.serialize()
    payload.update({
        "pending_days": pending,
        "remaining_days": remaining
    })
    return jsonify(payload), 200

# endpoint admin/hr para ajustar allocated_days
@holidays_bp.route("/balance/allocate", methods=["PUT"])
@jwt_required()
def set_allocation():
    if not (is_admin_or_hr() or is_ownerdb()):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(silent=True) or {}
    try:
        employee_id_body = int(data.get("employee_id"))
        year = int(data.get("year") or date.today().year)
        allocated = int(data.get("allocated_days"))
    except (TypeError, ValueError):
        return jsonify({"error": "employee_id, year, allocated_days must be integers"}), 400

    # OWNERDB puede cualquier empresa; ADMIN/HR limitado a su empresa
    employee = db.session.get(Employee, employee_id_body)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    if not is_ownerdb():
        company_id = get_jwt_company_id()
        if company_id is None or employee.company_id != company_id:
            return jsonify({"error": "Forbidden"}), 403
    target_company_id = employee.company_id

    vb = _get_or_create_balance(target_company_id, employee_id_body, year)
    vb.allocated_days = allocated

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error updating allocation"}), 400

    pending = _pending_days(target_company_id, employee_id_body, year)
    remaining = max(0, (vb.allocated_days or 0) - (vb.used_days or 0) - pending)
    payload = vb.serialize()
    payload.update({"pending_days": pending, "remaining_days": remaining})
    return jsonify(payload), 200

# ---------- CREAR SOLICITUD ----------

@holidays_bp.route("/", methods=["POST"])
@jwt_required()
def create_holiday():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    start_iso = data.get("start_date")
    end_iso = data.get("end_date")
    reason = (data.get("reason") or "").strip()

    start_d = _parse_iso(start_iso)
    end_d = _parse_iso(end_iso)
    if not start_d or not end_d:
        return jsonify({"error": "start_date and end_date must be YYYY-MM-DD"}), 400
    if end_d < start_d:
        return jsonify({"error": "end_date must be >= start_date"}), 400

    if is_ownerdb():
        try:
            employee_id_body = int(data.get("employee_id"))
        except (TypeError, ValueError):
            return jsonify({"error": "employee_id must be an integer"}), 400

        employee_target = db.session.get(Employee, employee_id_body)
        if not employee_target:
            return jsonify({"error": "Employee not found"}), 404

        target_company_id = employee_target.company_id
        target_employee_id = employee_target.id
    else:
        company_id = get_jwt_company_id()
        if company_id is None:
            return jsonify({"error": "Unauthorized"}), 401

        if is_admin_or_hr():
            try:
                employee_id_body = int(data.get("employee_id"))
            except (TypeError, ValueError):
                return jsonify({"error": "employee_id must be an integer"}), 400
            employee_target = db.session.get(Employee, employee_id_body)
            if not employee_target or employee_target.company_id != company_id:
                return jsonify({"error": "Employee not found"}), 404
            target_company_id = company_id
            target_employee_id = employee_target.id
        else:
            target_company_id = company_id
            target_employee_id = current_employee_id()
            # si envían employee_id diferente, bloqueamos
            if data.get("employee_id") is not None:
                try:
                    eid = int(data.get("employee_id"))
                except (TypeError, ValueError):
                    return jsonify({"error": "employee_id must be an integer"}), 400
                if eid != target_employee_id:
                    return jsonify({"error": "You can only create holidays for yourself"}), 403

    # Solapes
    if _overlaps(target_employee_id, start_d, end_d, target_company_id):
        return jsonify({"error": "The selected range overlaps with another request"}), 409

    # Días solicitados (laborables)
    req_days = business_days(start_d, end_d)
    if req_days <= 0:
        return jsonify({"error": "Requested days must be > 0 (business days)"}), 400

    # Balance (año por start_date)
    year = start_d.year
    vb = _get_or_create_balance(target_company_id, target_employee_id, year)
    pending_others = _pending_days(target_company_id, target_employee_id, year)
    remaining = (vb.allocated_days or 0) - (vb.used_days or 0) - pending_others

    if req_days > remaining:
        return jsonify({"error": "Insufficient remaining days for this request"}), 409

    new_holiday = Holidays(
        company_id=target_company_id,
        employee_id=target_employee_id,
        start_date=start_d,
        end_date=end_d,
        status=HolidayStatus.PENDING,
        approved_user_id=None,
        requested_days=req_days,
        reason=reason or None,
    )

    try:
        db.session.add(new_holiday)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error creating holiday"}), 400

    return jsonify(new_holiday.serialize()), 201

# ---------- EDITAR ----------

@holidays_bp.route("/edit/<int:id>", methods=["PUT"])
@jwt_required()
def update_holiday(id):
    holiday = db.session.get(Holidays, id)
    if not holiday:
        return jsonify({"error": "Holiday request not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    # OWNERDB: todo dentro de la empresa del holiday
    if is_ownerdb():
        start_iso = data.get("start_date")
        end_iso = data.get("end_date")
        reason = data.get("reason")
        status_in = (data.get("status") or "").strip().upper()

        if start_iso is not None:
            sd = _parse_iso(start_iso)
            if not sd:
                return jsonify({"error": "start_date must be YYYY-MM-DD"}), 400
            holiday.start_date = sd
        if end_iso is not None:
            ed = _parse_iso(end_iso)
            if not ed:
                return jsonify({"error": "end_date must be YYYY-MM-DD"}), 400
            holiday.end_date = ed
        if reason is not None:
            holiday.reason = (reason or "").strip() or None

        # Si cambiaron fechas, recalcular y validar solape
        if holiday.end_date < holiday.start_date:
            return jsonify({"error": "end_date must be >= start_date"}), 400
        if _overlaps(holiday.employee_id, holiday.start_date, holiday.end_date, holiday.company_id, exclude_id=holiday.id):
            return jsonify({"error": "The selected range overlaps with another request"}), 409
        holiday.requested_days = business_days(holiday.start_date, holiday.end_date)

        # Cambio de status directo
        if status_in in {e.value for e in HolidayStatus}:
            holiday.status = getattr(HolidayStatus, status_in)

        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({"error": "Integrity error updating holiday"}), 400

        return jsonify(holiday.serialize()), 200

    # Empresa
    company_id = get_jwt_company_id()
    if company_id is None or holiday.company_id != company_id:
        return jsonify({"error": "Holiday request not found"}), 404

    # ADMIN/HR pueden editar todo
    if is_admin_or_hr():
        start_iso = data.get("start_date")
        end_iso = data.get("end_date")
        reason = data.get("reason")
        status_in = (data.get("status") or "").strip().upper()

        if start_iso is not None:
            sd = _parse_iso(start_iso)
            if not sd:
                return jsonify({"error": "start_date must be YYYY-MM-DD"}), 400
            holiday.start_date = sd
        if end_iso is not None:
            ed = _parse_iso(end_iso)
            if not ed:
                return jsonify({"error": "end_date must be YYYY-MM-DD"}), 400
            holiday.end_date = ed
        if reason is not None:
            holiday.reason = (reason or "").strip() or None

        if holiday.end_date < holiday.start_date:
            return jsonify({"error": "end_date must be >= start_date"}), 400
        if _overlaps(holiday.employee_id, holiday.start_date, holiday.end_date, holiday.company_id, exclude_id=holiday.id):
            return jsonify({"error": "The selected range overlaps with another request"}), 409
        holiday.requested_days = business_days(holiday.start_date, holiday.end_date)

        if status_in in {e.value for e in HolidayStatus}:
            holiday.status = getattr(HolidayStatus, status_in)

        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({"error": "Integrity error updating holiday"}), 400

        return jsonify(holiday.serialize()), 200

    # EMPLOYEE: solo si es suya y está PENDING; solo fechas y reason
    if holiday.employee_id != current_employee_id():
        return jsonify({"error": "Holiday request not found"}), 404
    if holiday.status != HolidayStatus.PENDING:
        return jsonify({"error": "Only PENDING requests can be edited by the employee"}), 403

    start_iso = data.get("start_date")
    end_iso = data.get("end_date")
    reason = data.get("reason")

    if start_iso is not None:
        sd = _parse_iso(start_iso)
        if not sd:
            return jsonify({"error": "start_date must be YYYY-MM-DD"}), 400
        holiday.start_date = sd
    if end_iso is not None:
        ed = _parse_iso(end_iso)
        if not ed:
            return jsonify({"error": "end_date must be YYYY-MM-DD"}), 400
        holiday.end_date = ed
    if reason is not None:
        holiday.reason = (reason or "").strip() or None

    if holiday.end_date < holiday.start_date:
        return jsonify({"error": "end_date must be >= start_date"}), 400
    if _overlaps(holiday.employee_id, holiday.start_date, holiday.end_date, holiday.company_id, exclude_id=holiday.id):
        return jsonify({"error": "The selected range overlaps with another request"}), 409
    holiday.requested_days = business_days(holiday.start_date, holiday.end_date)

    # saldo
    year = holiday.start_date.year
    vb = _get_or_create_balance(holiday.company_id, holiday.employee_id, year)
    pending_others = _pending_days(holiday.company_id, holiday.employee_id, year, exclude_id=holiday.id)
    remaining = (vb.allocated_days or 0) - (vb.used_days or 0) - pending_others
    if holiday.requested_days > remaining:
        return jsonify({"error": "Insufficient remaining days for this request"}), 409

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error updating holiday"}), 400

    return jsonify(holiday.serialize()), 200

# ---------- BORRAR ----------

@holidays_bp.route("/delete/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_holiday(id):
    holiday = db.session.get(Holidays, id)
    if not holiday:
        return jsonify({"error": "Holiday request not found"}), 404

    if is_ownerdb():
        try:
            db.session.delete(holiday)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({"error": "Integrity error deleting holiday"}), 400
        return jsonify({"message": "Holiday successfully deleted"}), 200

    company_id = get_jwt_company_id()
    if company_id is None or holiday.company_id != company_id:
        return jsonify({"error": "Holiday request not found"}), 404

    if is_admin_or_hr():
        # puedes restringir aquí si no quieres borrar APPROVED; sugerencia: preferir CANCELLED
        pass
    else:
        if holiday.employee_id != current_employee_id():
            return jsonify({"error": "Holiday request not found"}), 404
        if holiday.status != HolidayStatus.PENDING:
            return jsonify({"error": "Only PENDING requests can be deleted by the employee"}), 403

    try:
        db.session.delete(holiday)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error deleting holiday"}), 400

    return jsonify({"message": "Holiday successfully deleted"}), 200

# ---------- ENDPOINTS de decisión ----------

@holidays_bp.route("/<int:id>/approve", methods=["POST"])
@jwt_required()
def approve_holiday(id):
    if not (is_admin_or_hr() or is_ownerdb()):
        return jsonify({"error": "Forbidden"}), 403

    holiday = db.session.get(Holidays, id)
    if not holiday:
        return jsonify({"error": "Holiday request not found"}), 404

    # scope empresa salvo OWNERDB
    if not is_ownerdb():
        company_id = get_jwt_company_id()
        if company_id is None or holiday.company_id != company_id:
            return jsonify({"error": "Holiday request not found"}), 404

    if holiday.status != HolidayStatus.PENDING:
        return jsonify({"error": "Only PENDING requests can be approved"}), 400

    # Revalidar fechas, solape y saldo
    if holiday.end_date < holiday.start_date:
        return jsonify({"error": "Invalid date range"}), 400
    if _overlaps(holiday.employee_id, holiday.start_date, holiday.end_date, holiday.company_id, exclude_id=holiday.id):
        return jsonify({"error": "The selected range overlaps with another request"}), 409

    # Recalcular por seguridad
    holiday.requested_days = business_days(holiday.start_date, holiday.end_date)
    if holiday.requested_days <= 0:
        return jsonify({"error": "Requested days must be > 0"}), 400

    year = holiday.start_date.year
    vb = _get_or_create_balance(holiday.company_id, holiday.employee_id, year)
    pending_others = _pending_days(holiday.company_id, holiday.employee_id, year, exclude_id=holiday.id)
    remaining = (vb.allocated_days or 0) - (vb.used_days or 0) - pending_others
    if holiday.requested_days > remaining:
        return jsonify({"error": "Insufficient remaining days to approve"}), 409

    # Aprobar: consumir saldo
    holiday.status = HolidayStatus.APPROVED
    # registra el aprobador; usa func.now() para timezone-aware en DB
    approver_id = current_employee_id() if not is_ownerdb() else current_employee_id()
    holiday.approved_user_id = approver_id
    holiday.approved_at = func.now()

    vb.used_days = (vb.used_days or 0) + holiday.requested_days
    # No tocamos vb.updated_at: lo actualiza el server_onupdate

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error approving holiday"}), 400

    return jsonify(holiday.serialize()), 200

@holidays_bp.route("/<int:id>/reject", methods=["POST"])
@jwt_required()
def reject_holiday(id):
    if not (is_admin_or_hr() or is_ownerdb()):
        return jsonify({"error": "Forbidden"}), 403

    holiday = db.session.get(Holidays, id)
    if not holiday:
        return jsonify({"error": "Holiday request not found"}), 404

    if not is_ownerdb():
        company_id = get_jwt_company_id()
        if company_id is None or holiday.company_id != company_id:
            return jsonify({"error": "Holiday request not found"}), 404

    if holiday.status != HolidayStatus.PENDING:
        return jsonify({"error": "Only PENDING requests can be rejected"}), 400

    holiday.status = HolidayStatus.REJECTED
    holiday.approved_user_id = current_employee_id()
    holiday.approved_at = func.now()

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error rejecting holiday"}), 400

    return jsonify(holiday.serialize()), 200


