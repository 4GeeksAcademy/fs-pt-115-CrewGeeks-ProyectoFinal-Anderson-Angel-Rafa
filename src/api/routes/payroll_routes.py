from flask import jsonify, Blueprint, request
from api.models import db, Employee, Company, Role, Salary, Payroll
from flask_cors import CORS
from flask_jwt_extended import get_jwt_identity, jwt_required, get_jwt
from sqlalchemy.exc import IntegrityError
from api.utils_auth.helpers_auth import (
    get_jwt_company_id,
    get_system_role,
    is_admin_or_hr,
    current_employee_id,
    is_ownerdb,
)


payroll_bp = Blueprint("payroll", __name__, url_prefix="/payroll")

CORS(payroll_bp)


# Todos los payrolls por empresa y rol
@payroll_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_payrolls():
    if is_ownerdb():
        cid_param = request.args.get("company_id")
        if cid_param is not None:
            try:
                cid = int(cid_param)
            except (TypeError, ValueError):
                return jsonify({"error": "company_id must be an integer"}), 400
            payrolls = (
                db.session.execute(db.select(Payroll).where(Payroll.company_id == cid))
                .scalars()
                .all()
            )
        else:
            payrolls = db.session.execute(db.select(Payroll)).scalars().all()
        return jsonify([p.serialize() for p in payrolls]), 200

    # ADMIN/HR: solo su empresa | EMPLOYEE: solo las suyas
    company_id = get_jwt_company_id()
    if company_id is None:
        return jsonify({"error": "Unauthorized"}), 401

    if is_admin_or_hr():
        payrolls = (
            db.session.execute(
                db.select(Payroll).where(Payroll.company_id == company_id)
            )
            .scalars()
            .all()
        )
    else:
        payrolls = (
            db.session.execute(
                db.select(Payroll).where(
                    Payroll.company_id == company_id,
                    Payroll.employee_id == current_employee_id(),
                )
            )
            .scalars()
            .all()
        )

    return jsonify([p.serialize() for p in payrolls]), 200


# Obtener payroll por id, empresa y propiedad
@payroll_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_payroll(id):
    payroll = db.session.get(Payroll, id)
    if not payroll:
        return jsonify({"error": "Payroll not found"}), 404

    # OWNERDB: puede ver cualquier nómina (de cualquier empresa)
    if is_ownerdb():
        return jsonify(payroll.serialize()), 200

    # Resto de roles: validar empresa del JWT
    company_id = get_jwt_company_id()
    if company_id is None or payroll.company_id != company_id:
        return jsonify({"error": "Payroll not found"}), 404

    # EMPLOYEE: solo la suya; ADMIN/HR: cualquiera de su empresa
    if not is_admin_or_hr() and payroll.employee_id != current_employee_id():
        return jsonify({"error": "Payroll not found"}), 404

    return jsonify(payroll.serialize()), 200


# Crear payroll (solo ADMIN/HR)
@payroll_bp.route("/", methods=["POST"])
@jwt_required()
def create_payroll():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    # --- validar employee_id
    try:
        employee_id_body = int(data.get("employee_id"))
    except (TypeError, ValueError):
        return jsonify({"error": "employee_id must be an integer"}), 400

    # --- validar periodo
    try:
        period_year = int(data.get("period_year"))
        period_month = int(data.get("period_month"))
    except (TypeError, ValueError):
        return jsonify({"error": "period_year and period_month must be integers"}), 400

    if period_year < 1900 or period_year > 2100:
        return jsonify({"error": "period_year must be between 1900 and 2100"}), 400
    if period_month < 1 or period_month > 12:
        return jsonify({"error": "period_month must be between 1 and 12"}), 400

    # ----- OWNERDB: puede crear para cualquier empleado (de cualquier empresa)
    if is_ownerdb():
        employee_target = db.session.get(Employee, employee_id_body)
        if not employee_target:
            return jsonify({"error": "Employee not found"}), 404

        # company_id opcional en body: si viene debe coincidir con el del empleado
        company_id_body = data.get("company_id")
        if company_id_body is not None:
            try:
                company_id_body = int(company_id_body)
            except (TypeError, ValueError):
                return jsonify({"error": "company_id must be an integer"}), 400
            if company_id_body != employee_target.company_id:
                return (
                    jsonify({"error": "company_id does not match employee's company"}),
                    400,
                )
            target_company_id = company_id_body
        else:
            target_company_id = employee_target.company_id

    else:
        # ----- ADMIN/HR: solo dentro de su empresa; EMPLOYEE: prohibido
        if not is_admin_or_hr():
            return jsonify({"error": "Forbidden"}), 403

        target_company_id = get_jwt_company_id()
        if target_company_id is None:
            return jsonify({"error": "Unauthorized"}), 401

        employee_target = db.session.get(Employee, employee_id_body)
        if not employee_target or employee_target.company_id != target_company_id:
            return jsonify({"error": "Employee not found"}), 404

    # --- evitar duplicados (misma persona y mismo periodo)
    existing = db.session.execute(
        db.select(Payroll).where(
            Payroll.employee_id == employee_target.id,
            Payroll.period_year == period_year,
            Payroll.period_month == period_month,
        )
    ).scalar_one_or_none()
    if existing:
        return jsonify({"error": "Payroll for this period already exists"}), 409

    payroll = Payroll(
        company_id=target_company_id,
        employee_id=employee_target.id,
        period_year=period_year,
        period_month=period_month,
    )

    try:
        db.session.add(payroll)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error creating payroll"}), 400

    return jsonify(payroll.serialize()), 201


# Actualizar payroll (solo ADMIN/HR)
@payroll_bp.route("/edit/<int:id>", methods=["PUT"])
@jwt_required()
def update_payroll(id):
    payroll = db.session.get(Payroll, id)
    if not payroll:
        return jsonify({"error": "Payroll not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    # Valores propuestos (con defaults del registro actual)
    new_employee_id = data.get("employee_id", payroll.employee_id)
    new_period_year = data.get("period_year", payroll.period_year)
    new_period_month = data.get("period_month", payroll.period_month)

    # Casts
    try:
        new_employee_id = int(new_employee_id)
        new_period_year = int(new_period_year)
        new_period_month = int(new_period_month)
    except (TypeError, ValueError):
        return (
            jsonify(
                {"error": "employee_id, period_year and period_month must be integers"}
            ),
            400,
        )

    # Validaciones de rango
    if not (1 <= new_period_month <= 12):
        return jsonify({"error": "period_month must be between 1 and 12"}), 400
    if new_period_year < 1900 or new_period_year > 2100:
        return jsonify({"error": "period_year must be between 1900 and 2100"}), 400

    # Permisos + scoping
    if is_ownerdb():
        # OWNERDB: cualquier empresa/empleado
        employee_target = db.session.get(Employee, new_employee_id)
        if not employee_target:
            return jsonify({"error": "Employee not found"}), 404

        # company_id opcional en body, debe coincidir si viene
        if "company_id" in data:
            try:
                body_company_id = int(data["company_id"])
            except (TypeError, ValueError):
                return jsonify({"error": "company_id must be an integer"}), 400
            if body_company_id != employee_target.company_id:
                return (
                    jsonify({"error": "company_id does not match employee's company"}),
                    400,
                )

        target_company_id = employee_target.company_id

    else:
        # ADMIN/HR: solo dentro de su empresa
        if not is_admin_or_hr():
            return jsonify({"error": "Forbidden"}), 403

        company_id = get_jwt_company_id()
        if company_id is None:
            return jsonify({"error": "Unauthorized"}), 401

        # La nómina que editamos debe ser de mi empresa
        if payroll.company_id != company_id:
            return jsonify({"error": "Payroll not found"}), 404

        # No permitir mover de empresa
        if "company_id" in data:
            try:
                body_company_id = int(data["company_id"])
            except (TypeError, ValueError):
                return jsonify({"error": "company_id must be an integer"}), 400
            if body_company_id != company_id:
                return (
                    jsonify({"error": "You cannot move payrolls to another company"}),
                    403,
                )

        # El empleado destino debe ser de mi empresa
        employee_target = db.session.get(Employee, new_employee_id)
        if not employee_target or employee_target.company_id != company_id:
            return jsonify({"error": "Employee not found"}), 404

        target_company_id = company_id  # se mantiene

    # ---- ÚNICO check de duplicado (empleado + periodo) ----
    if (
        new_employee_id != payroll.employee_id
        or new_period_year != payroll.period_year
        or new_period_month != payroll.period_month
    ):
        existing = db.session.execute(
            db.select(Payroll).where(
                Payroll.employee_id == new_employee_id,
                Payroll.period_year == new_period_year,
                Payroll.period_month == new_period_month,
            )
        ).scalar_one_or_none()
        if existing and existing.id != payroll.id:
            return (
                jsonify(
                    {"error": "Another payroll exists for this employee and period"}
                ),
                409,
            )

    # Aplicar cambios (asegura company_id consistente con el empleado destino)
    payroll.employee_id = new_employee_id
    payroll.company_id = target_company_id
    payroll.period_year = new_period_year
    payroll.period_month = new_period_month

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error updating payroll"}), 400

    return jsonify(payroll.serialize()), 200


# Borrar payroll (solo ADMIN / HR)
@payroll_bp.route("/delete/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_payroll(id):
    payroll = db.session.get(Payroll, id)
    if not payroll:
        return jsonify({"error": "Payroll not found"}), 404

    # OWNERDB: puede borrar cualquier payroll (de cualquier empresa)
    if is_ownerdb():
        try:
            db.session.delete(payroll)
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({"error": "Integrity error deleting payroll"}), 400
        return jsonify({"message": "Payroll successfully deleted"}), 200

    # Resto de roles
    if not is_admin_or_hr():
        return jsonify({"error": "Forbidden"}), 403

    company_id = get_jwt_company_id()
    if company_id is None or payroll.company_id != company_id:
        return jsonify({"error": "Payroll not found"}), 404

    try:
        db.session.delete(payroll)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error deleting payroll"}), 400

    return jsonify({"message": "Payroll successfully deleted"}), 200
