from flask import jsonify, Blueprint, request
from api.models import db, Employee, Company, Role, Salary, Payroll
from flask_cors import CORS
from flask_jwt_extended import get_jwt_identity, jwt_required, get_jwt
from sqlalchemy.exc import IntegrityError
from api.utils_auth.helpers_auth import (
    get_jwt_company_id,
    get_system_role,
    is_admin_or_hr,
    current_employee_id,
)


payroll_bp = Blueprint('payroll', __name__, url_prefix = '/payroll')

CORS(payroll_bp)




# Todos los payrolls
@payroll_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_payrolls():
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404
    

    payrolls = Payroll.query.all()
    return jsonify([p.serialize() for p in payrolls]), 200

# Todos los payrolls por empresa y rol
# @payroll_bp.route("/", methods=["GET"])
# @jwt_required()
# def get_all_payrolls():
#     company_id = get_jwt_company_id()
#     if company_id is None:
#         return jsonify({"error": "Unauthorized"}), 401
    
#     if is_admin_or_hr():
#         payrolls = db.session.execute(
#             db.select(Payroll).where(Payroll.company_id == company_id)
#         ).scalars().all()
#     else:
#         payrolls = db.session.execute(
#             db.select(Payroll).where(
#                 Payroll.company_id == company_id,
#                 Payroll.employee_id == current_employee_id()
#             )
#         ).scalars().all()

#     return jsonify([payroll.serialize() for payroll in payrolls]), 200



#por_id normal
@payroll_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_payroll(id):
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404
    
    payroll = db.session.get(Payroll, id)
    if not payroll:
        return jsonify({"error": "Payroll not found"}), 400
    return jsonify(payroll.serialize()), 200


# Obtener payroll por id, empresa y propiedad
# @payroll_bp.route("/<int:id>", methods=["GET"])
# @jwt_required()
# def get_payroll(id):
#     company_id = get_jwt_company_id()
#     if company_id is None:
#         return jsonify({"error": "Unauthorized"}), 401
    
#     payroll = db.sessions.get(Payroll, id)
#     if not payroll or payroll.company_id != company_id:
#         return jsonify({"error": "Payroll not found"}), 404
    
#     if not is_admin_or_hr() and payroll.employee_id != current_employee_id():
#         return jsonify({"error": "Payroll not found"}), 404
    
#     return jsonify(payroll.serialize()), 200


# Crear payroll
@payroll_bp.route("/", methods=["POST"])
@jwt_required()
def create_payroll():
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404
    

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400
    
    payroll = Payroll(
        company_id=data["company_id"],
        employee_id=data["employee_id"], 
        period_year=data["period_year"],
        period_month=data["period_month"]
    )

    db.session.add(payroll)
    db.session.commit()
    return jsonify(payroll.serialize()), 200


# Crear payroll (solo ADMIN/HR)
# @payroll_bp.route("/", methods=["POST"])
# @jwt_required()
# def create_payroll():
#     if not is_admin_or_hr():
#         return jsonify({"error": "Forbidden"}), 403
    
#     company_id = get_jwt_company_id()
#     if company_id is None:
#         return jsonify({"error": "Unauthorized"}), 401
    
#     data = request.get_json(silent=True)
#     if not data:
#         return jsonify({"error": "JSON body required"}), 400
    
#     try:
#         employee_id_body = int(data.get("employee_id"))
#         period_year = int(data.get("period_year"))
#         period_month = int(data.get("period_month"))
#     except (TypeError, ValueError):
#         return jsonify({"error": "employee_id, period_year and period_month must be integers"}), 400
    
#     if period_month < 1 or period_month > 12:
#         return jsonify({"error": "period_month must be between 1 and 12"}), 400
    
#     employee_target = db.session.get(Employee, employee_id_body)
#     if not employee_target or employee_target.company_id != company_id:
#         return jsonify({"error": "Employee not found"}), 404
    
#     existing_payroll = db.session.execute(
#         db.select(Payroll).where(
#             Payroll.employee_id == employee_id_body,
#             Payroll.period_year == period_year,
#             Payroll.period_month == period_month
#         )
#     ).scalar_one_or_none()
#     if existing_payroll:
#         return jsonify({"error": "Payroll already exists for this employee and period"}), 409
    
#     payroll = Payroll(
#         company_id=company_id,
#         employee_id=employee_id_body,
#         period_year=period_year,
#         period_month=period_month
#     )

#     try:
#         db.session.add(payroll)
#         db.session.commit()
#     except IntegrityError:
#         db.session.rollback()
#         return jsonify({"error": "Integrity error creating payroll"}), 400
    
#     return jsonify(payroll.serialize()), 201


# Cualquiera puede actualizar payroll
@payroll_bp.route("/edit/<int:id>", methods=["PUT"])
@jwt_required()
def update_payroll(id):
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404


    payroll = db.session.get(Payroll, id)
    if not payroll:
        return jsonify({"error": "Payroll not found"}), 404
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400
    
    payroll.company_id = data.get("company_id", payroll.company_id)
    payroll.employee_id = data.get("employee_id", payroll.employee_id)
    payroll.period_year = data.get("period_year", payroll.period_year)
    payroll.period_month = data.get("period_month", payroll.period_month)

    db.session.commit()
    return jsonify(payroll.serialize()), 200


#Actualizar payroll (solo ADMIN/HR)
# @payroll_bp.route("/edit/<int:id>", methods=["PUT"])
# @jwt_required()
# def update_payroll(id):
#     if not is_admin_or_hr():
#         return jsonify ({"error": "Forbidden"}), 403
    
#     company_id = get_jwt_company_id()
#     if company_id is None:
#         return jsonify({"error": "Unauthorized"}), 401
    
#     payroll = db.session.get(Payroll, id)
#     if not payroll or payroll.company_id != company_id:
#         return jsonify({"error": "Payroll not found"}), 404
    
#     data = request.get_json(silent=True)
#     if not data:
#         return jsonify({"error": "JSON body required"}), 400
    
#     new_employee_id = data.get("employee_id", payroll.employee_id)
#     new_period_year = data.get("period_year", payroll.period_year)
#     new_period_month = data.get("period_month", payroll.period_month)

#     try:
#         new_employee_id = int(new_employee_id)
#         new_period_year = int(new_period_year)
#         new_period_month = int(new_period_month)
#     except (TypeError, ValueError):
#         return jsonify({"error": "employee_id, period_year and period_month must be integers"}), 400
    
#     if new_period_month < 1 or new_period_month > 12:
#         return jsonify({"error": "period_month must be between 1 and 12"}), 400
    
#     employee_target = db.session.get(Employee, new_employee_id)
#     if not employee_target or employee_target.company_id != company_id:
#         return jsonify({"error": "Employee not found"}), 404
    
#     if (new_employee_id != payroll.employee_id or
#         new_period_year != payroll.period_year or
#         new_period_month != payroll.period_month):
#         existing_payroll = db.session.execute(
#             db.select(Payroll).where(
#                 Payroll.employee_id == new_employee_id,
#                 Payroll.period_year == new_period_year,
#                 Payroll.period_month == new_period_month
#             )
#         ).scalar_one_or_none()
#         if existing_payroll and existing_payroll.id != payroll.id:
#             return jsonify({"error": "Another payroll exists for this employee and period"}), 409
        
#     payroll.employee_id = new_employee_id
#     payroll.period_year = new_period_year
#     payroll.period_month = new_period_month

#     try:
#         db.session.commit()
#     except IntegrityError:
#         db.session.rollback()
#         return jsonify({"error": "Integrity error updating payroll"}), 400
    
#     return jsonify(payroll.serialize()), 200


#aqui cualquiera puede borrar un payroll
@payroll_bp.route("/delete/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_payroll(id):
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    payroll = db.session.get(Payroll, id)
    if not payroll:
        return jsonify({"error": "Payroll not found"}), 404

    db.session.delete(payroll)
    db.session.commit()
    return jsonify({"message": "Payroll successfully deleted"}), 200

#Borrar payroll (solo ADMIN / HR)
# @payroll_bp.route("/delete/<int:id>", methods=["DELETE"])
# @jwt_required()
# def delete_payroll(id):
#     if not is_admin_or_hr():
#         return jsonify({"error": "Forbidden"}), 403
    
#     company_id = get_jwt_company_id()
#     if company_id is None:
#         return jsonify({"error": "Unauthorized"}), 401
    
#     payroll = db.session.get(Payroll, id)
#     if not payroll or payroll.company_id != company_id:
#         return jsonify({"error": "Payroll not found"}), 404
    
#     try:
#         db.session.delete(payroll)
#         db.session.commit()
#     except IntegrityError:
#         db.session.rollback()
#         return jsonify({"error": "Integrity error deleting payroll"}), 400
    
#     return jsonify({"message": "Payroll successfully deleted"}), 200