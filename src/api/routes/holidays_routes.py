from flask import jsonify, Blueprint, request
from api.models import db, Employee, Company, Role, Salary, Payroll, Shifts, Holidays
from flask_cors import CORS

holidays_bp = Blueprint('holidays', __name__, url_prefix = '/holidays')

CORS(holidays_bp)


@holidays_bp.route("/", methods=["GET"])
def get_all_holidays():
    holidays = Holidays.query.all()
    return jsonify([h.serialize() for h in holidays]), 200



#por_id
@holidays_bp.route("/<int:id>", methods=["GET"])
def get_holiday(id):
    holiday = db.session.get(Holidays, id)
    if not holiday:
        return jsonify({"error": "Holidy request not found"}), 404
    return jsonify(holiday.serialize()), 200



@holidays_bp.route('/', methods=['POST'])
def create_holiday():
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


@holidays_bp.route('/<int:id>', methods=['PUT'])
def update_holiday(id):
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


@holidays_bp.route('/<int:id>', methods=['DELETE'])
def delete_holiday(id):
    holiday = db.session.get(Holidays, id)
    if not holiday:
        return jsonify({"error": "Holiday request not found"}), 404

    db.session.delete(holiday)
    db.session.commit()
    return jsonify({"message": "Holiday succesfully deleted"}), 200