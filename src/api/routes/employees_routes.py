from flask import jsonify, Blueprint, request, render_template
from api.models import db, Employee, Company, Role
from flask_cors import CORS
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from flask_mail import Message
# import app
from api.mail_config import mail
# import cloudinary
# import cloudinary.uploader
# from cloudinary import CloudinaryImage


employee_bp = Blueprint('employee', __name__,
                        url_prefix='/employees', template_folder="../template")

CORS(employee_bp)


@employee_bp.route("/", methods=["GET"])
@jwt_required()
def get_employees():
    employee_id = get_jwt_identity()
    employee = db.session.get(Employee, int(employee_id))
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    employees = db.session.query(Employee).all()
    return jsonify([e.serialize() for e in employees]), 200


@employee_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_employee():

    employee_id = get_jwt_identity()
    employee = db.session.get(Employee, int(employee_id))
    if not employee:
        return jsonify({"error": "Employee not found"}), 404
    return jsonify(employee.serialize()), 200

# con autorizacion


@employee_bp.route("/", methods=["POST"])
@jwt_required()
def create_employee():

    employee_id = get_jwt_identity()
    employee = db.session.get(Employee, int(employee_id))
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    data = request.get_json(silent=True)

    if not data["email"] or not data["password"]:
        return jsonify({"error": "JSON body required"}), 400

    existing_employee = db.session.execute(db.select(Employee).where(
        Employee.email == data["email"]
    )).scalar_one_or_none()

    if existing_employee:
        return jsonify({"msg": "Employee with this email already exist"}), 400

    # company_id requerido y valido
    company_id = data.get("company_id")
    if not company_id or not db.session.get(Company, company_id):
        return jsonify({"error": "company_id invalid"}), 400

    # role id
    role_id = data.get("role_id")
    if role_id and not db.session.get(Role, role_id):
        return jsonify({"error": f"Role id={role_id} does not exist"}), 400

    # hash

    new_employee = Employee(
        company_id=company_id,
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        dni=data.get("dni"),
        address=data.get("address"),
        seniority=data.get("seniority"),
        email=data.get("email"),
        role_id=role_id,
        birth=data.get("birth"),
        phone=data.get("phone"),
    )
    new_employee.set_password(data["password"])

    html_welcome = render_template(
        'welcome.html', first_name=new_employee.first_name)


    msg = Message(
    subject="Welcome to family CrewGeeks",
    recipients=[new_employee.email],
    html=html_welcome
    )

    mail.send(msg)

    db.session.add(new_employee)
    db.session.commit()

    return jsonify(new_employee.serialize()), 201

# para pruebas
# @employee_bp.route("/", methods=["POST"])
# def create_employee():
#     data = request.get_json(silent=True)
#     if not data:
#         return jsonify({"error": "JSON body required"}), 400
#     if not data.get("email") or not data.get("password"):
#         return jsonify({"error": "Missing required fields: email, password"}), 400
#     # comprobar que el email no exista
#     existing_employee = db.session.execute(
#         db.select(Employee).where(Employee.email == data["email"])
#     ).scalar_one_or_none()
#     if existing_employee:
#         return jsonify({"msg": "Employee with this email already exists"}), 400
#     # company_id requerido y válido
#     company_id = data.get("company_id")
#     if not company_id or not db.session.get(Company, company_id):
#         return jsonify({"error": "company_id invalid"}), 400
#     # role_id opcional pero debe existir
#     role_id = data.get("role_id")
#     if role_id and not db.session.get(Role, role_id):
#         return jsonify({"error": f"Role id={role_id} does not exist"}), 400
#     # crear empleado
#     new_employee = Employee(
#         company_id = company_id,
#         first_name = data.get("first_name"),
#         last_name  = data.get("last_name"),
#         dni        = data.get("dni"),
#         address    = data.get("address"),
#         seniority  = data.get("seniority"),
#         email      = data.get("email"),
#         role_id    = role_id,
#         birth      = data.get("birth"),
#         phone      = data.get("phone"),
#     )
#     new_employee.set_password(data["password"])
#     db.session.add(new_employee)
#     db.session.commit()
#     return jsonify(new_employee.serialize()), 201


@employee_bp.route("/edit/<int:id>", methods=["PUT"])
@jwt_required()
def update_employee(id):
    # employee_id = get_jwt_identity()           esto cuando tengamos admin
    # sera int(employee_id) cuando tengamos admin
    employee = db.session.get(Employee, id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    # Validar/actualizar Foreign keys
    if "company_id" in data:
        if not db.session.get(Company, data["company_id"]):
            return jsonify({"error": f"Company id={data["company_id"]} does not exist"}), 400
        employee.company_id = data["company_id"]

    if "role_id" in data:
        if data["role_id"] and not db.session.get(Role, data["role_id"]):
            return jsonify({"error": f"Role id={data["role_id"]} does not exist"}), 400
        employee.role_id = data["role_id"]

    # actualizar campos
    for field in ["first_name", "last_name", "dni", "address", "seniority", "email", "birth", "phone"]:
        if field in data:
            setattr(employee, field, data[field])

    # re-hash

    db.session.commit()
    return jsonify(employee.serialize()), 200


# ESTA RUTA HABRA QUE TOCARLA, CON PERMISOS QUE PUEDA BORRAR CUALQUIER EMPLOYEE, COMO EMPLEADO NORMAL, ESTA RUTA ESTARA BLOQUEADA.
@employee_bp.route("/delete/<int:id>", methods=["DELETE"])
@jwt_required()  # NECESITAREMOS REQUIRED ROLE PARA GESTIONAR ESTE ENDPOINT
def delete_employee(id):
    # employee_id = get_jwt_identity()
    employee = db.session.get(Employee, id)  # sera int(employee_id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    db.session.delete(employee)
    db.session.commit()
    return jsonify({"message": f"Employee id={id} deleted"}), 200

#login sin comprobaciones
@employee_bp.route('/login', methods=["POST"])
def login():
    data = request.get_json()

    if not data["email"] or not data["password"]:
        return jsonify({"error": "JSON body required"}), 400

    employee = db.session.execute(db.select(Employee).where(
        Employee.email == data["email"]
    )).scalar_one_or_none()

    if employee is None:
        return ({"msg": "Invalid email or password"}), 401

    if employee.check_password(data["password"]):
        access_token = create_access_token(identity=str(employee.id))
        return jsonify({"msg": "Login successful", "token": access_token}), 200
    else:
        return jsonify({"msg": "Invalid email or password"}), 401


      
#nueva ruta de login con comprobaciones de administrador
# @employee_bp.route('/login', methods= ["POST"])
# def login():
#     data = request.get_json(silent=True)
#     if not data or not data.get("email") or not data.get("password"):
#         return jsonify({"error": "JSON body required"}), 400
    

#     employee = db.session.execute(
#         db.select(Employee).where(Employee.email == data["email"])
#     ).scalar_one_or_none()

#     if employee is None or not employee.check_password(data["password"]):
#         return jsonify({"msg": "Invalid email or password"}), 401
    
#     # aqui cogemos el rol de la tabla de roles
#     role_name = (employee.role.name if getattr(employee, "role", None) else "") or ""
#     # quitamos espacios en blanco y convertimos a minuscula
#     role_lower = role_name.strip().lower()
#     if "admin" in role_lower:
#         system_role = "ADMIN"
#     elif "hr" in role_lower or "recursos" in role_lower:
#         system_role = "HR"
#     else:
#         system_role = "EMPLOYEE"

#     # con esto, incluimos company_id y system_role en el token para poder gestionar permisos
#     additional_claims = {
#         "company_id": employee.company_id,
#         "system_role": system_role
#     }
#     access_token = create_access_token(identity=str(employee.id), additional_claims=additional_claims)
#     return jsonify({"msg": "Login succesful", "token": access_token}), 200




# cloudinary
# @employee_bp.route("/upload-img", methods=["POST"])
# @jwt_required()
# def upload_ing():
#     employee_id = get_jwt_identity()
#     file = request.files.get("file")
#     employee = db.session.get(Employee, int(employee_id))
#     if not file:
#         return jsonify({"error": "No se envio el archivo "}), 400
#     upload_result = cloudinary.uploader.upload(file)

#     # Obtenemos el public_id de la imagen subida desde upload_result
#     public_id = upload_result.get("public_id")

#     image = CloudinaryImage(public_id)
#     transformed_url = image.build_url(
#         transformation=[
#             {"crop": "fill", "gravity": "face", "width": 400, "height": 400}
#         ]
#     )

#     employee.image = transformed_url

#     db.session.commit()
#     return jsonify({"msg": "ya esta en la nube", "imageUrl": upload_result["secure_url"]}), 200

