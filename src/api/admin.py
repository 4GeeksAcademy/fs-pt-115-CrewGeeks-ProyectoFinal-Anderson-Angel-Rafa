import os
from flask_admin import Admin
from .models import (
    db,
    Employee,
    Role,
    Company,
    Salary,
    Suggestions,
    Holidays,
    Shifts,
    Payroll,
)
from flask_admin.contrib.sqla import ModelView


def setup_admin(app):
    app.secret_key = os.environ.get("FLASK_APP_KEY", "sample key")
    app.config["FLASK_ADMIN_SWATCH"] = "cerulean"
    admin = Admin(app, name="4Geeks Admin", template_mode="bootstrap3")

    class EmployeeAdmin(ModelView):
        form_columns = [
            "id",
            "company_id",
            "first_name",
            "last_name",
            "dni",
            "birth",
            "address",
            "email",
            "seniority",
            "phone",
            "role_id",
            "password_hash",
        ]

    class RoleAdmin(ModelView):
        form_columns = ["id", "name", "description", "salary_id"]

    class CompanyAdmin(ModelView):
        form_columns = ["id", "name", "cif"]

    class SalaryAdmin(ModelView):
        form_columns = ["id", "amount"]

    class SuggestionsAdmin(ModelView):
        form_columns = ["id", "company_id", "employee_id", "content"]

    class HolidaysAdmin(ModelView):
        form_columns = ["id", "company_id"]

    class ShiftsAdmin(ModelView):
        form_columns = ["id", "company_id", "employee_id"]

    class PayrollAdmin(ModelView):
        form_columns = [
            "id",
            "company_id",
            "employee_id",
            "period_year",
            "period_month",
        ]

    # Add your models here, for example this is how we add a the User model to the admin
    # admin.add_view(ModelView(Employee, db.session))
    admin.add_view(EmployeeAdmin(Employee, db.session))
    admin.add_view(RoleAdmin(Role, db.session))
    admin.add_view(CompanyAdmin(Company, db.session))
    admin.add_view(SalaryAdmin(Salary, db.session))
    admin.add_view(SuggestionsAdmin(Suggestions, db.session))
    admin.add_view(HolidaysAdmin(Holidays, db.session))
    admin.add_view(ShiftsAdmin(Shifts, db.session))
    admin.add_view(PayrollAdmin(Payroll, db.session))

    # You can duplicate that line to add mew models
    # admin.add_view(ModelView(YourModelName, db.session))
