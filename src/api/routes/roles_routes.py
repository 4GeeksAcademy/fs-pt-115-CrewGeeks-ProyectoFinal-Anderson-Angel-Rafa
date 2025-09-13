from flask import jsonify, Blueprint, request
from api.models import db, Employee, Company, Role, Salary
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


role_bp = Blueprint('role', __name__, url_prefix = '/roles')

CORS(role_bp)




# AQUI SOLO PUEDEN VER LOS ROLES ADMIN/HR/OWNERDB
@role_bp.route("/", methods= ["GET"])
@jwt_required()
def get_roles():
    if not (is_admin_or_hr() or is_ownerdb()):
        return jsonify({"error": "Forbidden"}), 403
    
    roles = db.session.execute(db.select(Role)).scalars().all()
    return jsonify([r.serialize() for r in roles]), 200




# AQUI PUEDEN LISTAR ADMIN/HR/OWNERDB
@role_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_role(id):
    if not (is_admin_or_hr() or is_ownerdb()):
        return jsonify({"error": "Forbidden"}), 403
    
    role = db.session.get(Role, id)
    if not role:
        return jsonify({"error": "Role not found"}), 404
    return jsonify(role.serialize()), 200





# AQUI SOLO POSTEAN ADMIN/HR/OWNERDB
@role_bp.route("/", methods=["POST"])
@jwt_required()
def create_role():
    if not (is_admin_or_hr() or is_ownerdb()):
        return jsonify({"error": "Forbidden"}), 403
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error", "JSON body required"}), 400
    
    name = (data.get("name") or "").strip()
    description = (data.get("description") or "").strip()
    salary_id = data.get("salary_id")

    if not name or not description:
        return jsonify({"error": "Missing required fields: name, description"}), 400
    if not salary_id or not db.session.get(Salary, salary_id):
        return jsonify({"error": "salary_id invalid"}), 400
    
    new_role = Role(name=name, description=description, salary_id=salary_id)
    try:
        db.session.add(new_role)
        db.session.commit()
    except ImportError:
        db.session.rollback()
        return jsonify({"error": "Integrity error creating role"}), 400
    
    return jsonify(new_role.serialize()), 201




# AQUI SOLO EDITAN ADMIN/HR/OWNERDB
@role_bp.route("/edit/<int:id>", methods=["PUT"])
@jwt_required()
def update_role(id):
    if not (is_admin_or_hr() or is_ownerdb()):
        return jsonify({"error": "Forbidden"}), 403
    
    role = db.session.get(Role, id)
    if not role:
        return jsonify({"error": "Role not found"}), 404
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400
    
    if "salary_id" in data:
        sid = data["salary_id"]
        if not db.session.get(Salary, sid):
            return jsonify({"error": f"Salary id={sid} does not exist"}), 400
        role.salary_id = sid

    for field in ["name", "description"]:
        if field in data:
            setattr(role, field, (data[field] or "").strip())

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error updating role"}), 400
    
    return jsonify(role.serialize()), 200




# AQUI BORRAN SOLO ADMIN/HR/OWNERDB
@role_bp.route("/delete/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_role(id):
    if not (is_admin_or_hr() or is_ownerdb()):
        return jsonify({"error": "Forbidden"}), 403
    
    role = db.session.get(Role, id)
    if not role:
        return jsonify({"error": "Role not found"}), 404
    
    try:
        db.session.delete(role)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Cannot delete role that is in use"}), 400
    
    return jsonify({"message": f"Role id={id} deleted"}), 200


