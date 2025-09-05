from flask import jsonify, Blueprint, request
from api.models import db, Employee, Company, Role, Salary, Payroll, Shifts, Holidays, Suggestions
from flask_cors import CORS
from flask_jwt_extended import get_jwt_identity, jwt_required


suggestions_bp = Blueprint('suggestions', __name__, url_prefix = '/suggestions')

CORS(suggestions_bp)



@suggestions_bp.route("/", methods=["GET"])
@jwt_required()
def get_suggestions():
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    suggestions = db.session.query(Suggestions).all()
    return jsonify([s.serialize() for s in suggestions]), 200


@suggestions_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_suggestion(id):
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404


    suggestion = db.session.get(Suggestions,id)
    if not suggestion:
        return jsonify({"error": "Suggestion not found"}), 404
    return jsonify(suggestion.serialize()), 200


@suggestions_bp.route("/", methods=["POST"])
@jwt_required()
def create_suggestion():
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400
    
    company_id = data.get("company_id")
    employee_id = data.get("employee_id")

    if not company_id or not db.session.get(Company, company_id):
        return jsonify ({"error": "company_id invalido"}), 400
    
    employee = db.session.get(Employee, employee_id) if employee_id else None
    if not employee:
        return jsonify({"error": "employee_id invalido"}), 400
    if employee.company_id != company_id:
        return jsonify({"error": "El empleado no pertenece a esta company"}), 400
    
    content = data.get("content")
    if not content:
        return jsonify({"error": "content requerido"}), 400
    
    item = Suggestions(company_id=company_id, employee_id=employee_id, content=content)
    db.session.add(item)
    db.session.commit()
    return jsonify(item.serialize()), 201
                              

@suggestions_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_suggestion(id):
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    suggestion = db.session.get(Suggestions, id)
    if not suggestion:
        return jsonify({"error": "Suggestion not found"}), 404
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400
    
    if "company_id" in data:
        if not db.session.get(Company, data["company_id"]):
            return jsonify({"error": f'Company id={data["company_id"]} does not exist'}), 400
        suggestion.company_id = data["company_id"]

    if "employee_id" in data:
        employee = db.session.get(Employee, data["employee_id"])
        if not employee:
            return jsonify({"error": f'Employee id={data["employee_id"]} does not exist'}), 400
        suggestion.employee_id = data["employee_id"]

    employee = db.session.get(Employee, suggestion.employee_id)
    if employee.company_id != suggestion.company_id:
        return jsonify({"error": "El employee no pertenece a esta company"}), 400
    
    if "content" in data:
        suggestion.content = data["content"]

    db.session.commit()
    return jsonify(suggestion.serialize()), 200


@suggestions_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_suggestions(id):
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404


    suggestion = db.session.get(Suggestions, id)
    if not suggestion:
        return jsonify({"error": "Suggestion not found"}), 404
    db.session.delete(suggestion)
    db.session.commit()
    return jsonify({"message": f'Suggestion id={id} deleted'}), 200