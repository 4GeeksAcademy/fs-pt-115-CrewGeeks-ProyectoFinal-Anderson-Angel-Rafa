from flask import jsonify, Blueprint, request
from api.models import db, Employee, Company, Role, Salary
from flask_cors import CORS
from flask_jwt_extended import get_jwt_identity, jwt_required


role_bp = Blueprint('role', __name__, url_prefix = '/roles')

CORS(role_bp)


@role_bp.route("/", methods=["GET"])
@jwt_required()
def get_roles():
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404


    roles = db.session.query(Role).all()
    return jsonify([r.serialize() for r in roles]), 200

#por_id
@role_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_role(id):
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404


    role = db.session.get(Role, id)
    if not role:
        return jsonify({"error": "Role not found"}), 404
    return jsonify(role.serialize()), 200


# con autorizacion
@role_bp.route("/", methods=["POST"])
@jwt_required()
def create_role():
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404


    data = request.get_json(silent=True)
    if not data: 
        return jsonify({"error": "JSON body required"}), 400
    
    salary_id = data.get("salary_id")
    if not salary_id or not db.session.get(Salary, salary_id):
        return jsonify({"error": "salary_id invalid"}), 400
    
    new_role = Role(
        name=data.get("name"), 
        description=data.get("description"),
        salary_id=salary_id
    )

    db.session.add(new_role)
    db.session.commit()
    return jsonify(new_role.serialize()), 201


#para pruebas
# @role_bp.route("/", methods=["POST"])
# def create_role():
#     data = request.get_json(silent=True)
#     if not data:
#         return jsonify({"error": "JSON body required"}), 400
#     salary_id = data.get("salary_id")
#     if not salary_id or not db.session.get(Salary, salary_id):
#         return jsonify({"error": "salary_id invalid"}), 400
#     new_role = Role(
#         name=data.get("name"),
#         description=data.get("description"),
#         salary_id=salary_id
#     )
#     db.session.add(new_role)
#     db.session.commit()
#     return jsonify(new_role.serialize()), 201



@role_bp.route ("/edit/<int:id>", methods=["PUT"])
@jwt_required()
def update_role(id):
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404


    role = db.session.get(Role, id)
    if not role:
        return jsonify({"error": "Roles not found"}), 404
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400
    
    if "salary_id" in data:
        if not db.session.get(Salary, data["salary_id"]):
            return jsonify({"error": f"Salary id={data['salary_id']} does not exist"}), 400
        role.salary_id = data["salary_id"]

    for field in ["name", "description"]:
        if field in data:
            setattr(role, field, data[field])

    db.session.commit()
    return jsonify(role.serialize()), 200

@role_bp.route("/delete/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_role(id):
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    role = db.session.get(Role, id)
    if not role:
        return jsonify({"error": "Role not found"}), 404

    db.session.delete(role)
    db.session.commit()
    return jsonify({"message": f"Role id={id} deleted"}), 200