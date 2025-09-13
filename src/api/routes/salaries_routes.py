from flask import jsonify, Blueprint, request
from api.models import db, Employee, Company, Role, Salary, Payroll, Shifts, Holidays, Suggestions
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

salary_bp = Blueprint('salary', __name__, url_prefix = '/salaries')


CORS(salary_bp)




# AQUI PUEDEN HACER GET ADMIN/HR/OWNERDB
@salary_bp.route("/", methods=["GET"])
@jwt_required()
def get_salaries():
    if not (is_admin_or_hr() or is_ownerdb()):
        return jsonify({"error": "Forbidden"}), 403
    
    salaries = db.session.execute(db.select(Salary)).scalars().all()
    return jsonify([s.serialize() for s in salaries]), 200




# AQUI PUEDEN HACER GET ADMIN/HR/OWNERDB
@salary_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_salary(id):
    if not (is_admin_or_hr() or is_ownerdb()):
        return jsonify({"error": "Forbidden"}),403
    
    salary = db.session.get(Salary, id)
    if not salary:
        return jsonify({"error": "Salary not found"}), 404
    return jsonify(salary.serialize()), 200





# AQUI PUEDEN POSTEAR ADMIN/HR/OWNERDB
@salary_bp.route("/", methods=["POST"])
@jwt_required()
def create_salary():
    if not (is_admin_or_hr() or is_ownerdb()):
        return jsonify({"error": "Forbidden"}), 403
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}),400
    
    try:
        amount = int(data.get("amount"))
    except (TypeError, ValueError):
        return jsonify({"error": "amount must be an integer"}), 400
    if amount <= 0:
        return jsonify({"error": "amount must be more than 0"}), 400
    
    salary = Salary(amount=amount)
    try:
        db.session.add(salary)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error creating salary"}), 400
    
    return jsonify(salary.serialize()), 201





# AQUI PUEDEN EDITAR ADMIN/HR/OWNERDB
@salary_bp.route("/edit/<int:id>", methods=["PUT"])
@jwt_required()
def update_salary(id):
    if not (is_admin_or_hr() or is_ownerdb()):
        return jsonify({"error": "Forbidden"}), 403

    salary = db.session.get(Salary, id)
    if not salary:
        return jsonify({"error": "Salary not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    if "amount" in data:
        try:
            amount = int(data["amount"])
        except (TypeError, ValueError):
            return jsonify({"error": "amount must be an integer"}), 400
        if amount <= 0:
            return jsonify({"error": "amount must be greater than 0"}), 400
        salary.amount = amount

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error updating salary"}), 400

    return jsonify(salary.serialize()), 200





# AQUI BORRAN ADMIN/HR/OWNERDB
@salary_bp.route("/delete/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_salary(id):
    if not (is_admin_or_hr() or is_ownerdb()):
        return jsonify({"error": "Forbidden"}), 403

    salary = db.session.get(Salary, id)
    if not salary:
        return jsonify({"error": "Salary not found"}), 404

    try:
        db.session.delete(salary)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Cannot delete salary linked to roles"}), 400

    return jsonify({"message": f"Salary id={id} deleted"}), 200