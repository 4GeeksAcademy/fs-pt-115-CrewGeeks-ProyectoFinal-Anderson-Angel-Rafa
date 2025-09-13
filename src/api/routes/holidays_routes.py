from flask import jsonify, Blueprint, request
from api.models import db, Employee, Company, Role, Salary, Payroll, Shifts, Holidays
from flask_cors import CORS
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.exc import IntegrityError
from api.utils_auth.helpers_auth import (
    get_jwt_company_id,
    is_admin_or_hr,
    current_employee_id,
    is_ownerdb
)


holidays_bp = Blueprint('holidays', __name__, url_prefix = '/holidays')

CORS(holidays_bp)




#con esto podemos listar holidays por empresa + rol
# GET /holidays/ 
# - OWNERDB: ve TODAS las holidays (todas las empresas). Opcional: ?company_id=N para filtrar.
# - ADMIN/HR: ve todas las de su empresa (company_id del JWT).
# - EMPLOYEE: ve solo las suyas (en su empresa).
@holidays_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_holidays():
    if is_ownerdb():
        company_id_param = request.args.get("company_id")
        if company_id_param is not None:
            try:
                cid = int(company_id_param)
            except (TypeError, ValueError):
                return jsonify({"error": "company_id must be an integer"}), 400
            holidays = db.session.execute(
                db.select(Holidays).where(Holidays.company_id == cid)
            ).scalars().all()
        else:
            holidays = db.session.execute(db.select(Holidays)).scalars().all()
        return jsonify([h.serialize() for h in holidays]), 200

    company_id = get_jwt_company_id()
    if company_id is None:
        return jsonify({"error": "Unauthorized"}), 401

    if is_admin_or_hr():
        holidays = db.session.execute(
            db.select(Holidays).where(Holidays.company_id == company_id)
        ).scalars().all()
    else:
        holidays = db.session.execute(
            db.select(Holidays).where(
                Holidays.company_id == company_id,
                Holidays.employee_id == current_employee_id(),
            )
        ).scalars().all()

    return jsonify([h.serialize() for h in holidays]), 200





#Aqui cogemos las holidays del empleado, si no existe o pertenece a otra empresa 404, o si no pertenece a ese empleado 404
@holidays_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_holiday(id):
    holiday = db.session.get(Holidays, id)
    if not holiday:
        return jsonify({"error": "Holiday request not found"}), 404

    # OWNERDB puede ver cualquier solicitud (cualquier empresa)
    if is_ownerdb():
        return jsonify(holiday.serialize()), 200

    # Resto de roles: validar empresa del JWT
    company_id = get_jwt_company_id()
    if company_id is None or holiday.company_id != company_id:
        return jsonify({"error": "Holiday request not found"}), 404

    # EMPLOYEE solo puede ver las suyas
    if not is_admin_or_hr() and holiday.employee_id != current_employee_id():
        return jsonify({"error": "Holiday request not found"}), 404

    return jsonify(holiday.serialize()), 200




# Aqui 
# Employee puede crearse a si mismo con status "PENDING"
# ADMIN puede crear para cualquier empleado de la empresa
@holidays_bp.route("/", methods=["POST"])
@jwt_required()
def create_holiday():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    start_date = data.get("start_date")
    end_date = data.get("end_date")
    remaining_days = data.get("remaining_days")
    if start_date is None or end_date is None or remaining_days is None:
        return jsonify({"error": "Missing required fields: start_date, end_date, remaining_days"}), 400

    try:
        remaining_days = int(remaining_days)
    except (TypeError, ValueError):
        return jsonify({"error": "remaining_days must be an integer"}), 400

    # ----- OWNERDB: puede crear para cualquier empleado de cualquier empresa
    if is_ownerdb():
        try:
            employee_id_body = int(data.get("employee_id"))
        except (TypeError, ValueError):
            return jsonify({"error": "employee_id must be an integer"}), 400

        employee_target = db.session.get(Employee, employee_id_body)
        if not employee_target:
            return jsonify({"error": "Employee not found"}), 404

        # company_id opcional en body: si viene debe coincidir con el del empleado; si no, se infiere
        company_id_body = data.get("company_id")
        if company_id_body is not None:
            try:
                company_id_body = int(company_id_body)
            except (TypeError, ValueError):
                return jsonify({"error": "company_id must be an integer"}), 400
            if company_id_body != employee_target.company_id:
                return jsonify({"error": "company_id does not match employee's company"}), 400
            target_company_id = company_id_body
        else:
            target_company_id = employee_target.company_id

        status_value = data.get("status") or "PENDING"

        approved_user_id_value = data.get("approved_user_id")
        if approved_user_id_value is not None:
            try:
                approved_user_id_value = int(approved_user_id_value)
            except (TypeError, ValueError):
                return jsonify({"error": "approved_user_id must be an integer"}), 400
            approved_user = db.session.get(Employee, approved_user_id_value)
            if not approved_user or approved_user.company_id != target_company_id:
                return jsonify({"error": "approved_user_id must belong to the same company"}), 400
        else:
            approved_user_id_value = None

        new_holiday = Holidays(
            company_id=target_company_id,
            employee_id=employee_target.id,
            start_date=start_date,
            end_date=end_date,
            status=status_value,
            approved_user_id=approved_user_id_value,
            remaining_days=remaining_days,
        )

    else:
        # ----- Resto de roles: scoping por empresa del JWT
        company_id = get_jwt_company_id()
        if company_id is None:
            return jsonify({"error": "Unauthorized"}), 401

        if is_admin_or_hr():
            # Admin/HR: puede crear para cualquier empleado de SU empresa
            try:
                employee_id_body = int(data.get("employee_id"))
            except (TypeError, ValueError):
                return jsonify({"error": "employee_id must be an integer"}), 400

            employee_target = db.session.get(Employee, employee_id_body)
            if not employee_target or employee_target.company_id != company_id:
                return jsonify({"error": "Employee not found"}), 404

            status_value = data.get("status") or "PENDING"

            approved_user_id_value = data.get("approved_user_id")
            if approved_user_id_value is not None:
                try:
                    approved_user_id_value = int(approved_user_id_value)
                except (TypeError, ValueError):
                    return jsonify({"error": "approved_user_id must be an integer"}), 400
                approved_user = db.session.get(Employee, approved_user_id_value)
                if not approved_user or approved_user.company_id != company_id:
                    return jsonify({"error": "approved_user_id must belong to the same company"}), 400
            else:
                approved_user_id_value = None

            new_holiday = Holidays(
                company_id=company_id,
                employee_id=employee_target.id,
                start_date=start_date,
                end_date=end_date,
                status=status_value,
                approved_user_id=approved_user_id_value,
                remaining_days=remaining_days,
            )

        else:
            # Employee: solo puede crearse la suya
            me = current_employee_id()

            # Si el body trae employee_id, debe coincidir con el del token
            if data.get("employee_id") is not None:
                try:
                    employee_id_body = int(data.get("employee_id"))
                except (TypeError, ValueError):
                    return jsonify({"error": "employee_id must be an integer"}), 400
                if employee_id_body != me:
                    return jsonify({"error": "You can only create holidays for yourself"}), 403

            # Comprobar que el empleado existe y pertenece a la empresa del JWT
            employee_me = db.session.get(Employee, me)
            if not employee_me or employee_me.company_id != company_id:
                return jsonify({"error": "Employee not found"}), 404

            new_holiday = Holidays(
                company_id=company_id,
                employee_id=me,
                start_date=start_date,
                end_date=end_date,
                status="PENDING",
                approved_user_id=None,
                remaining_days=remaining_days,
            )

    try:
        db.session.add(new_holiday)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error creating holiday"}), 400

    return jsonify(new_holiday.serialize()), 201




# Employee puede editar solo la suya y solo si esta PENDING
# ADMIN/HR puede cambiar estatus y todo
@holidays_bp.route("/edit/<int:id>", methods=["PUT"])
@jwt_required()
def update_holiday(id):
    holiday = db.session.get(Holidays, id)
    if not holiday:
        return jsonify({"error": "Holiday request not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    # ------- OWNERDB: puede editar cualquier holiday (todas las empresas)
    if is_ownerdb():
        # Fechas
        if "start_date" in data:
            holiday.start_date = data["start_date"]
        if "end_date" in data:
            holiday.end_date = data["end_date"]

        # Status
        if "status" in data:
            st = (data["status"] or "").strip().upper()
            holiday.status = st

        # approved_user_id: debe pertenecer a la MISMA empresa del holiday
        if "approved_user_id" in data:
            approved_user_id_value = data["approved_user_id"]
            if approved_user_id_value is not None:
                try:
                    approved_user_id_value = int(approved_user_id_value)
                except (TypeError, ValueError):
                    return jsonify({"error": "approved_user_id must be an integer"}), 400
                approved_user = db.session.get(Employee, approved_user_id_value)
                if not approved_user or approved_user.company_id != holiday.company_id:
                    return jsonify({"error": "approved_user_id must belong to the same company"}), 400
            holiday.approved_user_id = approved_user_id_value

        # remaining_days
        if "remaining_days" in data:
            try:
                remaining = int(data["remaining_days"])
            except (TypeError, ValueError):
                return jsonify({"error": "remaining_days must be an integer"}), 400
            if remaining < 0:
                return jsonify({"error": "remaining_days cannot be negative"}), 400
            holiday.remaining_days = remaining

        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({"error": "Integrity error updating holiday"}), 400

        return jsonify(holiday.serialize()), 200

    # ------- Resto de roles: scoping por empresa del JWT
    company_id = get_jwt_company_id()
    if company_id is None or holiday.company_id != company_id:
        return jsonify({"error": "Holiday request not found"}), 404

    # ------- ADMIN/HR: pueden editar dentro de su empresa
    if is_admin_or_hr():
        if "start_date" in data:
            holiday.start_date = data["start_date"]
        if "end_date" in data:
            holiday.end_date = data["end_date"]
        if "status" in data:
            st = (data["status"] or "").strip().upper()
            holiday.status = st

        if "approved_user_id" in data:
            approved_user_id_value = data["approved_user_id"]
            if approved_user_id_value is not None:
                try:
                    approved_user_id_value = int(approved_user_id_value)
                except (TypeError, ValueError):
                    return jsonify({"error": "approved_user_id must be an integer"}), 400
                approved_user = db.session.get(Employee, approved_user_id_value)
                if not approved_user or approved_user.company_id != company_id:
                    return jsonify({"error": "approved_user_id must belong to the same company"}), 400
            holiday.approved_user_id = approved_user_id_value

        if "remaining_days" in data:
            try:
                remaining = int(data["remaining_days"])
            except (TypeError, ValueError):
                return jsonify({"error": "remaining_days must be an integer"}), 400
            if remaining < 0:
                return jsonify({"error": "remaining_days cannot be negative"}), 400
            holiday.remaining_days = remaining

        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({"error": "Integrity error updating holiday"}), 400

        return jsonify(holiday.serialize()), 200

    # ------- EMPLOYEE: solo suya y solo si está PENDING; puede cambiar fechas
    if holiday.employee_id != current_employee_id():
        return jsonify({"error": "Holiday request not found"}), 404
    if (holiday.status or "").strip().upper() != "PENDING":
        return jsonify({"error": "Only PENDING requests can be edited by the employee"}), 403

    if "start_date" in data:
        holiday.start_date = data["start_date"]
    if "end_date" in data:
        holiday.end_date = data["end_date"]

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error updating holiday"}), 400

    return jsonify(holiday.serialize()), 200




#Delete
#EMPLOYEE solo las suyas y solo si estan PENDING
#ADMIN/HR puede borrar dentro de su empresa
@holidays_bp.route("/delete/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_holiday(id):
    holiday = db.session.get(Holidays, id)
    if not holiday:
        return jsonify({"error": "Holiday request not found"}), 404

    # OWNERDB: puede borrar cualquier holiday (de cualquier empresa)
    if is_ownerdb():
        try:
            db.session.delete(holiday)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({"error": "Integrity error deleting holiday"}), 400
        return jsonify({"message": "Holiday successfully deleted"}), 200

    # Resto de roles: scoping por empresa del JWT
    company_id = get_jwt_company_id()
    if company_id is None or holiday.company_id != company_id:
        return jsonify({"error": "Holiday request not found"}), 404

    if is_admin_or_hr():
        # ADMIN/HR: pueden borrar dentro de su empresa
        pass
    else:
        # EMPLOYEE: solo sus holidays y solo si están PENDING
        if holiday.employee_id != current_employee_id():
            return jsonify({"error": "Holiday request not found"}), 404
        if (holiday.status or "").strip().upper() != "PENDING":
            return jsonify({"error": "Only PENDING requests can be deleted by the employee"}), 403

    try:
        db.session.delete(holiday)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error deleting holiday"}), 400

    return jsonify({"message": "Holiday successfully deleted"}), 200

