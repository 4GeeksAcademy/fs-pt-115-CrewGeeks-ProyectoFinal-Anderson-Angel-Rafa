from flask import jsonify, Blueprint, request
from api.models import db, Employee, Company, Role, Salary, Payroll, Shifts, Holidays, Suggestions
from flask_cors import CORS

salary_bp = Blueprint('salary', __name__, url_prefix = '/salaries')


CORS(salary_bp)



@salary_bp.route("/", methods=["GET"])
def get_salaries():
    salaries = db.session.query(Salary).all()
    return jsonify([s.serialize() for s in salaries]), 200

@salary_bp.route("/<int:id>", methods=["GET"])
def get_salary(id):
    salary = db.session.get(Salary, id)
    if not salary:
        return jsonify({"error": "Salary not found"}), 404
    return jsonify(salary.serialize()), 200

@salary_bp.route("/", methods=["POST"])
def create_salary():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    salary_amount = data.get("amount")
    try:
        amount = int(salary_amount)
    except (TypeError, ValueError):
        return jsonify({"error": "amount debe ser un entero"}), 400

    if amount <= 0:
        return jsonify({"error": "amount debe ser mayor que 0"}), 400

    salary = Salary(amount=amount)
    db.session.add(salary)
    db.session.commit()
    return jsonify(salary.serialize()), 201

@salary_bp.route("/<int:id>", methods=["PUT"])
def update_salary(id):
    salary = db.session.get(Salary, id)
    if not salary:
        return jsonify({"error" : "Salary not found"}), 404
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400
    
    if "amount" in data:
        salary.amount = data["amount"]

    db.session.commit()
    return jsonify(salary.serialize()), 200


@salary_bp.route("/<int:id>", methods=["DELETE"])
def delete_salary(id):
    salary = db.session.get(Salary, id)
    if not salary:
        return jsonify({"error": "Salary not found"}), 404
    
    db.session.delete(salary)
    db.session.commit()
    return jsonify({"msg" : f'Salary id={id} deleted'}), 200