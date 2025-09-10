  
import os
from flask_admin import Admin
from .models import db, Employee, Role, Company, Salary, Suggestions, Holidays, Shifts, Payroll
from flask_admin.contrib.sqla import ModelView

def setup_admin(app):
    app.secret_key = os.environ.get('FLASK_APP_KEY', 'sample key')
    app.config['FLASK_ADMIN_SWATCH'] = 'cerulean'
    admin = Admin(app, name='4Geeks Admin', template_mode='bootstrap3')
    class EmployeeAdmin(ModelView):
        form_columns = [
            "id","company_id","first_name","last_name","dni","birth","address","email",
            "seniority","phone",
            "role_id", "password_hash"
        ]

    
    # Add your models here, for example this is how we add a the User model to the admin
    # admin.add_view(ModelView(Employee, db.session))
    admin.add_view(EmployeeAdmin(Employee,db.session))
    admin.add_view(ModelView(Role, db.session))
    admin.add_view(ModelView(Company, db.session))
    admin.add_view(ModelView(Salary, db.session))
    admin.add_view(ModelView(Suggestions, db.session))
    admin.add_view(ModelView(Holidays, db.session))
    admin.add_view(ModelView(Shifts, db.session))
    admin.add_view(ModelView(Payroll, db.session))

    # You can duplicate that line to add mew models
    # admin.add_view(ModelView(YourModelName, db.session))