"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User
from api.utils import generate_sitemap, APIException
from flask_cors import CORS

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)


@api.route("/companies", methods=["GET"] )
def get_companies():
    companies = db.session.query(Company).all()                     #consulta de todas las filas de "company" + all para traer registros
    return jsonify([c.serialize() for c in companies]), 200         #diccionario JSON // 200 OK



@api.route("/companies/<int:id>, methods=["GET"])
def get_company(id):                                                #id para representar la empresa
    company = db.session.get(company, id)                               #consulta empresa usando id
    if not company:
    return jsonify({"error": "company not found"}), 404             #si no existe error 404 y jsonifica el erro
    return jsonify(company.serialize()), 200                        #respuesta, formato json y metodo serialize. 
    


@api.route("/companies", methods=["POST"])
def create_company():
    data = request.jsonify                                          #recibe datos en formato json
    new_company = company(name=data["name"], cif=data["cif"])       #crear nueva instancia, ejemplo: creweeks, cif 123456789
    db.session.add(new_company)                                     #agregar nuevo objeto
    db.session.commit()                                             #ejecuto
    return jsonify(new_company.serialize()), 201                    #respuesta, formato json y metodo serialize


@api.route("/companies/<int:id>", methods="PUT")                    
def update_company(id):
    company = db.session.get(company, id)                           #busca la tabla copmany con su id
    if not company:
    return jsonify({"error": "company not found"}), 404             #devuelve error

    data = request.json                                             #recibe los nuevos valores en formato JSON
    company.name = data.get("name", company.name)                   #actualiza el nombre
    copmany.cif = data.get("cif", company.cif)                      #actualiza el cif
    db.session.commit()                                             #ejecuto
    return jsonify(company.serialize()), 200                        #respuesta, formato json y metodo serialize


@api.route("/companies/<int:id>", methods=["DELETE"])                #busca la tabla copmany con su id
def delete_company(id):
    company = db.session.get(company, id)
    if not company:                                                 #error por si la empresa no esta registrada
    return jsonify({"error": "company not found"}), 404
    db.session.delete(company)                                      #eliminar objeto
    db.session.commit()                                             #ejecutrar
    return jsonify(company.serialize()), 200                        #respuesta, formato json y metodo serialize


##@api.route('/hello', methods=['POST', 'GET'])
##def handle_hello():
##
##    response_body = {
##        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
##   }
##
##    return jsonify(response_body), 200
