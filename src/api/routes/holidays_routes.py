from flask import jsonify, Blueprint, request
from api.models import db, Employee, Company, Role, Salary, Payroll, Shifts, Holidays
from flask_cors import CORS
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.exc import IntegrityError
from api.utiles.helpers_auth import (
    get_jwt_company_id,
    is_admin_or_hr,
    current_employee_id,
)


holidays_bp = Blueprint('holidays', __name__, url_prefix = '/holidays')

CORS(holidays_bp)



#con esto podemos listar todas las holidays
@holidays_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_holidays():
    employee_id = get_jwt_identity()
    employee = db.session.get(Employee, int(employee_id))
    if not employee: 
        return jsonify({"error": "Employee not found"}), 404
    
    holidays = Holidays.query.all()
    return jsonify([h.serialize() for h in holidays]), 200


#con esto podemos listar holidays por empresa + rol
# @holidays_bp.route("/", methods=["GET"])
# @jwt_required()
# def get_all_hollidays():
#     company_id = get_jwt_company_id()
#     if company_id is None:
#         return jsonify({"error": "Unauthorized"}), 401
    
#     if is_admin_or_hr():
#         holidays = db.session.execute(
#             db.select(Holidays).where(Holidays.company_id == company_id)
#         ).scalars().all()
#     else:
#         employee_id_actual = current_employee_id()
#         holidays = db.session.execute(
#             db.select(Holidays).where(
#                 Holidays.company_id == company_id,
#                 Holidays.employee_id == employee_id_actual,
#             )
#         ).scalars().all()

#     return jsonify([holiday.serialize() for holiday in holidays]), 200



#aqui cogemos todas las holidays por id
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


#Aqui cogemos las holidays del empleado
# @holidays_bp.route("/<int:id>", methods=["GET"])
# @jwt_required()
# def get_holiday(id):
#     company_id = get_jwt_company_id()
#     if company_id is None:
#         return jsonify({"error": "Unauthorized"}), 401
    
#     holiday = db.session.get(Holidays, id)
#     if not holiday or holiday.company_id != company_id:
#         return jsonify({"error": "Holiday request not found"}), 404
    
#     if not is_admin_or_hr() and holiday.employee_id != current_employee_id():
#         return jsonify({"error": "Holiday request not found"}), 404
    
#     return jsonify(holiday.serialize()), 200


#Aqui puedes crear hollidays para cualquiera
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


#Aqui 
# Employee puede crearse a si mismo con status "PENDING"
# ADMIN puede crear para cualquier empleado de la empresa
# @holidays_bp.route("/", methods= ["POST"])
# @jwt_required()
# def create_holiday():
#     company_id = get_jwt_company_id()
#     if company_id is None:
#         return jsonify({"error": "Unauthorized"}), 401
    
#     data = request.get_json(silent=True)
#     if not data:
#         return jsonify({"error": "JSON body required"}), 400
    
#     start_date = data.get("start_date")
#     end_date = data.get("end_date")
#     remaining_days = data.get("remaining_days")
#     if start_date is None or end_date is None or remaining_days is None:
#         return jsonify({"error": "Missing required fields: start_date, end_date, remaining_days"})
    
#     try:
#         remaining_days = int(remaining_days)
#     except (TypeError, ValueError):
#         return jsonify({"error": "remaining_days must be an integer"}), 400
    
#     if is_admin_or_hr():
#         try:
#             employee_id_body = int(data.get("employee_id"))
#         except (TypeError, ValueError):
#             return jsonify({"error": "employee_id must be an integer"}), 400
        
#         employee_target = db.session.get(Employee, employee_id_body)
#         if not employee_target or employee_target.company_id != company_id:
#             return jsonify({"error": "Employee not found"}), 404
        
#         status_value = data.get("status") or "PENDING"

#         approved_user_id_value = data.get("approved_user_id")
#         if approved_user_id_value is not None:
#             try:
#                 approved_user_id_value = int(approved_user_id_value)
#             except (TypeError, ValueError):
#                 return jsonify({"error": "approved_user_id must be an integer"}), 400
#             approved_user = db.session.get(Employee, approved_user_id_value)
#             if not approved_user or approved_user.company_id != company_id:
#                 return jsonify({"error": "approved_user_id must belong to the same company"}), 400
            
#         else: 
#             approved_user_id_value = None

#         new_holliday = Holidays(
#             company_id=company_id,
#             employee_id=employee_target.id,
#             start_date=start_date,
#             end_date=end_date,
#             status=status_value,
#             approved_user_id=approved_user_id_value,
#             remaining_days=remaining_days,
#         )

#     else:
#         new_holliday = Holidays(
#             company_id=company_id,
#             employee_id=current_employee_id(),
#             start_date=start_date,
#             end_date=end_date,
#             status="PENDING",
#             approved_user_id=None,
#             remaining_days=remaining_days,
#         )

#     try:
#         db.session.add(new_holliday)
#         db.session.commit()
#     except IntegrityError:
#         db.session.rollback()
#         return jsonify({"error": "Integrity error creating holiday"}), 400
    
#     return jsonify(new_holliday.serialize()), 201


#aqui cualquiera puede editar cualquier holiday
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


# Employee puede editar solo la suya y solo si esta PENDING
# ADMIN/HR puede cambiar estatus y todo
# @holidays_bp.route("/edit/<int:id>", methods=["PUT"])
# @jwt_required()
# def update_holiday(id):
#     company_id = get_jwt_company_id()
#     if company_id is None:
#         return jsonify({"error": "Unauthorized"}), 401
    
#     holiday = db.session.get(Holidays, id)
#     if not holiday or holiday.company_id != company_id:
#         return jsonify({"error": "Holiday request not found"}), 404
    
#     data = request.get_json(silent=True)
#     if not data:
#         return jsonify({"error": "JSON body required"}), 400
    
#     if is_admin_or_hr():
#         if "start_date" in data:
#             holiday.start_date = data["start_date"]
#         if "end_date" in data:
#             holiday.end_date = data["end_date"]
#         if "status" in data:
#             holiday.status = data["status"]
#         if "approved_user_id" in data:
#             approved_user_id_value = data["approved_user_id"]
#             if approved_user_id_value is not None:
#                 try:
#                     approved_user_id_value = int(approved_user_id_value)
#                 except (TypeError, ValueError):
#                     return jsonify({"error": "approved_user_id must be an integer"}), 400
                
#     else:
#         if holiday.employee_id != current_employee_id():
#             return jsonify({"error": "Holiday request not found"}), 404
#         if holiday.status != "PENDING":
#             return jsonify({"error": "Only PENDING request can be edited by the employee"}), 403
#         if "start_date" in data:
#             holiday.start_date = data["start_date"]
#         if "end_date" in data:
#             holiday.end_date = data["end_date"]

#     try:
#         db.session.commit()
#     except IntegrityError:
#         db.session.rollback()
#         return jsonify({"error": "Integrity error updating holiday"}), 400
    
#     return jsonify(holiday.serialize()), 200


#aqui cualquiera puede borrar cualquier holiday
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


#Delete
#EMPLOYEE solo las suyas y solo si estan PENDING
#ADMIN/HR puede borrar dentro de su empresa
# @holidays_bp.route("/delete/<int:id>", methods=["DELETE"])
# @jwt_required()
# def delete_holiday(id):
#     company_id = get_jwt_company_id()
#     if company_id is None:
#         return jsonify({"error": "Unauthorized"}), 401
    
#     holiday = db.session.get(Holidays, id)
#     if not holiday or holiday.company_id != company_id:
#         return jsonify({"error": "Holiday request not found"}), 404
    
#     if is_admin_or_hr():
#         pass
#     else: 
#         if holiday.employee_id != current_employee_id():
#             return jsonify({"error": "Holiday request not found"}), 404
#         if holiday.status != "PENDING":
#             return jsonify({"error": "Only PENDING request can be deleted by the employee"}), 403
        
#     try:
#         db.session.delete(holiday)
#         db.session.commit()
#     except IntegrityError:
#         db.session.rollback()
#         return jsonify({"error": "Integrity error deleting holiday"}), 400
    
#     return jsonify({"message": "Holiday successfully deleted"}), 200
