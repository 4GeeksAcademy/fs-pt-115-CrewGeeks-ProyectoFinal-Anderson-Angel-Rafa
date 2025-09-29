from flask import Blueprint, request, jsonify
from api.models import db, Contact
from flask_cors import CORS

contact_bp = Blueprint("contacts", __name__,url_prefix="/contacts")
CORS(contact_bp)

@contact_bp.route("/", methods=["GET"])
def get_contacts():
    contacts = Contact.query.all()
    return jsonify([c.serialize() for c in contacts]), 200


@contact_bp.route("/", methods=["POST"])
def create_contact():
    data = request.get_json()

    try:
        new_contact = Contact(
            name=data.get("name"),
            email=data.get("email"),
            company=data.get("company"),
            phone=data.get("phone"),
            subject=data.get("subject"),
            message=data.get("message")
        )

        db.session.add(new_contact)
        db.session.commit()

        return jsonify(new_contact.serialize()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
    
@contact_bp.route("/<int:contact_id>", methods=["DELETE"])
def delete_contact(contact_id):
    try:
        contact = Contact.query.get(contact_id)
        if not contact:
            return jsonify({"error": "Contacto no encontrado"}), 404

        db.session.delete(contact)
        db.session.commit()

        return jsonify({"message": f"Contacto con id {contact_id} eliminado"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
    

