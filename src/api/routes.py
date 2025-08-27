"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, Company, Employee, User
from api.utils import generate_sitemap, APIException
from flask_cors import CORS

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)

#tabla companies

@api.route("/companies", methods=["GET"] )
def get_companies():
    companies = db.session.query(Company).all()                     #consulta de todas las filas de "company" + all para traer registros
    return jsonify([c.serialize() for c in companies]), 200         #diccionario JSON // 200 OK



@api.route("/companies/<int:id>, methods=["GET"])
def get_company(id):                                                #id para representar la empresa
    company = db.session.get(Company, id)                               #consulta empresa usando id
    if not company:
    return jsonify({"error": "company not found"}), 404             #si no existe error 404 y jsonifica el erro
    return jsonify(company.serialize()), 200                        #respuesta, formato json y metodo serialize. 
    


@api.route("/companies", methods=["POST"])
def create_company():
    data = request.jsonify                                          #recibe datos en formato json
    new_company = Company(name=data["name"], cif=data["cif"])       #crear nueva instancia, ejemplo: creweeks, cif 123456789
    db.session.add(new_company)                                     #agregar nuevo objeto
    db.session.commit()                                             #ejecuto
    return jsonify(new_company.serialize()), 201                    #respuesta, formato json y metodo serialize


@api.route("/companies/<int:id>", methods="PUT")                    
def update_company(id):
    company = db.session.get(Company, id)                           #busca la tabla copmany con su id
    if not company:
    return jsonify({"error": "company not found"}), 404             #devuelve error

    data = request.json                                             #recibe los nuevos valores en formato JSON
    company.name = data.get("name", company.name)                   #actualiza el nombre
    copmany.cif = data.get("cif", company.cif)                      #actualiza el cif
    db.session.commit()                                             #ejecuto
    return jsonify(company.serialize()), 200                        #respuesta, formato json y metodo serialize


@api.route("/companies/<int:id>", methods=["DELETE"])                #busca la tabla copmany con su id
def delete_company(id):
    company = db.session.get(Company, id)
    if not Company:                                                 #error por si la empresa no esta registrada
    return jsonify({"error": "company not found"}), 404
    db.session.delete(Company)                                      #eliminar objeto
    db.session.commit()                                             #ejecutrar
    return jsonify(company.serialize()), 200                        #respuesta, formato json y metodo serialize


#tabla employees

@api.route("/employees", methods=["GET"])
def get_employees():
    employess = db.session.query(Employee).all()                    #consulta tablea de employee y trae los registros
    return jsonify([e.serialize() for e in employees]), 200              #recorre cada objeto y lo convierte json


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
        return jsonify({"error": "JSON body requerido"})