from flask_jwt_extended import get_jwt, get_jwt_identity
from api.models import db, Employee

def get_jwt_company_id() -> int | None:
    
    claims = get_jwt()
    company_id_claim = claims.get("company_id")
    if company_id_claim is not None:
        try:
            return int(company_id_claim)
        except (TypeError, ValueError):
            pass

    identity = get_jwt_identity()
    try:
        employee = db.session.get(Employee, int(identity))
        return employee.company_id if employee else None
    except (TypeError, ValueError):
        return None


def get_system_role() -> str:
    
    claims = get_jwt()
    system_role_claim = (claims.get("system_role") or "").upper()
    if system_role_claim in {"ADMIN", "HR", "EMPLOYEE"}:
        return system_role_claim

    identity = get_jwt_identity()
    try:
        employee = db.session.get(Employee, int(identity))
    except (TypeError, ValueError):
        employee = None

    role_name = (employee.role.name if employee and employee.role else "") or ""
    role_lower = role_name.strip().lower()
    if "admin" in role_lower:
        return "ADMIN"
    if "hr" in role_lower or "recursos" in role_lower or "rrhh" in role_lower:
        return "HR"
    return "EMPLOYEE"


def is_admin_or_hr() -> bool:
    return get_system_role() in {"ADMIN", "HR"}


def current_employee_id() -> int:
    return int(get_jwt_identity())
