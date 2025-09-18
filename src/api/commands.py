import os
from typing import Optional
from datetime import date
import click
from api.models import db, Employee, Role, Salary, Company, ShiftType

"""
In this file, you can add as many commands as you want using the @app.cli.command decorator
Flask commands are usefull to run cronjobs or tasks outside of the API but sill in integration 
with youy database, for example: Import the price of bitcoin every night as 12am
"""
# def setup_commands(app):
    
#     """ 
#     This is an example command "insert-test-Employees" that you can run from the command line
#     by typing: $ flask insert-test-Employees 5
#     Note: 5 is the number of Employees to add
#     """
#     @app.cli.command("insert-test-Employees") # name of our command
#     @click.argument("count") # argument of out command
#     def insert_test_Employees(count):
#         print("Creating test Employees")
#         for x in range(1, int(count) + 1):
#             employee = Employee()
#             employee.email = "test_Employee" + str(x) + "@test.com"
#             employee.password = "123456"
#             employee.is_active = True
#             db.session.add(employee)
#             db.session.commit()
#             print("Employee: ", employee.email, " created.")

#         print("All test Employees created")

#     @app.cli.command("insert-test-data")
#     def insert_test_data():
#         pass

def setup_commands(app):
    @app.cli.command("seed")
    @click.option("--email", default=None, help="Email del empleado inicial")
    @click.option("--password", default=None, help="Password del empleado inicial")
    def seed(email, password):
        with app.app_context():
            seed_defaults(email=email, password=password)
            click.echo(" Datos por defecto creados/actualizados.")
    @app.cli.command("resetdb")
    @click.option("--with-seed", is_flag=True, help="Sembrar datos por defecto tras recrear tablas")
    def resetdb(with_seed):
        with app.app_context():
            db.drop_all()
            db.create_all()
            if with_seed:
                seed_defaults()
            click.echo(" Base de datos reiniciada" + (" + seed" if with_seed else ""))


def _ensure_shift_type(code: str, name: str, color_hex: str, company_id: int | None = None):
    """Crea o actualiza un ShiftType (unique por code+company_id)."""
    t = db.session.execute(
        db.select(ShiftType).where(
            ShiftType.code == code,
            ShiftType.company_id == company_id
        )
    ).scalar_one_or_none()

    if not t:
        t = ShiftType(code=code, name=name, color_hex=color_hex, company_id=company_id)
        db.session.add(t)
    else:
        # por si quieres actualizar nombre/color en futuras semillas
        t.name = name
        t.color_hex = color_hex

    db.session.commit()
    return t


def seed_defaults(email: Optional[str] = None, password: Optional[str] = None):
    company_name = os.getenv("SEED_COMPANY_NAME")
    company_cif  = os.getenv("SEED_COMPANY_CIF")
    role_name        = os.getenv("SEED_ROLE_NAME")
    role_description = os.getenv("SEED_ROLE_DESCRIPTION")
    salary_amount    = int(os.getenv("SEED_SALARY_AMOUNT"))
    admin_email      = email or os.getenv("SEED_ADMIN_EMAIL")
    admin_password   = password or os.getenv("SEED_ADMIN_PASSWORD")
    admin_first_name = os.getenv("SEED_ADMIN_FIRST_NAME")
    admin_last_name  = os.getenv("SEED_ADMIN_LAST_NAME")
    admin_dni        = os.getenv("SEED_ADMIN_DNI")
    admin_birth      = os.getenv("SEED_ADMIN_BIRTH")  # YYYY-MM-DD
    admin_seniority  = os.getenv("SEED_ADMIN_SENIORITY")
    admin_phone      = os.getenv("SEED_ADMIN_PHONE")
    admin_address    = os.getenv("SEED_ADMIN_ADDRESS")
    def parse_iso(d: str) -> date:
        try:
            return date.fromisoformat(d)
        except Exception:
            return date(2000, 1, 1)
    company = db.session.execute(
        db.select(Company).where(Company.cif == company_cif)
    ).scalar_one_or_none()
    if not company:
        company = Company(name=company_name, cif=company_cif)
        db.session.add(company)
        db.session.commit()

    TYPES_SCOPE = os.getenv("SEED_TYPES_SCOPE", "global")  # "global" o "company"
    types_company_id = None if TYPES_SCOPE.lower() == "global" else company.id

    _ensure_shift_type("REGULAR", "Regular Shift", "#3b82f6", company_id=types_company_id)
    _ensure_shift_type("MORNING", "Morning Shift", "#22c55e", company_id=types_company_id)
    _ensure_shift_type("EVENING", "Evening Shift", "#f59e0b", company_id=types_company_id)
    _ensure_shift_type("HOLIDAY", "Holiday", "#ef4444", company_id=types_company_id)

    salary = db.session.execute(
        db.select(Salary).where(Salary.amount == salary_amount)
    ).scalar_one_or_none()
    if not salary:
        salary = Salary(amount=salary_amount)
        db.session.add(salary)
        db.session.commit()
    role = db.session.execute(
        db.select(Role).where(Role.name == role_name)
    ).scalar_one_or_none()
    if not role:
        role = Role(name=role_name, description=role_description, salary=salary)
        db.session.add(role)
        db.session.commit()
    employee = db.session.execute(
        db.select(Employee).where(Employee.email == admin_email)
    ).scalar_one_or_none()
    if not employee:
        employee = Employee(
            company_id=company.id,
            first_name=admin_first_name,
            last_name=admin_last_name,
            dni=admin_dni,
            birth=parse_iso(admin_birth),
            address=admin_address,
            email=admin_email,
            seniority=parse_iso(admin_seniority),
            phone=admin_phone,
            role_id=role.id,
            password_hash="",
        )
        employee.set_password(admin_password)
        db.session.add(employee)
        db.session.commit()