from flask import jsonify, Blueprint, request
from api.models import db, Employee, Company, Role, Salary, Payroll
from flask_cors import CORS
from flask_jwt_extended import get_jwt_identity, jwt_required

payroll_bp = Blueprint('payroll', __name__, url_prefix = '/payroll')


CORS(payroll_bp)


#todos_los_roles
@payroll_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_payrolls():
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404
    

    payrolls = Payroll.query.all()
    return jsonify([p.serialize() for p in payrolls]), 200


#por_id
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


@payroll_bp.route("/<int:id>", methods=["PUT"])
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


@payroll_bp.route("/<int:id>", methods=["DELETE"])
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