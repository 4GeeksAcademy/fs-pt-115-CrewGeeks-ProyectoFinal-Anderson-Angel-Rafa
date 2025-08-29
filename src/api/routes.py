"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, Company, Employee, User, Role
from api.utils import generate_sitemap, APIException
from flask_cors import CORS

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)

# tabla companies


@api.route("/companies", methods=["GET"])
def get_companies():
    companies = db.session.query(Company).all()
    return jsonify([c.serialize() for c in companies]), 200


@api.route("/companies/<int:id>", methods=["GET"])
def get_company(id):                                               
    company = db.session.get(Company, id)                              
    if not company:
        return jsonify({"error": "company not found"}), 404             
    return jsonify(company.serialize()), 200                         
    


@api.route("/companies", methods=["POST"])
def create_company():
    data = request.json                                          
    new_company = Company(name=data["name"], cif=data["cif"])       
    db.session.add(new_company)                                     
    db.session.commit()                                             
    return jsonify(new_company.serialize()), 201                    


@api.route("/companies/<int:id>", methods=["PUT"])                    
def update_company(id):
    company = db.session.get(Company, id)                           
    if not company:
        return jsonify({"error": "company not found"}), 404             

    data = request.json                                             
    company.name = data.get("name", company.name)                   
    company.cif = data.get("cif", company.cif)                      
    db.session.commit()                                             
    return jsonify(company.serialize()), 200                        


@api.route("/companies/<int:id>", methods=["DELETE"])                
def delete_company(id):
    company = db.session.get(Company, id)
    if not company:                                                 
         return jsonify({"error": "company not found"}), 404
    
    db.session.delete(company)                                      
    db.session.commit()                                             
    return jsonify(company.serialize()), 200                        


#tabla employees

@api.route("/employees", methods=["GET"])
def get_employees():
    employees = db.session.query(Employee).all()                   
    return jsonify([e.serialize() for e in employees]), 200              


@api.route('/employees/<int:id>', methods=['GET'])
def get_employee(id):
    employee = db.session.get(Employee, id)
    if not employee:
            return jsonify({"error": "Employee not found"}), 404
    return jsonify(employee.serialize()), 200

@api.route("/employees", methods=["POST"])
def create_employee():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    # company_id requerido y valido
    company_id = data.get("company_id")
    if not company_id or not db.session.get(Company, company_id):
        return jsonify({"error": "company_id invalido"}), 400

    # role id
    role_id = data.get("role_id")
    if role_id and not db.session.get(Role, role_id):
        return jsonify({"error": f"Role id={role_id} no existe"}), 400

    # user_id
    user_id = data.get("user_id")
    if user_id and not db.session.get(User, user_id):
        return jsonify({"error": f"User id={user_id} no existe"}), 400

    
    new_employee = Employee(
        company_id = company_id,
        user_id    = user_id,
        first_name = data.get("first_name"),
        last_name  = data.get("last_name"),
        dni        = data.get("dni"),
        address    = data.get("address"),
        seniority  = data.get("seniority"),
        email      = data.get("email"),
        role_id    = role_id
    )

    db.session.add(new_employee)
    db.session.commit()
    return jsonify(new_employee.serialize()), 201

@api.route("/employees/<int:id>", methods=["PUT"])
def update_employee(id):
    employee = db.session.get(Employee, id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400
    
    