from flask_jwt_extended import get_jwt, get_jwt_identity
from api.models import db, Employee


def get_system_role() -> str:
    
    claims = get_jwt()
    system_role_claim = (claims.get("system_role") or "").upper()
    if system_role_claim in {"OWNERDB", "ADMIN", "HR", "EMPLOYEE"}:
        return system_role_claim

    try:
        employee = db.session.get(Employee, int(get_jwt_identity()))
    except (TypeError, ValueError):
        employee = None

    role_name = (employee.role.name if employee and employee.role else "") or ""
    role_lower = role_name.strip().lower()
    role_norm = role_lower.replace("-", "").replace("_", "").replace(" ", "")
    if "ownerdb" in role_norm:
        return "OWNERDB"
    if "admin" in role_norm:
        return "ADMIN"
    if "hr" in role_norm or "recursos" in role_norm or "rrhh" in role_norm:
        return "HR"
    return "EMPLOYEE"


def is_admin_or_hr() -> bool:
    return get_system_role() in {"OWNERDB", "ADMIN", "HR"}


def is_ownerdb() -> bool:
    return get_system_role() == "OWNERDB"


def current_employee_id() -> int:
    return int(get_jwt_identity())

def get_jwt_company_id() -> int | None:
    
    claims = get_jwt()
    company_id_claim = claims.get("company_id")
    if company_id_claim is not None:
        try:
            return int(company_id_claim)
        except (TypeError, ValueError):
            pass

    try:
        employee = db.session.get(Employee, int(get_jwt_identity()))
        return employee.company_id if employee else None
    except (TypeError, ValueError):
        return None