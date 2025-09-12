from flask import jsonify, Blueprint, request
from api.models import db, Employee, Company, Role, Salary, Payroll, Shifts
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




# AQUI ADMIN/HR/OWNERDB LISTAN TODOS LOS TURNOS DE SU EMPRESA
# EMPLOYEE LISTA SUS PROPIOS TURNOS
@shift_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_shifts():
    company_id = get_jwt_company_id()
    if company_id is None:
        return jsonify({"error": "Unauthorized"}), 401

    if is_admin_or_hr() or is_ownerdb():
        shifts = db.session.execute(
            db.select(Shifts).where(Shifts.company_id == company_id)
        ).scalars().all()
    else:
        shifts = db.session.execute(
            db.select(Shifts).where(
                Shifts.company_id == company_id,
                Shifts.employee_id == current_employee_id(),
            )
        ).scalars().all()

    return jsonify([s.serialize() for s in shifts]), 200





# AQUI NO TE SALEN SI NO PERTENECEN A TU EMPRESA
@shift_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_shift(id):
    company_id = get_jwt_company_id()
    if company_id is None:
        return jsonify({"error": "Unauthorized"}), 401

    shift = db.session.get(Shifts, id)
    if not shift or shift.company_id != company_id:
        return jsonify({"error": "Shift not found"}), 404

    if not (is_admin_or_hr() or is_ownerdb()) and shift.employee_id != current_employee_id():
        return jsonify({"error": "Shift not found"}), 404

    return jsonify(shift.serialize()), 200




# AQUI SOLO PUEDEN CREAR TURNOS ADMIN/HR/OWNERDB
@shift_bp.route("/", methods=["POST"])
@jwt_required()
def create_shift():
    if not (is_admin_or_hr() or is_ownerdb()):
        return jsonify({"error": "Forbidden"}), 403

    company_id = get_jwt_company_id()
    if company_id is None:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    shift_type = (data.get("shift_type") or "").strip()
    if not shift_type:
        return jsonify({"error": "shift_type required"}), 400

    try:
        employee_id_body = int(data.get("employee_id"))
    except (TypeError, ValueError):
        return jsonify({"error": "employee_id must be an integer"}), 400

    employee_target = db.session.get(Employee, employee_id_body)
    if not employee_target or employee_target.company_id != company_id:
        return jsonify({"error": "Employee not found"}), 404

    shift = Shifts(
        company_id=company_id,
        employee_id=employee_target.id,
        shift_type=shift_type,
    )

    try:
        db.session.add(shift)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error creating shift"}), 400

    return jsonify(shift.serialize()), 201





# AQUI SOLO PUEDEN EDITAR ADMIN HR OWNERDB
@shift_bp.route("/edit/<int:id>", methods=["PUT"])
@jwt_required()
def update_shift(id):
    if not (is_admin_or_hr() or is_ownerdb()):
        return jsonify({"error": "Forbidden"}), 403

    company_id = get_jwt_company_id()
    if company_id is None:
        return jsonify({"error": "Unauthorized"}), 401

    shift = db.session.get(Shifts, id)
    if not shift or shift.company_id != company_id:
        return jsonify({"error": "Shift not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    if "employee_id" in data:
        try:
            new_emp_id = int(data["employee_id"])
        except (TypeError, ValueError):
            return jsonify({"error": "employee_id must be an integer"}), 400
        emp_target = db.session.get(Employee, new_emp_id)
        if not emp_target or emp_target.company_id != company_id:
            return jsonify({"error": "Employee not found"}), 404
        shift.employee_id = new_emp_id

    if "shift_type" in data:
        st = (data["shift_type"] or "").strip()
        if not st:
            return jsonify({"error": "shift_type required"}), 400
        shift.shift_type = st

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error updating shift"}), 400

    return jsonify(shift.serialize()), 200





# AQUI PUEDEN BORRAR ADMIN HR OWNERDB
@shift_bp.route("/delete/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_shift(id):
    if not (is_admin_or_hr() or is_ownerdb()):
        return jsonify({"error": "Forbidden"}), 403

    company_id = get_jwt_company_id()
    if company_id is None:
        return jsonify({"error": "Unauthorized"}), 401

    shift = db.session.get(Shifts, id)
    if not shift or shift.company_id != company_id:
        return jsonify({"error": "Shift not found"}), 404

    try:
        db.session.delete(shift)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error deleting shift"}), 400

    return jsonify({"message": "Shift successfully deleted"}), 200