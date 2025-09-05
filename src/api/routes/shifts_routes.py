from flask import jsonify, Blueprint, request
from api.models import db, Employee, Company, Role, Salary, Payroll, Shifts
from flask_cors import CORS
from flask_jwt_extended import get_jwt_identity, jwt_required

shift_bp = Blueprint('shift', __name__, url_prefix = '/shifts')

CORS(shift_bp)


#todos_los_shifts
@shift_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_shifts():
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    shifts = Shifts.query.all()
    return jsonify([s.serialize() for s in shifts]), 200


#por_id
@shift_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_shift(id):
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    shift = db.session.get(Shifts, id)
    if not shift:
        return jsonify({"error": "Shift not found"}), 404
    return jsonify(shift.serialize()), 200



@shift_bp.route("/", methods=["POST"])
@jwt_required()
def create_shift():
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    shift = Shifts(
        company_id=data["company_id"],
        employee_id=data["employee_id"],
        shift_type=data["shift_type"]
    )       

    db.session.add(shift)
    db.session.commit()
    return jsonify(shift.serialize()), 200


@shift_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_shift(id):
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    shift = db.session.get(Shifts, id)
    if not shift:
        return jsonify({"error": "Shift not found"}), 404
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400
    
    shift.company_id = data.get("company_id", shift.company_id)
    shift.employee_id = data.get("employee_id", shift.employee_id)
    shift.shift_type = data.get("shift_type", shift.shift_type)

    db.session.commit()
    return jsonify(shift.serialize()), 200


@shift_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_shift(id):
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404
    
    shift = db.session.get(Shifts, id)
    if not shift:
         return jsonify({"error": "Shift not found"}), 404

    db.session.delete(shift)
    db.session.commit()
    return jsonify({"message": "Shift successfully deleted"}), 200