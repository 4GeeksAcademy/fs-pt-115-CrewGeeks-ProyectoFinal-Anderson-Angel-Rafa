from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Date, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

db = SQLAlchemy()

# --------------------
# Company
# --------------------
class Company(db.Model):
    __tablename__ = "company"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    cif: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)

    employees: Mapped[list["Employee"]] = relationship(
        "Employee",
        back_populates="company",
        cascade="all, delete-orphan",
    )
    shifts: Mapped[list["Shifts"]] = relationship(
        "Shifts",
        back_populates="company",
        cascade="all, delete-orphan",
    )
    suggestions: Mapped[list["Suggestions"]] = relationship(
        "Suggestions",
        back_populates="company",
        cascade="all, delete-orphan",
    )
    holidays: Mapped[list["Holidays"]] = relationship(
        "Holidays",
        back_populates="company",
        cascade="all, delete-orphan",
    )
    payrolls: Mapped[list["Payroll"]] = relationship(
        "Payroll",
        back_populates="company",
        cascade="all, delete-orphan",
    )

    def serialize(self):
        return {"id": self.id, "name": self.name, "cif": self.cif}


# --------------------
# Holidays (antes que Employee para poder referenciar columnas)
# --------------------
class Holidays(db.Model):
    __tablename__ = "holidays"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("company.id"), nullable=False)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employee.id"), nullable=False)
    start_date: Mapped[Date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(255), nullable=False)
    approved_user_id: Mapped[int] = mapped_column(ForeignKey("employee.id"), nullable=True)
    remaining_days: Mapped[int] = mapped_column(Integer, nullable=False)

    company: Mapped["Company"] = relationship("Company", back_populates="holidays")
    employee: Mapped["Employee"] = relationship(
        "Employee",
        back_populates="holidays",
        foreign_keys=[employee_id],
    )
    approved_user: Mapped["Employee"] = relationship(
        "Employee",
        back_populates="approved_holidays",
        foreign_keys=[approved_user_id],
    )

    def serialize(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "employee_id": self.employee_id,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "status": self.status,
            "approved_user_id": self.approved_user_id,
            "remaining_days": self.remaining_days,
        }


# --------------------
# Employee
# --------------------
class Employee(db.Model):
    __tablename__ = "employee"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("company.id"), nullable=False)
    first_name: Mapped[str] = mapped_column(String(255), nullable=False)
    last_name: Mapped[str] = mapped_column(String(255), nullable=False)
    dni: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    birth: Mapped[Date] = mapped_column(Date, nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    seniority: Mapped[Date] = mapped_column(Date, nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    role_id: Mapped[int] = mapped_column(ForeignKey("role.id"), nullable=False)

    company: Mapped["Company"] = relationship("Company", back_populates="employees")
    role: Mapped["Role"] = relationship("Role", back_populates="employees")

    shifts: Mapped[list["Shifts"]] = relationship(
        "Shifts",
        back_populates="employee",
        cascade="all, delete-orphan",
    )
    suggestions: Mapped[list["Suggestions"]] = relationship(
        "Suggestions",
        back_populates="employee",
        cascade="all, delete-orphan",
    )
    holidays: Mapped[list["Holidays"]] = relationship(
        "Holidays",
        back_populates="employee",
        foreign_keys=[Holidays.employee_id],          # << desambiguado
        cascade="all, delete-orphan",
    )
    approved_holidays: Mapped[list["Holidays"]] = relationship(
        "Holidays",
        back_populates="approved_user",
        foreign_keys=[Holidays.approved_user_id],     # << desambiguado
    )
    payrolls: Mapped[list["Payroll"]] = relationship(
        "Payroll",
        back_populates="employee",
        cascade="all, delete-orphan",
    )

    def serialize(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "dni": self.dni,
            "birth": self.birth,
            "address": self.address,
            "email": self.email,
            "seniority": self.seniority,
            "phone": self.phone,
            "role_id": self.role_id,
        }


# --------------------
# Role / Salary
# --------------------
class Role(db.Model):
    __tablename__ = "role"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    salary_id: Mapped[int] = mapped_column(ForeignKey("salary.id"), nullable=False)

    salary: Mapped["Salary"] = relationship("Salary", back_populates="roles")
    employees: Mapped[list["Employee"]] = relationship("Employee", back_populates="role")

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "salary_id": self.salary_id,
        }


class Salary(db.Model):
    __tablename__ = "salary"

    id: Mapped[int] = mapped_column(primary_key=True)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)

    roles: Mapped[list["Role"]] = relationship(
        "Role",
        back_populates="salary",
        cascade="all, delete-orphan",
    )

    def serialize(self):
        return {"id": self.id, "amount": self.amount}


# --------------------
# Payroll
# --------------------
class Payroll(db.Model):
    __tablename__ = "payroll"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("company.id"), nullable=False)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employee.id"), nullable=False)
    period_year: Mapped[int] = mapped_column(Integer, nullable=False)
    period_month: Mapped[int] = mapped_column(Integer, nullable=False)

    company: Mapped["Company"] = relationship("Company", back_populates="payrolls")
    employee: Mapped["Employee"] = relationship("Employee", back_populates="payrolls")

    def serialize(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "employee_id": self.employee_id,
            "period_year": self.period_year,
            "period_month": self.period_month,
        }


# --------------------
# Shifts
# --------------------
class Shifts(db.Model):
    __tablename__ = "shifts"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("company.id"), nullable=False)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employee.id"), nullable=False)
    shift_type: Mapped[str] = mapped_column(String(50), nullable=False)

    company: Mapped["Company"] = relationship("Company", back_populates="shifts")
    employee: Mapped["Employee"] = relationship("Employee", back_populates="shifts")

    def serialize(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "employee_id": self.employee_id,
            "shift_type": self.shift_type,
        }


# --------------------
# Suggestions
# --------------------
class Suggestions(db.Model):
    __tablename__ = "suggestions"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("company.id"), nullable=False)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employee.id"), nullable=False)
    content: Mapped[str] = mapped_column(String(255), nullable=False)

    company: Mapped["Company"] = relationship("Company", back_populates="suggestions")
    employee: Mapped["Employee"] = relationship("Employee", back_populates="suggestions")

    def serialize(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "employee_id": self.employee_id,
            "content": self.content,
        }



    

  