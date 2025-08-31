"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, Company, Employee, Role, Salary, Payroll, Shifts, Holidays, Suggestions
from api.utils import generate_sitemap, APIException
from flask_cors import CORS









api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)

# tabla companies


@api.route("/companies", methods=["GET"])
def get_companies():
    companies = db.session.query(Company).all()
    return jsonify([c.serialize() for c in companies]), 200


@api.route("/companies/<int:id>", methods=["GET"])
def get_company(id):                                               
    company = db.session.get(Company, id)                              
    if not company:
        return jsonify({"error": "company not found"}), 404             
    return jsonify(company.serialize()), 200                         
    


@api.route("/companies", methods=["POST"])
def create_company():
    data = request.json                                          
    new_company = Company(name=data["name"], cif=data["cif"])       
    db.session.add(new_company)                                     
    db.session.commit()                                             
    return jsonify(new_company.serialize()), 201                    


@api.route("/companies/<int:id>", methods=["PUT"])                    
def update_company(id):
    company = db.session.get(Company, id)                           
    if not company:
        return jsonify({"error": "company not found"}), 404             

    data = request.json                                             
    company.name = data.get("name", company.name)                   
    company.cif = data.get("cif", company.cif)                      
    db.session.commit()                                             
    return jsonify(company.serialize()), 200                        


@api.route("/companies/<int:id>", methods=["DELETE"])                
def delete_company(id):
    company = db.session.get(Company, id)
    if not company:                                                 
         return jsonify({"error": "company not found"}), 404
    
    db.session.delete(company)                                      
    db.session.commit()                                             
    return jsonify(company.serialize()), 200                        


#tabla employees

@api.route("/employees", methods=["GET"])
def get_employees():
    employees = db.session.query(Employee).all()                   
    return jsonify([e.serialize() for e in employees]), 200              


@api.route('/employees/<int:id>', methods=['GET'])
def get_employee(id):
    employee = db.session.get(Employee, id)
    if not employee:
            return jsonify({"error": "Employee not found"}), 404
    return jsonify(employee.serialize()), 200

@api.route("/employees", methods=["POST"])
def create_employee():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    # company_id requerido y valido
    company_id = data.get("company_id")
    if not company_id or not db.session.get(Company, company_id):
        return jsonify({"error": "company_id invalid"}), 400

    # role id
    role_id = data.get("role_id")
    if role_id and not db.session.get(Role, role_id):
        return jsonify({"error": f"Role id={role_id} does not exist"}), 400

    
    #hash

    new_employee = Employee(
        company_id = company_id,
        first_name = data.get("first_name"),
        last_name  = data.get("last_name"),
        dni        = data.get("dni"),
        address    = data.get("address"),
        seniority  = data.get("seniority"),
        email      = data.get("email"),
        role_id    = role_id,
        birth      = data.get("birth"),
        phone      = data.get("phone") 
    )

    db.session.add(new_employee)
    db.session.commit()
    return jsonify(new_employee.serialize()), 201

@api.route("/employees/<int:id>", methods=["PUT"])
def update_employee(id):
    employee = db.session.get(Employee, id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400
    
    
    #Validar/actualizar Foreign keys
    if "company_id" in data:
        if not db.session.get(Company, data["company_id"]):
            return jsonify({"error": f"Company id={data["company_id"]} does not exist"}), 400
        employee.company_id = data["company_id"]


    if "role_id" in data:
        if data["role_id"] and not db.session.get(Role, data["role_id"]):
            return jsonify({"error": f"Role id={data["role_id"]} does not exist"}), 400
        employee.role_id = data["role id"]

    #actualizar campos
    for field in ["first_name", "last_name", "dni", "adress", "seniority", "email", "birth", "phone"]:
        if field in data:
            vars(employee)[field] = data[field]


    #re-hash


    db.session.commit()
    return jsonify(employee.serialize()), 200   


@api.route("/employees/<int:id>", methods=["DELETE"])
def delete_employee(id):
    employee = db.session.get(Employee, id)
    if not employee:
        return jsonify({"error": "Employee not found"}), 404
    
    db.session.delete(employee)
    db.session.commit()
    return jsonify({"message": f"Employee id={id} deleted"}), 200
        
#roles

#todos_los_roles
@api.route("/roles", methods=["GET"])
def get_roles():
    roles = db.session.query(Role).all()
    return jsonify([r.serialize() for r in roles]), 200

#por_id
@api.route("/roles/<int:id>", methods=["GET"])
def get_role(id): 
    role = db.session.get(Role, id)
    if not role:
        return jsonify({"error": "Role not found"}), 404
    return jsonify(role.serialize()), 200

@api.route("/roles", methods=["POST"])
def create_role():
    data = request.get_json(Silent=True)
    if not data: 
        return jsonify({"error": "JSON body required"}), 400
    
    salary_id = data.get("salary_id")
    if not salary_id or not db.session.get(Salary, salary_id):
        return jsonify({"error": "salary_id invalid"}), 400
    
    new_role = Role(
        name=data.get("name"), 
        description=data.get("description"),
        salary_id=salary_id
    )

    db.session.add(new_role)
    db.session.commit()
    return jsonify(new_role.serialize()), 201



@api.route ("roles/<int:id>", methods=["PUT"])
def update_role(id):
    role = db.session.get(Role, id)
    if not role:
        return jsonify({"error": "Roles not found"}), 404
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400
    
    if "salary_id" in data:
        if not db.session.get(Salary, data["salary_id"]):
            return jsonify({"error": f"Salary id={data["salary_id"]} does not exist"}), 400
        role.salary_id = data["salary_id"]

    for field in ["name", "description"]:
        if field in data:
            vars(role, field, data[field])

    db.session.commit()
    return jsonify(role.serialize()), 200

@api.route("/roles/<int:id>", methods=["DELETE"])
def delete_role(id):
    role = db.session.get(Role, id)
    if not role:
        return jsonify({"error": "Role not found"}), 404
    
    db.session.delete(role)
    db.session.commit()
    return jsonify({"message": f"Role id={id} deleted"}), 200


#payroll

#por_id
@api.route("/payroll/<int:id>", methods=["GET"])
def get_payroll(id):
    payroll = db.session.get(Payroll, id)
    if not payroll:
        return jsonify({"error": "Payroll not found"}), 400
    return jsonify(payroll.serialize()), 200

#todos_los_roles
@api.route("/payroll", methods=["GET"])
def get_all_payrolls():
    payrolls = Payroll.query.all()
    return jsonify([p.serialize() for p in payrolls]), 200

@api.route("/payroll", methods=["POST"])
def create_payroll():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400
    
    payroll = Payroll(
        company_id=data["company_id"],
        employee_id=data["empolyee_id"], 
        period_year=data["period_year"],
        period_month=data["period_month"]
    )

    db.session.add(payroll)
    db.session.commit()
    return jsonify(payroll.serialize()), 200


@api.route("/payroll/<int:id>", methods=["PUT"])
def update_payroll(id): 
    payroll = db.session.get(Payroll, id)
    if not payroll:
        return jsonify({"error": "Payroll not found"}), 404
    
    data = request.get_son(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400
    
    payroll.company_id = data.get("company_id", payroll.company_id)
    payroll.employee_id = data.get("employee_id", payroll.employee_id)
    payroll.period_year = data.get("period_year", payroll.period_year)
    payroll.period_month = data.get("period_month", payroll.period_month)

    db.session.commit()
    return jsonify(payroll.serialize()), 200

@api.route("/payroll/<int:id>", methods=["DELETE"])
def delete_payroll(id):
    payroll = db.session.get(Payroll, id)
    if not payroll:
        return jsonify({"error": "Payroll not found"}), 404
    

    db.session.delete(payroll)
    db.session.commit()
    return jsonify({"message": "Payroll succesfully deleted"}), 200


#shifts 

#por_id
@api.route("/shifts/<int:id>", methods=["GET"])
def get_shift(id):
    shift = db.session.get(Shifts, id)
    if not shift:
        return jsonify({"error": "Shift not found"}), 404
    return jsonify(shift.serialize()), 200

#todos_los_shifts

@api.route("/shifts", methods=["GET"])
def get_all_shifts():
    shifts = Shifts.query.all()
    return jsonify([s.serialize() for s in shifts]), 200

@api.route("/shifts", methods=["POST"])
def create_shift():
    data = request.get_son(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    shift = Shifts(
        company_id=data["company_id"],
        employee_id=data["employee_id"],
        shift_id=data["shift_id"]
    )       

    db.session.add(shift)
    db.session.commit()
    return jsonify(shift.serialize()), 200


@api.route("/shifts/<int:id>", methods=["PUT"])
def update_shift(id):
    shift = db.session.get(Shifts, id)
    if not shift:
        return jsonify({"error": "Shift not found"}), 404
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400
    
    shift.company_id = data.get("company_id", shift.company_id)
    shift.employee_id = data.get("employee_id", shift.employee_id)
    shift.shift_type = data.get("shift_type", shift.shift_type)

    db.session.commit()
    return jsonify(shift.serialize()), 200

@api.route("/shifts/<int:id>", methods=["DELETE"])
def delete_shift(id):
    shift = db.session.get(Shifts, id)
    if not shift:
         return jsonify({"error": "Shift not found"}), 404

    db.session.delete(shift)
    db.session.commit()
    return jsonify({"error": "Shift succesfully deleted"}), 200

#por_id
@api.route("/holidays/<int:id>", methods=["GET"])
def get_holiday(id):
    holiday = db.session.get(Holidays, id)
    if not holiday:
        return jsonify({"error": "Holidy request not found"}), 404
    return jsonify(holiday.serialize()), 200

#todos_los_hollidays

@api.route("/holidays", methods=["GET"])
def get_all_holidays():
    holidays = Holidays.query.all()
    return jsonify([h.serialize() for h in holidays]), 200


@api.route('/holidays', methods=['POST'])
def create_holiday():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body requerido"}), 400

    required_fields = ("company_id", "employee_id", "start_date", "end_date", "status", "remaining_days")
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Faltan campos requeridos"}), 400

    holiday = Holidays(
        company_id=data["company_id"],
        employee_id=data["employee_id"],
        start_date=data["start_date"],
        end_date=data["end_date"],
        status=data["status"],
        approved_user_id=data.get("approved_user_id"),  # opcional
        remaining_days=data["remaining_days"]
    )
    db.session.add(holiday)
    db.session.commit()
    return jsonify(holiday.serialize()), 201


@api.route('/holidays/<int:id>', methods=['PUT'])
def update_holiday(id):
    holiday = db.session.get(Holidays, id)
    if not holiday:
        return jsonify({"error": "Holiday request not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body requerido"}), 400

    holiday.company_id = data.get("company_id", holiday.company_id)
    holiday.employee_id = data.get("employee_id", holiday.employee_id)
    holiday.start_date = data.get("start_date", holiday.start_date)
    holiday.end_date = data.get("end_date", holiday.end_date)
    holiday.status = data.get("status", holiday.status)
    holiday.approved_user_id = data.get("approved_user_id", holiday.approved_user_id)
    holiday.remaining_days = data.get("remaining_days", holiday.remaining_days)

    db.session.commit()
    return jsonify(holiday.serialize()), 200


@api.route('/holidays/<int:id>', methods=['DELETE'])
def delete_holiday(id):
    holiday = db.session.get(Holidays, id)
    if not holiday:
        return jsonify({"error": "Holiday request not found"}), 404

    db.session.delete(holiday)
    db.session.commit()
    return jsonify({"message": "Holiday eliminado exitosamente"}), 200



#Suggestions

@api.route("/suggestions", methods=["GET"])
def get_suggestions():
    suggestions = db.session.query(Suggestions).all()
    return jsonify([s.serialize() for s in suggestions]), 200


@api.route("/suggestions/<int:id>", methods=["GET"])
def get_suggestion(id):
    suggestion = db.session.get(Suggestions,id)
    if not suggestion:
        return jsonify({"error": "Suggestion not found"}), 404
    return jsonify(suggestion.serialize()), 200


@api.route("/suggestions", methods=["POST"])
def create_suggestion():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400
    
    company_id = data.get("company_id")
    employee_id = data.get("employee_id")

    if not company_id or not db.session.get(Company, company_id):
        return jsonify ({"error": "company_id invalido"}), 400
    
    employee = db.session.get(Employee, employee_id) if employee_id else None
    if not employee:
        return jsonify({"error": "employee_id invalido"}), 400
    if employee.company_id != company_id:
        return jsonify({"error": "El empleado no pertenece a esta company"}), 400
    
    content = data.get("content")
    if not content:
        return jsonify({"error": "content requerido"}), 400
    
    item = Suggestions(company_id=company_id, employee_id=employee_id, content=content)
    db.session.add(item)
    db.session.commit()
    return jsonify(item.serialize()), 201
                              

@api.route("/suggestions/<int:id>", methods=["PUT"])
def update_suggestion(id):
    suggestion = db.session.get(Suggestions, id)
    if not suggestion:
        return jsonify({"error": "Suggestion not found"}), 404
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400
    
    if "company_id" in data:
        if not db.session.get(Company, data["company_id"]):
            return jsonify({"error": f'Company id={data["company_id"]} does not exist'}), 400
        suggestion.company_id = data["company_id"]

    if "employee_id" in data:
        employee = db.session.get(Employee, data["employee_id"])
        if not employee:
            return jsonify({"error": f'Employee id={data["employee_id"]} does not exist'}), 400
        suggestion.employee_id = data["employee_id"]

    employee = db.session.get(Employee, suggestion.employee_id)
    if employee.company_id != suggestion.company_id:
        return jsonify({"error": "El employee no pertenece a esta company"}), 400
    
    if "content" in data:
        suggestion.content = data["content"]

    db.session.commit()
    return jsonify(suggestion.serialize()), 200


@api.route("/suggestions/<int:id>", methods=["DELETE"])
def delete_suggestions(id):
    suggestion = db.session.get(Suggestions, id)
    if not suggestion:
        return jsonify({"error": "Suggestion not found"}), 404
    db.session.delete(suggestion)
    db.session.commit()
    return jsonify({"message": f'Suggestion id={id} deleted'}), 200


#Salaries


@api.route("/salaries", methods=["GET"])
def get_salaries():
    salaries = db.session.query(Salary).all()
    return jsonify([s.serialize() for s in salaries]), 200

@api.route("/salaries/<int:id>", methods=["GET"])
def get_salary(id):
    salary = db.session.get(Salary, id)
    if not salary:
        return jsonify({"error": "Salary not found"}), 404
    return jsonify(salary.serialize()), 200

@api.route("/salaries", methods=["POST"])
def create_salary():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    salary_amount = data.get("amount")
    try:
        amount = int(salary_amount)
    except (TypeError, ValueError):
        return jsonify({"error": "amount debe ser un entero"}), 400

    if amount <= 0:
        return jsonify({"error": "amount debe ser mayor que 0"}), 400

    salary = Salary(amount=amount)
    db.session.add(salary)
    db.session.commit()
    return jsonify(salary.serialize()), 201

@api.route("/salaries/<int:id>", methods=["PUT"])
def update_salary(id):
    salary = db.session.get(Salary, id)
    if not salary:
        return jsonify({"error" : "Salary not found"}), 404
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "JSON body required"}), 400
    
    if "amount" in data:
        salary.amount = data["amount"]

    db.session.commit()
    return jsonify(salary.serialize()), 200


@api.route("/salaries/<int:id>", methods=["DELETE"])
def delete_salary(id):
    salary = db.session.get(Salary, id)
    if not salary:
        return jsonify({"error": "Salary not found"}), 404
    
    db.session.delete(salary)
    db.session.commit()
    return jsonify({"msg" : f'Salary id={id} deleted'}), 200







    








    




        

                              