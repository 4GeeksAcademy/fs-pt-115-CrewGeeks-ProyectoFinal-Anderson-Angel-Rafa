from flask import jsonify, Blueprint, request
from api.models import db, Employee, Company, Role, Salary, Payroll
from flask_cors import CORS

payroll_bp = Blueprint('payroll', __name__, url_prefix = '/payroll')


CORS(payroll_bp)


#todos_los_roles
@payroll_bp.route("/", methods=["GET"])
def get_all_payrolls():
    payrolls = Payroll.query.all()
    return jsonify([p.serialize() for p in payrolls]), 200


#por_id
@payroll_bp.route("/<int:id>", methods=["GET"])
def get_payroll(id):
    payroll = db.session.get(Payroll, id)
    if not payroll:
        return jsonify({"error": "Payroll not found"}), 400
    return jsonify(payroll.serialize()), 200


@payroll_bp.route("/", methods=["POST"])
def create_payroll():
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
def update_payroll(id): 
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
def delete_payroll(id):
    payroll = db.session.get(Payroll, id)
    if not payroll:
        return jsonify({"error": "Payroll not found"}), 404
    

    db.session.delete(payroll)
    db.session.commit()
    return jsonify({"message": "Payroll succesfully deleted"}), 200