from flask import jsonify, Blueprint, request
from api.models import db, Company
from flask_cors import CORS
from flask import Flask
from flask_bcrypt import Bcrypt
from flask_jwt_extended import get_jwt_identity, jwt_required

company_bp = Blueprint('company', __name__, url_prefix = '/companies')

CORS(company_bp)

@company_bp.route("/", methods=["GET"])
@jwt_required()
def get_companies():
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    companies = db.session.query(Company).all()
    return jsonify([c.serialize() for c in companies]), 200


@company_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_company(id):
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404                            
                       
    company = db.session.get(Company, id)                              
    if not company:
        return jsonify({"error": "company not found"}), 404             
    return jsonify(company.serialize()), 200                         
    


@company_bp.route("/", methods=["POST"])
@jwt_required()
def create_company():
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    data = request.json                                          
    new_company = Company(name=data["name"], cif=data["cif"])       
    db.session.add(new_company)                                     
    db.session.commit()                                             
    return jsonify(new_company.serialize()), 201                    


@company_bp.route("/<int:id>", methods=["PUT"])                    
@jwt_required()
def update_company(id):
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    company = db.session.get(Company, id)                           
    if not company:
        return jsonify({"error": "company not found"}), 404             

    data = request.json                                             
    company.name = data.get("name", company.name)                   
    company.cif = data.get("cif", company.cif)                      
    db.session.commit()                                             
    return jsonify(company.serialize()), 200                        


@company_bp.route("/<int:id>", methods=["DELETE"])                
@jwt_required()
def delete_company(id):
    employee_id = int(get_jwt_identity())
    employee = db.session.get(Employee, employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    company = db.session.get(Company, id)
    if not company:                                                 
         return jsonify({"error": "company not found"}), 404
    
    db.session.delete(company)                                      
    db.session.commit()                                             
    return jsonify(company.serialize()), 200    