from flask import jsonify, Blueprint, request
from api.models import db, Company
from flask_cors import CORS
from flask import Flask
from flask_bcrypt import Bcrypt

company_bp = Blueprint('company', __name__, url_prefix = '/companies')

CORS(company_bp)

@company_bp.route("/", methods=["GET"])
def get_companies():
    companies = db.session.query(Company).all()
    return jsonify([c.serialize() for c in companies]), 200


@company_bp.route("/<int:id>", methods=["GET"])
def get_company(id):                                               
    company = db.session.get(Company, id)                              
    if not company:
        return jsonify({"error": "company not found"}), 404             
    return jsonify(company.serialize()), 200                         
    


@company_bp.route("/", methods=["POST"])
def create_company():
    data = request.json                                          
    new_company = Company(name=data["name"], cif=data["cif"])       
    db.session.add(new_company)                                     
    db.session.commit()                                             
    return jsonify(new_company.serialize()), 201                    


@company_bp.route("/<int:id>", methods=["PUT"])                    
def update_company(id):
    company = db.session.get(Company, id)                           
    if not company:
        return jsonify({"error": "company not found"}), 404             

    data = request.json                                             
    company.name = data.get("name", company.name)                   
    company.cif = data.get("cif", company.cif)                      
    db.session.commit()                                             
    return jsonify(company.serialize()), 200                        


@company_bp.route("/<int:id>", methods=["DELETE"])                
def delete_company(id):
    company = db.session.get(Company, id)
    if not company:                                                 
         return jsonify({"error": "company not found"}), 404
    
    db.session.delete(company)                                      
    db.session.commit()                                             
    return jsonify(company.serialize()), 200    