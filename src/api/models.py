from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship

db = SQLAlchemy()

class Company (db.Model):
    __tablename__= "company"
    id: Mapped[int]= mapped_column(primary_key=True)
    name = Mapped[str]= mapped_column(String(255), nullable = False)
    cif = Mapped[str] = mapped_column(String(255), unique = True nullable = False)

    #employees: Mapped[list["Employee"]] = relationship(back_populates="company")
    #shifts: Mapped[list["Shifts"]] = relationship(back_populates="company")
    #suggestions: Mapped[list["Suggestions"]] = relationship(back_populates="company")
    #holidays: Mapped[list["Holidays"]] = relationship(back_populates="company")
    #payrolls: Mapped[list["Payroll"]] = relationship(back_populates="company")


    def serialize(self):
        return {
            "id": self.id, 
            "name": self.name, 
            "cif": self.cif
            }
    
class Employee (db.Model):
    __tablename__ = "employee"

    id: Mapped[int]= mapped_column(primary_key=True)
    Company_id: Mapped[int] = mapped_column(nullable = False)
    first_name: Mapped[str] = mapped_column( String(255), nullable = False)
    last_name: Mapped[str] = mapped_column(String(255), nullable = False)
    dni: Mapped[str] = mapped_column(String(255), unique = True, nullable = False)
    birth: Mapped[Date] = mapped_column(String(255), Date, nullable = False)
    adress: Mapped[str] = mapped_column(String(255), nullable = False)
    email: Mapped[str] = mapped_column(String(255), unique = True nullable = False)
    seniority: Mapped[Date] = mapped_column(String(255), nullable = False)
    phone: Mapped[str] = mapped_column(String(255), nullable = False)
    role_id: Mapped[int] = mapped_column(String(255), nullable = False)
    #password: Mapped[str] = mapped_column(String(255), nullable = False)

    #company: Mapped["Company"] = relationship(back_populates="employees")
    #role: Mapped["Roles"] = relationship(back_populates="employees")
    #shifts: Mapped[list["Shifts"]] = relationship(back_populates="employee")
    #suggestions: Mapped[list["Suggestions"]] = relationship(back_populates="employee")
    #holidays: Mapped[list["Holidays"]] = relationship(back_populates="employee")
    #approved_holidays: Mapped[list["Holidays"]] = relationship(back_populates="approved_user")
    #payrolls: Mapped[list["Payroll"]] = relationship(back_populates="employee")

    def serialize(self):
        return {
            "id" : self.id,
            "company_id": self.company_id,
            "first_name" : self.first_name,
            "last_name" : self.last_name,
            "dni" : self.dni,
            "birth" : self.birth,
            "adress" : self.adress,
            "email" : self.email,
            "seniority" : self.seniority,
            "phone" : self.phone,
            "role_id": self.role_id
            #"password" : self.password
        }
    
class Roles(db.Model):
    __tablename__ = "roles"

    id: Mapped[int]= mapped_column(primary_key=True)
    name : Mapped[str] = mapped_column( String(255), nullable = False)
    description : Mapped[str] = mapped_column( String(255), nullable = False)
    salary_id : Mapped[int] = mapped_column(nullable = False)

    #salary: Mapped["Salary"] = relationship(back_populates="roles")
    #employees: Mapped[list["Employee"]] = relationship(back_populates="roles")

    def serialize(self):
        return {
            "id" : self.id,
            "name" : self.name,
            "description" : self.description,
            "salary_id" : self.salary_id
        }

class Salary(db.Model):
    __tablename__ = "salary"

    id : Mapped[int]= mapped_column(primary_key=True)
    amount : Mapped[int] = mapped_column(nullable = False)

    roles: Mapped[list["Roles"]] = relationship(back_populates="salary")

    def serialize(self):
        return {
            "id": self.id,
            "amount" : self.amount
        }
    
class Payroll(db.Model):
    __tablename__ = "payroll"

    id: Mapped[int]= mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(nullable = False)
    employee_id: Mapped[int] = mapped_column(nullable = False)
    period_year: Mapped[int] = mapped_column(nullable = False)
    period_month: Mapped[int] = mapped_column(nullable = False)

    #company: Mapped["Company"] = relationship(back_populates="payrolls")
    #employee: Mapped["Employee"] = relationship(back_populates="payrolls")

    def serialize(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "employee_id": self.employee_id,
            "period_year": self.period_year,
            "period_month": self.period_month
        }
    
class Shifts(db.Model):
    __tablename__ = "shifts"

    id: Mapped[int]= mapped_column(primary_key = True)
    company_id: Mapped[int] = mapped_column(nullable = False)
    employee_id: Mapped[int] = mapped_column(nullable = False)
    shift_type: Mapped[str] = mapped_column(String(50), nullable = False)

    #company: Mapped["Company"] = relationship(back_populates="shifts")
    #employee: Mapped["Employee"] = relationship(back_populates="shifts")

    def serialize(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "employee_id": self.employee_id,
            "shift_type": self.shift_type
        }

class Holidays(db.Model):
    __tablename__ = "holidays"

    id: Mapped[int]= mapped_column(primary_key = True)
    company_id: Mapped[int] = mapped_column(nullable=False)
    employee_id: Mapped[int] = mapped_column(nullable=False)
    start_date: Mapped[Date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(255), nullable=False)
    approved_user_id: Mapped[int] = mapped_column(nullable=False)
    remaining_days: Mapped[int] = mapped_column(nullable=False)

    #company: Mapped["Company"] = relationship(back_populates="holidays_requests")
    #employee: Mapped["Employee"] = relationship(back_populates="holidays")
    #approved_user: Mapped["Employee"] = relationship(back_populates="approved_holidays")

    def serialize(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "employee_id": self.employee_id,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "status": self.status,
            "approved_user_id": self.approved_user_id,
            "remaining_days": self.remaining_days
        }
    
class Suggestions(db.Model):
    __tablename__ = "suggestions"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(nullable=False)
    employee_id: Mapped[int] = mapped_column(nullable=False)
    content: Mapped[str] = mapped_column(String(255), nullable=False)

    #company: Mapped["Company"] = relationship(back_populates="suggestions")
    #employee: Mapped["Employee"] = relationship(back_populates="suggestions")

    def serialize(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "employee_id": self.employee_id,
            "content": self.content
        }




    

  