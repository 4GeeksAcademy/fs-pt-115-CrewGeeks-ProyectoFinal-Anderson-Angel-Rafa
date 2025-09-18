from flask import Blueprint
from .companies_routes import company_bp
from .employees_routes import employee_bp
from .roles_routes import role_bp
from .payroll_routes import payroll_bp
from .shifts_routes import shift_bp
from .holidays_routes import holidays_bp
from .suggestions_routes import suggestions_bp
from .salaries_routes import salary_bp
from .timepunch_routes import time_punch_bp

api = Blueprint('api', __name__)

api.register_blueprint(company_bp)
api.register_blueprint(employee_bp)
api.register_blueprint(role_bp)
api.register_blueprint(payroll_bp)
api.register_blueprint(shift_bp)
api.register_blueprint(holidays_bp)
api.register_blueprint(suggestions_bp)
api.register_blueprint(salary_bp)
api.register_blueprint(time_punch_bp)