from flask import jsonify, Blueprint, request
from api.models import db, Company , Employee
from flask_cors import CORS
from sqlalchemy.exc import IntegrityError
from flask import Flask
from flask_bcrypt import Bcrypt
from flask_jwt_extended import get_jwt_identity, jwt_required
from api.utils_auth.helpers_auth import (
    get_jwt_company_id,
    is_ownerdb,
    get_system_role,
)


company_bp = Blueprint('company', __name__, url_prefix = '/companies')


CORS(company_bp)


#Con esta traemos todas las companies con cualquier usuario
# @company_bp.route("/", methods=["GET"])
# @jwt_required()
# def get_companies():
#     employee_id = int(get_jwt_identity())
#     employee = db.session.get(Employee, employee_id)
#     if not employee:
#         return jsonify({"error": "Employee not found"}), 404

#     companies = db.session.query(Company).all()
#     return jsonify([c.serialize() for c in companies]), 200


# Aqui GET /  COMPANIES
# OWNERDB DEVUELVE TODAS LAS EMPRESAS
# RESTO DE ROLES DEVUELVEN SU PROPIA EMPRESA
@company_bp.route("/", methods= ["GET"])
@jwt_required()
def get_companies():
    if is_ownerdb():
        companies = db.session.execute(db.select(Company)).scalars().all()
        return jsonify([companie.serialize() for companie in companies]), 200
    
    company_id = get_jwt_company_id()
    if company_id is None:
        return jsonify({"error": "Unauthorized"}), 401
    
    company = db.session.get(Company, company_id)
    return jsonify([company.serialize()] if company else []), 200


# AQUI CUALQUIERA PUEDE VER CUALQUIER EMPRESA
# @company_bp.route("/<int:id>", methods=["GET"])
# @jwt_required()
# def get_company(id):
#     employee_id = int(get_jwt_identity())
#     employee = db.session.get(Employee, employee_id)
#     if not employee:
#         return jsonify({"error": "Employee not found"}), 404                            
                       
#     company = db.session.get(Company, id)                              
#     if not company:
#         return jsonify({"error": "company not found"}), 404             
#     return jsonify(company.serialize()), 200 


# AQUI OWNERDB VE LA QUE QUIERA POR SU ID Y LOS DEMAS SOLO SU EMPRESA
@company_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_company(id):
    company = db.session.get(Company, id)
    if not company:
        return jsonify({"error": "Company not found"}), 404
    
    if is_ownerdb():
        return jsonify(company.serialize()), 200
    
    company_id = get_jwt_company_id()
    if company_id is None or company.id != company_id:
        return jsonify({"error": "Company not found"}), 404
    
    return jsonify(company.serialize()), 200


# con autorizacion
# @company_bp.route("/", methods=["POST"])
# @jwt_required()
# def create_company():
#     employee_id = int(get_jwt_identity())
#     employee = db.session.get(Employee, employee_id)
#     if not employee:
#         return jsonify({"error": "Employee not found"}), 404

#     data = request.json                                          
#     new_company = Company(name=data["name"], cif=data["cif"])       
#     db.session.add(new_company)                                     
#     db.session.commit()                                             
#     return jsonify(new_company.serialize()), 201                    

# para pruebas sin autorizacion
# @company_bp.route("/", methods=["POST"])
# def create_company():
#     data = request.get_json(silent=True)
#     if not data:
#         return jsonify({"error": "JSON body required"}), 400
#     if "name" not in data or "cif" not in data:
#         return jsonify({"error": "Missing required fields: name, cif"}), 400
#     new_company = Company(
#         name=data["name"],
#         cif=data["cif"]
#     )
#     db.session.add(new_company)
#     db.session.commit()
#     return jsonify(new_company.serialize()), 201


# POST COMPANIES QUE SOLO PUEDE HACER EL OWNERDB
@company_bp.route("/", methods = ["POST"])
@jwt_required()
def create_company():
    if not is_ownerdb():
        return jsonify({"error": "Forbidden"}), 403
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400
    
    name = (data.get("name") or "").strip()
    cif = (data.get("cif") or "").strip()
    if not name or not cif:
        return jsonify({"error": "Missing required fields: name, cif"}), 400
    
    company = Company(name=name, cif=cif)
    try:
        db.session.add(company)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Company with this cif may already exist"}), 409
    
    return jsonify(company.serialize()), 201


# AQUI PUEDE MODIFICAR CUALQUIER USER
# @company_bp.route("/edit/<int:id>", methods=["PUT"])                    
# @jwt_required()
# def update_company(id):
#     employee_id = int(get_jwt_identity())
#     employee = db.session.get(Employee, employee_id)
#     if not employee:
#         return jsonify({"error": "Employee not found"}), 404

#     company = db.session.get(Company, id)                           
#     if not company:
#         return jsonify({"error": "company not found"}), 404             

#     data = request.json                                             
#     company.name = data.get("name", company.name)                   
#     company.cif = data.get("cif", company.cif)                      
#     db.session.commit()                                             
#     return jsonify(company.serialize()), 200                        


# PUT / COMPANIES QUE SOLO PUEDE HACER EL OWNERDB
@company_bp.route("/edit/<int:id>", methods= ["PUT"])
@jwt_required()
def update_company(id):
    if not is_ownerdb():
        return jsonify({"error": "Forbidden"}), 403
    
    company = db.session.get(Company, id)
    if not company:
        return jsonify({"error": "Company not found"}), 404
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400
    
    if "name" in data:
        company.name = (data["name"] or "").strip()
    if "cif" in data:
        company.cif = (data["cif"] or "").strip()

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "CIF already in use"}), 409
    
    return jsonify(company.serialize()), 200


# AQUI CUALQUIERA PUEDE BORRAR UNA COMPAÑIA POR EL ID
# @company_bp.route("/delete/<int:id>", methods=["DELETE"])                
# @jwt_required()
# def delete_company(id):
#     employee_id = int(get_jwt_identity())
#     employee = db.session.get(Employee, employee_id)
#     if not employee:
#         return jsonify({"error": "Employee not found"}), 404

#     company = db.session.get(Company, id)
#     if not company:                                                 
#          return jsonify({"error": "company not found"}), 404
    
#     db.session.delete(company)                                      
#     db.session.commit()                                             
#     return jsonify({"message": f"Company id={id} deleted"}), 200   


# AQUI SOLO EL OWNERDB PUEDE BORRAR UNA EMPRESA
@company_bp.route("/delete/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_company(id):
    if not is_ownerdb():
        return jsonify({"error": "Forbidden"}), 403
    
    company = db.session.get(Company, id)
    if not company:
        return jsonify({"error": "Company not found"}), 404
    
    try:
        db.session.delete(company)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Cannot delete company with related data"}), 400
    
    return jsonify({"message": f"Company id={id} deleted"}), 200