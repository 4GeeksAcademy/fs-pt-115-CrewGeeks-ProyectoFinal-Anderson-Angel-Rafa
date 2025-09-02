from flask import jsonify, Blueprint, request
from api.models import db, Employee, Company, Role
from flask_cors import CORS

employee_bp = Blueprint ('employee', __name__, url_prefix = '/employees')

CORS(employee_bp)

@employee_bp.route("/", methods=["GET"])
def get_employees():
    employees = db.session.query(Employee).all()                   
    return jsonify([e.serialize() for e in employees]), 200              


@employee_bp.route('/<int:id>', methods=['GET'])
def get_employee(id):
    employee = db.session.get(Employee, id)
    if not employee:
            return jsonify({"error": "Employee not found"}), 404
    return jsonify(employee.serialize()), 200

@employee_bp.route("/", methods=["POST"])
def create_employee():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    # company_id requerido y valido
    company_id = data.get("company_id")
    if not company_id or not db.session.get(Company, company_id):
        return jsonify({"error": "company_id invalid"}), 400

    # role id
    role_id = data.get("role_id")
    if role_id and not db.session.get(Role, role_id):
        return jsonify({"error": f"Role id={role_id} does not exist"}), 400

    
    #hash

    new_employee = Employee(
        company_id = company_id,
        first_name = data.get("first_name"),
        last_name  = data.get("last_name"),
        dni        = data.get("dni"),
        address    = data.get("address"),
        seniority  = data.get("seniority"),
        email      = data.get("email"),
        role_id    = role_id,
        birth      = data.get("birth"),
        phone      = data.get("phone") 
    )

    db.session.add(new_employee)
    db.session.commit()
    return jsonify(new_employee.serialize()), 201

@employee_bp.route("/<int:id>", methods=["PUT"])
def update_employee(id):
    employee = db.session.get(Employee, id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400
    
    
    #Validar/actualizar Foreign keys
    if "company_id" in data:
        if not db.session.get(Company, data["company_id"]):
            return jsonify({"error": f"Company id={data["company_id"]} does not exist"}), 400
        employee.company_id = data["company_id"]


    if "role_id" in data:
        if data["role_id"] and not db.session.get(Role, data["role_id"]):
            return jsonify({"error": f"Role id={data["role_id"]} does not exist"}), 400
        employee.role_id = data["role_id"]

    #actualizar campos
    for field in ["first_name", "last_name", "dni", "address", "seniority", "email", "birth", "phone"]:
        if field in data:
            setattr(employee, field, data[field])


    #re-hash


    db.session.commit()
    return jsonify(employee.serialize()), 200   


@employee_bp.route("/<int:id>", methods=["DELETE"])
def delete_employee(id):
    employee = db.session.get(Employee, id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404
    
    db.session.delete(employee)
    db.session.commit()
    return jsonify({"message": f"Employee id={id} deleted"}), 200