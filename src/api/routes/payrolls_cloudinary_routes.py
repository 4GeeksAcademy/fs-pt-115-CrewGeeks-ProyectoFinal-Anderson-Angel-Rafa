from flask import Blueprint, request, jsonify, redirect, render_template, url_for
from flask_jwt_extended import jwt_required
from cloudinary.uploader import upload as cld_upload, destroy as cld_destroy
from cloudinary.utils import cloudinary_url
from sqlalchemy.exc import IntegrityError
from flask_cors import CORS
import os
from api.mail_config import send_email, EmailError
from ..models import db, Payroll, Employee
from ..utils_auth.helpers_auth import is_admin_or_hr, get_jwt_company_id, current_employee_id

payrolls_bp = Blueprint("payrolls_bp", __name__, url_prefix="/payrolls")
CORS(payrolls_bp)


# @payrolls_bp.route("", methods=["POST"])
# @jwt_required()
# def upload_payroll_pdf():
#     if not is_admin_or_hr():
#         return jsonify({"msg": "No autorizado"}), 403

#     company_id = get_jwt_company_id()

#     # El front manda month/year. Aceptamos también period_month/period_year por flexibilidad.
#     employee_id = request.form.get("employee_id", type=int)
#     period_month = request.form.get("period_month", type=int) or request.form.get("month", type=int)
#     period_year  = request.form.get("period_year", type=int) or request.form.get("year", type=int)
#     file = request.files.get("file")

#     if not employee_id or not period_month or not period_year or not file:
#         return jsonify({"msg": "Faltan campos: employee_id, month/year y file"}), 400
#     if not file.filename.lower().endswith(".pdf"):
#         return jsonify({"msg": "El archivo debe ser PDF"}), 400

#     period = f"{int(period_year):04d}-{int(period_month):02d}"
#     folder = f"payrolls/company_{company_id}/employee_{employee_id}/{period}"

#     result = cld_upload(
#         file,
#         resource_type="raw",
#         folder=folder,
#         type="authenticated",   # privado; requiere URL firmada
#         use_filename=True,
#         unique_filename=True,
#     )

#     payroll = (
#         db.session.query(Payroll)
#         .filter_by(company_id=company_id, employee_id=employee_id,
#                    period_year=period_year, period_month=period_month)
#         .first()
#     )
#     if not payroll:
#         payroll = Payroll(
#             company_id=company_id,
#             employee_id=employee_id,
#             period_year=period_year,
#             period_month=period_month,
#         )
#         db.session.add(payroll)

#     payroll.cloudinary_public_id = result.get("public_id")
#     payroll.cloudinary_version = str(result.get("version") or "")
#     payroll.cloudinary_resource_type = result.get("resource_type")
#     payroll.cloudinary_secure_url = result.get("secure_url")
#     payroll.cloudinary_bytes = int(result.get("bytes") or 0)
#     payroll.original_filename = result.get("original_filename") or file.filename

#     db.session.commit()
#     return jsonify(payroll.serialize()), 201


@payrolls_bp.route("", methods=["POST"])
@jwt_required()
def upload_payroll_pdf():
    if not is_admin_or_hr():
        return jsonify({"msg": "No autorizado"}), 403

    company_id = get_jwt_company_id()

    # El front manda month/year. Aceptamos también period_month/period_year por flexibilidad.
    employee_id = request.form.get("employee_id", type=int)
    period_month = request.form.get("period_month", type=int) or request.form.get("month", type=int)
    period_year  = request.form.get("period_year", type=int) or request.form.get("year", type=int)
    file = request.files.get("file")

    if not employee_id or not period_month or not period_year or not file:
        return jsonify({"msg": "Faltan campos: employee_id, month/year y file"}), 400
    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"msg": "El archivo debe ser PDF"}), 400

    # 1) Validar que el empleado existe y pertenece a la empresa del token
    employee = db.session.get(Employee, employee_id)
    if not employee or employee.company_id != company_id:
        return jsonify({"msg": "Empleado no encontrado en tu empresa"}), 404

    # 2) Subir a Cloudinary (raw + authenticated)
    period = f"{int(period_year):04d}-{int(period_month):02d}"
    folder = f"payrolls/company_{company_id}/employee_{employee_id}/{period}"

    try:
        result = cld_upload(
            file,
            resource_type="raw",
            folder=folder,
            type="authenticated",   # privado; requiere URL firmada
            use_filename=True,
            unique_filename=True,
        )
    except Exception as error:
        # Si Cloudinary falla, devolvemos 502 para diferenciar de errores de validación o BD
        return jsonify({"msg": "Error subiendo el PDF a Cloudinary", "detail": str(error)}), 502

    # 3) Upsert de la nómina (idempotente por periodo)
    payroll = (
        db.session.query(Payroll)
        .filter_by(
            company_id=company_id,
            employee_id=employee_id,
            period_year=period_year,
            period_month=period_month
        )
        .first()
    )
    if not payroll:
        payroll = Payroll(
            company_id=company_id,
            employee_id=employee_id,
            period_year=period_year,
            period_month=period_month,
        )
        db.session.add(payroll)

    payroll.cloudinary_public_id = result.get("public_id")
    payroll.cloudinary_version = str(result.get("version") or "")
    payroll.cloudinary_resource_type = result.get("resource_type")
    payroll.cloudinary_secure_url = result.get("secure_url")
    payroll.cloudinary_bytes = int(result.get("bytes") or 0)
    payroll.original_filename = result.get("original_filename") or file.filename

    # 4) Commit antes del correo (persistencia garantizada)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"msg": "Error de integridad al crear/actualizar la nómina"}), 400

    # 5) Enviar email de notificación (sin enlace de descarga)
    try:
        base_frontend = os.getenv('VITE_FRONTEND_URL')
        portal_url = (
            f"{base_frontend.rstrip('/')}/payroll"
            if base_frontend else None
        )

        html_body = render_template(
            "payroll_uploaded.html",
            first_name=employee.first_name or "",
            period_year=payroll.period_year,
            period_month=payroll.period_month,
            portal_url=portal_url,  # el template pone "Accede a tu portal" si existe
        )
        send_email(to_email=employee.email, subject="Tienes una nueva nómina disponible", html=html_body)
    except EmailError as error:
        print(f"[email] error enviando notificación de nómina: {error}")
    except Exception as error:
        print(f"[email] error inesperado enviando nómina: {error}")

    return jsonify(payroll.serialize()), 201




@payrolls_bp.route("", methods=["GET"])
@jwt_required()
def list_payrolls():
    company_id = get_jwt_company_id()
    requestor_employee_id = current_employee_id()
    admin_or_hr = is_admin_or_hr()

    # paginación
    limit = max(1, min(request.args.get("limit", 10, type=int), 100))
    page = max(1, request.args.get("page", 1, type=int))

    # Si es Admin/HR, puede ver todas y filtrar por employee_id si se pasa.
    # Si NO es Admin/HR, queda forzado a ver solo sus nóminas.
    q = db.session.query(Payroll).filter(Payroll.company_id == company_id)

    if admin_or_hr:
        employee_id_param = request.args.get("employee_id", type=int)
        if employee_id_param:
            q = q.filter(Payroll.employee_id == employee_id_param)
    else:
        # empleado normal => solo las suyas
        if requestor_employee_id is None:
            return jsonify({"msg": "No autorizado"}), 403
        q = q.filter(Payroll.employee_id == requestor_employee_id)

    total = q.count()
    rows = (
        q.order_by(Payroll.period_year.desc(),
                   Payroll.period_month.desc(),
                   Payroll.id.desc())
         .limit(limit)
         .offset((page - 1) * limit)
         .all()
    )

    # Si quieres incluir el nombre del empleado en la lista
    items = []
    for r in rows:
        data = r.serialize()
        # opcional: denormalizar nombre
        emp = db.session.get(Employee, r.employee_id)
        if emp:
            full_name = " ".join(filter(None, [getattr(emp, "first_name", ""), getattr(emp, "last_name", "")])).strip()
            data["employee_name"] = full_name or getattr(emp, "email", None) or f"Empleado {emp.id}"
        items.append(data)

    total_pages = (total + limit - 1) // limit
    return jsonify({"items": items, "total_pages": total_pages})


@payrolls_bp.route("/me", methods=["GET"])
@jwt_required()
def list_my_payrolls():
    """
    Lista únicamente las nóminas del empleado autenticado (del JWT),
    independientemente del rol (Admin/HR/Owner/Employee).
    """
    company_id = get_jwt_company_id()
    employee_id = current_employee_id()

    # Si el usuario (p.ej. OWNERDB) no tiene empleado asociado, devolvemos lista vacía
    if employee_id is None:
        return jsonify({"items": [], "total_pages": 0})

    # Paginación
    limit = max(1, min(request.args.get("limit", 10, type=int), 100))
    page = max(1, request.args.get("page", 1, type=int))

    q = (
        db.session.query(Payroll)
        .filter(
            Payroll.company_id == company_id,
            Payroll.employee_id == employee_id,
        )
    )

    total = q.count()
    rows = (
        q.order_by(
            Payroll.period_year.desc(),
            Payroll.period_month.desc(),
            Payroll.id.desc(),
        )
        .limit(limit)
        .offset((page - 1) * limit)
        .all()
    )

    items = [r.serialize() for r in rows]
    total_pages = (total + limit - 1) // limit
    return jsonify({"items": items, "total_pages": total_pages})



@payrolls_bp.route("/<int:payroll_id>/download", methods=["GET"])
@jwt_required()
def download_payroll(payroll_id: int):
    company_id = get_jwt_company_id()
    requester_employee_id = current_employee_id()
    admin_or_hr = is_admin_or_hr()

    payroll = db.session.get(Payroll, payroll_id)
    if not payroll or payroll.company_id != company_id:
        return jsonify({"msg": "No encontrado"}), 404

    # Autorización: dueño o Admin/HR
    if not admin_or_hr and payroll.employee_id != requester_employee_id:
        return jsonify({"msg": "No autorizado"}), 403

    if not payroll.cloudinary_public_id:
        return jsonify({"msg": "Nómina sin archivo"}), 400

    filename = f"nomina_{payroll.period_year}-{str(payroll.period_month).zfill(2)}.pdf"
    url, _ = cloudinary_url(
        payroll.cloudinary_public_id,
        resource_type="raw",
        type="authenticated",
        flags="attachment",
        attachment=filename,
        sign_url=True,
    )
    return redirect(url, code=302)



@payrolls_bp.route("/<int:payroll_id>", methods=["DELETE"])
@jwt_required()
def delete_payroll(payroll_id: int):
    if not is_admin_or_hr():
        return jsonify({"msg": "No autorizado"}), 403

    company_id = get_jwt_company_id()
    payroll = db.session.get(Payroll, payroll_id)
    if not payroll or payroll.company_id != company_id:
        return jsonify({"msg": "No encontrado"}), 404

    if payroll.cloudinary_public_id:
        try:
            cld_destroy(
                public_id=payroll.cloudinary_public_id,
                resource_type="raw",
                type="authenticated",
                invalidate=True,
            )
        except Exception:
            pass

    db.session.delete(payroll)
    db.session.commit()
    return jsonify({"msg": "Eliminado"})
