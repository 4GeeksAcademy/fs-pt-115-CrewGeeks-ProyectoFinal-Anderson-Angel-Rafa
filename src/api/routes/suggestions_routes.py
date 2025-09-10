from flask import jsonify, Blueprint, request
from api.models import db, Employee, Company, Role, Salary, Payroll, Shifts, Holidays, Suggestions
from flask_cors import CORS
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.exc import IntegrityError
from api.utils_auth.helpers_auth import (
    get_jwt_company_id,
    get_system_role,
    is_admin_or_hr,
    current_employee_id,
    is_ownerdb
)

suggestions_bp = Blueprint('suggestions', __name__, url_prefix='/suggestions')

CORS(suggestions_bp)


# AQUI SE LISTAN TODAS LAS SUGERENCIAS  BORRAR
# @suggestions_bp.route("/", methods=["GET"])
# @jwt_required()
# def get_suggestions():
#     employee_id = int(get_jwt_identity())
#     employee = db.session.get(Employee, employee_id)
#     if not employee:
#         return jsonify({"error": "Employee not found"}), 404

#     suggestions = db.session.query(Suggestions).all()
#     return jsonify([s.serialize() for s in suggestions]), 200


# EMPLOYEE SOLO VE SUS SUGERENCIAS
# ADMIN HR OWNERDB VE TODAS LAS SUGERENCIAS DE SU EMPRESA
@suggestions_bp.route("/", methods=["GET"])
@jwt_required()
def get_suggestions():
    company_id = get_jwt_company_id()
    if company_id is None:
        return jsonify({"error": "Unauthorized"}), 401

    if is_admin_or_hr() or is_ownerdb():
        items = db.session.execute(
            db.select(Suggestions).where(Suggestions.company_id == company_id)
        ).scalars().all()
    else:
        items = db.session.execute(
            db.select(Suggestions).where(
                Suggestions.company_id == company_id,
                Suggestions.employee_id == current_employee_id(),
            )
        ).scalars().all()

    return jsonify([s.serialize() for s in items]), 200


# AQUI SE PUEDE LISTAR POR CUALQUIER ID AUNQUE NO PERTENEZCA A TU EMPRESA   BORRAR
# @suggestions_bp.route("/<int:id>", methods=["GET"])
# @jwt_required()
# def get_suggestion(id):
#     employee_id = int(get_jwt_identity())
#     employee = db.session.get(Employee, employee_id)
#     if not employee:
#         return jsonify({"error": "Employee not found"}), 404

#     suggestion = db.session.get(Suggestions, id)
#     if not suggestion:
#         return jsonify({"error": "Suggestion not found"}), 404
#     return jsonify(suggestion.serialize()), 200


# EMPLOYEE SOLO VE SI SON SUYAS
# ADMIN HR OWNERDB PUEDE VER LAS QUE SEAN DE SU EMPRESA
@suggestions_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_suggestion(id):
    company_id = get_jwt_company_id()
    if company_id is None:
        return jsonify({"error": "Unauthorized"}), 401

    item = db.session.get(Suggestions, id)
    if not item or item.company_id != company_id:
        return jsonify({"error": "Suggestion not found"}), 404

    if not (is_admin_or_hr() or is_ownerdb()) and item.employee_id != current_employee_id():
        return jsonify({"error": "Suggestion not found"}), 404

    return jsonify(item.serialize()), 200


# VERSION ANTIGUA
# @suggestions_bp.route("/", methods=["POST"])
# @jwt_required()
# def create_suggestion():
#     employee_id = int(get_jwt_identity())
#     employee = db.session.get(Employee, employee_id)
#     if not employee:
#         return jsonify({"error": "Employee not found"}), 404

#     data = request.get_json(silent=True)
#     if not data:
#         return jsonify({"error": "JSON body required"}), 400

#     company_id = int(data.get("company_id"))
#     employee_id = int(data.get("employee_id"))

#     if not company_id or not db.session.get(Company, company_id):
#         return jsonify({"error": "company_id invalido"}), 400

#     employee = db.session.get(Employee, employee_id) if employee_id else None
#     if not employee:
#         return jsonify({"error": "employee_id invalido"}), 400
#     if employee.company_id != company_id:
#         return jsonify({"error": "El empleado no pertenece a esta company"}), 400

#     content = data.get("content")
#     if not content:
#         return jsonify({"error": "content requerido"}), 400

#     item = Suggestions(company_id=company_id,
#                        employee_id=employee_id, content=content)
#     db.session.add(item)
#     db.session.commit()
#     return jsonify(item.serialize()), 201


# VERSION NUEVA
@suggestions_bp.route("/", methods=["POST"])
@jwt_required()
def create_suggestion():
    company_id = get_jwt_company_id()
    if company_id is None:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    # 1) validar content
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "content required"}), 400
    if len(content) > 255:
        return jsonify({"error": "content must be at most 255 characters"}), 400

    # 2) validar employee_id del body y que sea el del token
    try:
        employee_id_body = int(data.get("employee_id"))
    except (TypeError, ValueError):
        return jsonify({"error": "employee_id must be an integer"}), 400

    me = current_employee_id()
    if employee_id_body != me:
        return jsonify({"error": "You can only create suggestions for yourself"}), 403

    # 3) comprobar que el empleado existe y pertenece a mi empresa
    employee = db.session.get(Employee, me)
    if not employee or employee.company_id != company_id:
        return jsonify({"error": "Employee not found"}), 404

    # 4) crear sugerencia
    item = Suggestions(
        company_id=company_id,
        employee_id=me,
        content=content,
    )

    try:
        db.session.add(item)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error creating suggestion"}), 400

    return jsonify(item.serialize()), 201

# AQUI SE PUEDE MODIFICAR CUALQUIER SUGERENCIA   BORRAR
# @suggestions_bp.route("/edit/<int:id>", methods=["PUT"])
# @jwt_required()
# def update_suggestion(id):
#     employee_id = int(get_jwt_identity())
#     employee = db.session.get(Employee, employee_id)
#     if not employee:
#         return jsonify({"error": "Employee not found"}), 404

#     suggestion = db.session.get(Suggestions, id)
#     if not suggestion:
#         return jsonify({"error": "Suggestion not found"}), 404

#     data = request.get_json(silent=True)
#     if not data:
#         return jsonify({"error": "JSON body required"}), 400

#     if "company_id" in data:
#         if not db.session.get(Company, data["company_id"]):
#             return jsonify({"error": f'Company id={data["company_id"]} does not exist'}), 400
#         suggestion.company_id = data["company_id"]

#     if "employee_id" in data:
#         employee = db.session.get(Employee, data["employee_id"])
#         if not employee:
#             return jsonify({"error": f'Employee id={data["employee_id"]} does not exist'}), 400
#         suggestion.employee_id = data["employee_id"]

#     employee = db.session.get(Employee, suggestion.employee_id)
#     if employee.company_id != suggestion.company_id:
#         return jsonify({"error": "El employee no pertenece a esta company"}), 400

#     if "content" in data:
#         suggestion.content = data["content"]

#     db.session.commit()
#     return jsonify(suggestion.serialize()), 200


# EMPLOYEE PUEDE EDITAR LA SUYA
# ADMIN PUEDE MODIFICAR TODAS
@suggestions_bp.route("/edit/<int:id>", methods=["PUT"])
@jwt_required()
def update_suggestion(id):
    company_id = get_jwt_company_id()
    if company_id is None:
        return jsonify({"error": "Unauthorized"}), 401

    item = db.session.get(Suggestions, id)
    if not item or item.company_id != company_id:
        return jsonify({"error": "Suggestion not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    if is_admin_or_hr() or is_ownerdb():
        if "content" in data:
            content = (data["content"] or "").strip()
            if not content:
                return jsonify({"error": "content required"}), 400
            if len(content) > 255:
                return jsonify({"error": "content must be at most 255 characters"}), 400
            item.content = content
        # No mover company_id/employee_id
    else:
        if item.employee_id != current_employee_id():
            return jsonify({"error": "Suggestion not found"}), 404
        if "content" in data:
            content = (data["content"] or "").strip()
            if not content:
                return jsonify({"error": "content required"}), 400
            if len(content) > 255:
                return jsonify({"error": "content must be at most 255 characters"}), 400
            item.content = content

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error updating suggestion"}), 400

    return jsonify(item.serialize()), 200

# AQUI SE PUEDE BORRAR CUALQUIERA  BORRAR
# @suggestions_bp.route("/delete/<int:id>", methods=["DELETE"])
# @jwt_required()
# def delete_suggestions(id):
#     employee_id = int(get_jwt_identity())
#     employee = db.session.get(Employee, employee_id)
#     if not employee:
#         return jsonify({"error": "Employee not found"}), 404

#     suggestion = db.session.get(Suggestions, id)
#     if not suggestion:
#         return jsonify({"error": "Suggestion not found"}), 404
#     db.session.delete(suggestion)
#     db.session.commit()
#     return jsonify({"message": f'Suggestion id={id} deleted'}), 200


# EMPLOYEE PUEDE BORRAR LAS SUYAS
# ADMIN PUEDE BORRAR CUALQUIERA DENTRO DE SU EMPRESA
@suggestions_bp.route("/delete/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_suggestion(id):
    company_id = get_jwt_company_id()
    if company_id is None:
        return jsonify({"error": "Unauthorized"}), 401

    item = db.session.get(Suggestions, id)
    if not item or item.company_id != company_id:
        return jsonify({"error": "Suggestion not found"}), 404

    if not (is_admin_or_hr() or is_ownerdb()) and item.employee_id != current_employee_id():
        return jsonify({"error": "Suggestion not found"}), 404

    try:
        db.session.delete(item)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error deleting suggestion"}), 400

    return jsonify({"message": f"Suggestion id={id} deleted"}), 200
