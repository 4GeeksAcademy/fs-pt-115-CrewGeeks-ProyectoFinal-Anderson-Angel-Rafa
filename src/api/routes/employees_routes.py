from flask import jsonify, Blueprint, request, render_template
from api.models import db, Employee, VacationBalance, Holidays, Payroll, Shifts, ShiftSeries, Suggestions, TimePunch, Role, Company
from flask_cors import CORS
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    get_jwt,
    jwt_required,
    create_refresh_token,
)
from flask_mail import Message
from sqlalchemy.exc import IntegrityError
from api.mail_config import mail
from datetime import timedelta
from ..commands import seed_defaults
# import app
import cloudinary
import cloudinary.uploader
from cloudinary import CloudinaryImage

from api.utils_auth.helpers_auth import (
    get_jwt_company_id,
    is_admin_or_hr,
    is_ownerdb,
    current_employee_id,
)


employee_bp = Blueprint(
    "employee", __name__, url_prefix="/employees", template_folder="../template"
)

CORS(employee_bp)

@employee_bp.route("/create", methods=["GET"])
def run_seed():
    seed_defaults()
    return jsonify({"message:" "ok"})

# AQUI
# OWNERDB TRAE A TODOS LOS EMPLEADOS
# ADMIN/HR TRAEN A LOS EMPLEADOS DE SU EMPRESA
# EMPLOYEE ES 403/FORBIDDEN
@employee_bp.route("/", methods=["GET"])
@jwt_required()
def get_employees():
    if is_ownerdb():
        company_id_query = request.args.get("company_id")
        if company_id_query is not None:
            try:
                company_id_query = int(company_id_query)
            except (TypeError, ValueError):
                return jsonify({"error": "company_id must be an integer"}), 400
            employees = (
                db.session.execute(
                    db.select(Employee).where(Employee.company_id == company_id_query)
                )
                .scalars()
                .all()
            )
        else:
            employees = db.session.execute(db.select(Employee)).scalars().all()
        return jsonify([e.serialize() for e in employees]), 200

    if not is_admin_or_hr():
        return jsonify({"error": "Forbidden"}), 403

    company_id = get_jwt_company_id()
    if company_id is None:
        return jsonify({"error": "Unauthorized"}), 401

    employees = (
        db.session.execute(db.select(Employee).where(Employee.company_id == company_id))
        .scalars()
        .all()
    )

    return jsonify([e.serialize() for e in employees]), 200


# GET EMPLOYEES PROFILE
@employee_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_employee_profile():
    employee = db.session.get(Employee, current_employee_id())
    if not employee:
        return jsonify({"error": "Employee not found"}), 404
    return jsonify(employee.serialize()), 200


# @employee_bp.route("/<int:employee_id>", methods=["GET"])
# @jwt_required()
# def get_employee_by_id(employee_id):
#     employee = db.session.get(Employee, employee_id)
#     if not employee:
#         return jsonify({"error": "Employee not found"}), 404

#     if is_ownerdb():
#         return jsonify(employee.serialize()), 200

#     company_id = get_jwt_company_id()
#     if company_id is None or employee.company_id != company_id:
#         return jsonify({"error": "Employee not found"}), 404

#     if is_admin_or_hr or current_employee_id == employee_id:
#         return jsonify(employee.serialize()), 200

#     return jsonify({"error": "Employee not found"}), 404


# POST EMPLOYEES
# OWNERDB PUEDE CREAR PARA CUALQUIER EMPRESA
# ADMIN/HR PUEDE CREAR PARA SU PROPIA EMPRESA
@employee_bp.route("/", methods=["POST"])
@jwt_required()
def create_employee():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "Missing required fields: email, password"}), 400

    # Unicidad
    if db.session.execute(
        db.select(Employee).where(Employee.email == email)
    ).scalar_one_or_none():
        return jsonify({"error": "Employee with this email already exists"}), 409

    dni = data.get("dni")
    if (
        dni
        and db.session.execute(
            db.select(Employee).where(Employee.dni == dni)
        ).scalar_one_or_none()
    ):
        return jsonify({"error": "Employee with this DNI already exists"}), 409

    # role_id válido (y opcionalmente del mismo tenant si tienes Opción B)
    try:
        role_id = int(data.get("role_id"))
    except (TypeError, ValueError):
        return jsonify({"error": "role_id is invalid or missing"}), 400

    role = db.session.get(Role, role_id)
    if not role:
        return jsonify({"error": "role_id is invalid or missing"}), 400

    # Scoping por rol
    if is_ownerdb():
        try:
            company_id_body = int(data.get("company_id"))
        except (TypeError, ValueError):
            return jsonify({"error": "company_id must be an integer"}), 400
        if not db.session.get(Company, company_id_body):
            return jsonify({"error": "company_id invalid"}), 400
        target_company_id = company_id_body
    else:
        if not is_admin_or_hr():
            return jsonify({"error": "Forbidden"}), 403
        target_company_id = get_jwt_company_id()
        if target_company_id is None:
            return jsonify({"error": "Unauthorized"}), 401

        if data.get("company_id") is not None:
            try:
                body_company_id = int(data["company_id"])
            except (TypeError, ValueError):
                return jsonify({"error": "company_id must be an integer"}), 400
            if body_company_id != target_company_id:
                return (
                    jsonify(
                        {"error": "You cannot create employees in another company"}
                    ),
                    403,
                )

    if hasattr(role, "company_id") and role.company_id != target_company_id:
        return jsonify({"error": "role_id does not belong to the target company"}), 400

    new_employee = Employee(
        company_id=target_company_id,
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        dni=dni,
        address=data.get("address"),
        seniority=data.get("seniority"),
        email=email,
        role_id=role_id,
        birth=data.get("birth"),
        phone=data.get("phone"),
    )
    new_employee.set_password(password)

    # Email de bienvenida
    try:
        html_welcome = render_template(
            "welcome.html", first_name=new_employee.first_name or ""
        )
        msg = Message(
            subject="Welcome to CrewGeeks",
            recipients=[new_employee.email],
            html=html_welcome,
        )
        # mail.send(msg)
        response = mail.send(msg)
        print(response)
    except Exception:
        pass

    try:
        db.session.add(new_employee)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error creating employee"}), 400

    return jsonify(new_employee.serialize()), 201


# AQUI OWNERDB EDITA CUALQUIER EMPLEADO Y ADMIN/HR SOLO A LOS DE SU EMPRESA
@employee_bp.route("/edit/<int:id>", methods=["PUT"])
@jwt_required()
def update_employee(id: int):
    employee = db.session.get(Employee, id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404

    # Quién soy
    try:
        current_user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        current_user_id = None

    i_am_owner = is_ownerdb()
    i_am_admin_or_hr = is_admin_or_hr()
    same_company = False
    jwt_company_id = get_jwt_company_id()

    if jwt_company_id is not None:
        same_company = (employee.company_id == jwt_company_id)

    # ------- Autorización -------
    if i_am_owner:
        # owner puede editar a cualquiera
        pass
    elif i_am_admin_or_hr:
        # admin/hr solo dentro de su empresa
        if not same_company:
            return jsonify({"error": "Employee not found"}), 404
    else:
        # empleado normal: solo puede editarse a sí mismo
        if current_user_id != employee.id:
            return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    # ------- Qué campos se pueden editar -------
    # Admin/HR/Owner pueden editar más campos
    ADMIN_ALLOWED_FIELDS = {
        "first_name", "last_name", "dni", "address", "seniority",
        "email", "birth", "phone"
    }
    # Empleado normal: restringido a datos “personales”
    SELF_ALLOWED_FIELDS = {"address", "phone", "birth", "email"}

    allowed_fields = ADMIN_ALLOWED_FIELDS if (i_am_owner or i_am_admin_or_hr) else SELF_ALLOWED_FIELDS

    # role_id: solo owner o admin/hr
    if "role_id" in data:
        if not (i_am_owner or i_am_admin_or_hr):
            return jsonify({"error": "Not allowed to change role"}), 403
        role_id_value = data["role_id"]
        if role_id_value and not db.session.get(Role, role_id_value):
            return jsonify({"error": f"Role id={role_id_value} does not exist"}), 400
        employee.role_id = role_id_value

    # Actualizar campos permitidos según el rol
    for field in allowed_fields:
        if field in data:
            setattr(employee, field, data[field])

    try:
        db.session.commit()
    except IntegrityError as e:
        db.session.rollback()
        # Puede ser colisión de email único u otra FK/unique
        return jsonify({"error": "Integrity error updating employee"}), 409

    return jsonify(employee.serialize()), 200



# AQUI OWNERDB PUEDE BORRAR CUALQUIER EMPLEADO Y ADMIN/HR SOLO DE SU EMPRESA
@employee_bp.route("/delete/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_employee(id: int):
    # Bloqueo owner auto-borrado:
    claims = get_jwt()
    if (claims.get("system_role") or "").upper() == "OWNERDB":
        try:
            if int(get_jwt_identity()) == id:
                return jsonify({"error": "Owner cannot delete own account"}), 403
        except (TypeError, ValueError):
            return jsonify({"error": "Unauthorized"}), 401

    target = db.session.get(Employee, id)
    if not target:
        return jsonify({"error": "Employee not found"}), 404

    try:
        
        db.session.query(TimePunch).filter_by(employee_id=id).delete(synchronize_session=False)
        db.session.query(Suggestions).filter_by(employee_id=id).delete(synchronize_session=False)
        db.session.query(Shifts).filter_by(employee_id=id).delete(synchronize_session=False)
        db.session.query(ShiftSeries).filter_by(employee_id=id).delete(synchronize_session=False)
        db.session.query(Payroll).filter_by(employee_id=id).delete(synchronize_session=False)
        # Holidays: puede referenciar al empleado en dos FKs
        db.session.query(Holidays).filter_by(employee_id=id).delete(synchronize_session=False)
        db.session.query(Holidays).filter_by(approved_user_id=id).update(
            {"approved_user_id": None}, synchronize_session=False
        )
        db.session.query(VacationBalance).filter_by(employee_id=id).delete(synchronize_session=False)

        
        db.session.delete(target)
        db.session.commit()
        return jsonify({"message": f"Employee id={id} deleted"}), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Integrity error deleting employee"}), 400


# nueva ruta de login con comprobaciones de administrador
@employee_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "JSON body required"}), 400

    employee = db.session.execute(
        db.select(Employee).where(Employee.email == data["email"])
    ).scalar_one_or_none()

    if employee is None or not employee.check_password(data["password"]):
        return jsonify({"msg": "Invalid email or password"}), 401

    role_name = (employee.role.name if getattr(employee, "role", None) else "") or ""
    role_norm = (
        role_name.strip().lower().replace("-", "").replace("_", "").replace(" ", "")
    )

    if "ownerdb" in role_norm:
        system_role = "OWNERDB"
    elif "admin" in role_norm:
        system_role = "ADMIN"
    elif "hr" in role_norm or "recursos" in role_norm or "rrhh" in role_norm:
        system_role = "HR"
    else:
        system_role = "EMPLOYEE"

    additional_claims = {"company_id": employee.company_id, "system_role": system_role}
    access_token = create_access_token(
        identity=str(employee.id), additional_claims=additional_claims
    )
    refresh_token = create_refresh_token(identity=str(employee.id))
    return (
        jsonify(
            {
                "msg": "Login succesful",
                "token": access_token,
                "refresh_token": refresh_token,
                "user": employee.serialize(),
            }
        ),
        200,
    )


@employee_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh_access():
    user_id = get_jwt_identity()
    employee = db.session.get(Employee, user_id)
    if not employee:
        return jsonify({"error": "Empleado no encontrado"}), 404

    system_role = getattr(employee, "system_role", None)
    if not system_role and getattr(employee, "role", None):
        system_role = getattr(employee.role, "name", None)
    if not system_role:
        system_role = "EMPLOYEE"

    claims = {
        "system_role": system_role,
        "company_id": getattr(employee, "company_id", None),
        "email": getattr(employee, "email", None),
        "roles": [system_role],
    }

    new_access = create_access_token(identity=user_id, additional_claims=claims)
    return jsonify({"access_token": new_access}), 200


# CLOUDINARY
@employee_bp.route("/upload-img", methods=["POST"])
@jwt_required()
def upload_ing():
    employee_id = get_jwt_identity()
    file = request.files.get("file")
    employee = db.session.get(Employee, int(employee_id))
    if not file:
        return jsonify({"error": "No se envio el archivo "}), 400
    upload_result = cloudinary.uploader.upload(file)

    # Obtenemos el public_id de la imagen subida desde upload_result
    public_id = upload_result.get("public_id")

    image = CloudinaryImage(public_id)
    transformed_url = image.build_url(
        transformation=[
            {"crop": "fill", "gravity": "face", "width": 400, "height": 400}
        ]
    )

    employee.image = transformed_url

    db.session.commit()
    return (
        jsonify({"msg": "ya esta en la nube", "imageUrl": upload_result["secure_url"]}),
        200,
    )


@employee_bp.route("/delete-img", methods=["DELETE"])
@jwt_required()
def delete_img():
    employee_id = get_jwt_identity()
    employee = db.session.get(Employee, int(employee_id))

    if not employee:
        return jsonify({"error": "Empleado no encontrado"}), 404

    if not employee.image:
        return jsonify({"msg": "No hay imagen para eliminar"}), 400

    try:
        # Si guardas el public_id en vez de la URL, podrías llamar:
        # cloudinary.uploader.destroy(public_id)
        # Aquí solo quitamos la referencia de la BD
        employee.image = None
        db.session.commit()
        return jsonify({"msg": "Imagen eliminada correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@employee_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    try:
        data = request.get_json(silent=True) or {}
        old_password = (data.get("old_password") or "").strip()
        new_password = (data.get("new_password") or "").strip()

        if not old_password or not new_password:
            return jsonify({"error": "old_password y new_password son requeridos"}), 400
        if len(new_password) < 8:
            return (
                jsonify(
                    {"error": "La nueva contraseña debe tener al menos 8 caracteres"}
                ),
                400,
            )

        emp_id = get_jwt_identity()
        employee = db.session.get(Employee, int(emp_id))
        if not employee:
            return jsonify({"error": "Empleado no encontrado"}), 404

        if not employee.check_password(old_password):
            return jsonify({"error": "La contraseña actual no es correcta"}), 401

        employee.set_password(new_password)
        db.session.commit()

        return jsonify({"msg": "Contraseña actualizada correctamente"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
