from flask import jsonify, Blueprint, request
from api.models import db, Employee, Company, Role, Salary, Payroll, Shifts, Holidays
from flask_cors import CORS
from flask_jwt_extended import get_jwt_identity, jwt_required

holidays_bp = Blueprint('holidays', __name__, url_prefix = '/holidays')

CORS(holidays_bp)


@holidays_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_holidays():
    employee_id = get_jwt_identity()
    employee = db.session.get(Employee, int(employee_id))
    if not employee: 
        return jsonify({"error": "Employee not found"}), 404
    
    holidays = Holidays.query.all()
    return jsonify([h.serialize() for h in holidays]), 200



#por_id
@holidays_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_holiday(id):
    employee_id = get_jwt_identity()
    employee = db.session.get(Employee, int(employee_id))
    if not employee:
        return jsonify({"error": "Employee not found"}), 404
    
    holiday = db.session.get(Holidays, id)
    if not holiday:
        return jsonify({"error": "Holidy request not found"}), 404
    return jsonify(holiday.serialize()), 200



@holidays_bp.route('/', methods=['POST'])
@jwt_required()
def create_holiday():
    employee_id = get_jwt_identity()
    employee = db.session.get(Employee, int(employee_id))
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body requerido"}), 400

    required_fields = ("company_id", "employee_id", "start_date", "end_date", "status", "remaining_days")
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Faltan campos requeridos"}), 400

    holiday = Holidays(
        company_id=data["company_id"],
        employee_id=data["employee_id"],
        start_date=data["start_date"],
        end_date=data["end_date"],
        status=data["status"],
        approved_user_id=data.get("approved_user_id"),
        remaining_days=data["remaining_days"]
    )
    db.session.add(holiday)
    db.session.commit()
    return jsonify(holiday.serialize()), 201


@holidays_bp.route('/edit/<int:id>', methods=['PUT'])
@jwt_required()
def update_holiday(id):
    employee_id = get_jwt_identity()
    employee = db.session.get(Employee, int(employee_id))
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    holiday = db.session.get(Holidays, id)
    if not holiday:
        return jsonify({"error": "Holiday request not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body requerido"}), 400

    holiday.company_id = data.get("company_id", holiday.company_id)
    holiday.employee_id = data.get("employee_id", holiday.employee_id)
    holiday.start_date = data.get("start_date", holiday.start_date)
    holiday.end_date = data.get("end_date", holiday.end_date)
    holiday.status = data.get("status", holiday.status)
    holiday.approved_user_id = data.get("approved_user_id", holiday.approved_user_id)
    holiday.remaining_days = data.get("remaining_days", holiday.remaining_days)

    db.session.commit()
    return jsonify(holiday.serialize()), 200


@holidays_bp.route('/delete/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_holiday(id):
    employee_id = get_jwt_identity()
    employee = db.session.get(Employee, int(employee_id))
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    holiday = db.session.get(Holidays, id)
    if not holiday:
        return jsonify({"error": "Holiday request not found"}), 404

    db.session.delete(holiday)
    db.session.commit()
    return jsonify({"message": "Holiday succesfully deleted"}), 200