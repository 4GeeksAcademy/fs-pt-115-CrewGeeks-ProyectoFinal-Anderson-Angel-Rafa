from flask import jsonify, Blueprint, request
from api.models import db, Employee, Company, Role, Salary, Payroll, Shifts
from flask_cors import CORS

shift_bp = Blueprint('shift', __name__, url_prefix = '/shifts')

CORS(shift_bp)


#todos_los_shifts
@shift_bp.route("/", methods=["GET"])
def get_all_shifts():
    shifts = Shifts.query.all()
    return jsonify([s.serialize() for s in shifts]), 200


#por_id
@shift_bp.route("/<int:id>", methods=["GET"])
def get_shift(id):
    shift = db.session.get(Shifts, id)
    if not shift:
        return jsonify({"error": "Shift not found"}), 404
    return jsonify(shift.serialize()), 200



@shift_bp.route("/", methods=["POST"])
def create_shift():
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
def update_shift(id):
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
def delete_shift(id):
    shift = db.session.get(Shifts, id)
    if not shift:
         return jsonify({"error": "Shift not found"}), 404

    db.session.delete(shift)
    db.session.commit()
    return jsonify({"error": "Shift succesfully deleted"}), 200