from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Date, Integer, ForeignKey, Text, DateTime, Enum, Index, Time, UniqueConstraint,CheckConstraint, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from flask_bcrypt import generate_password_hash, check_password_hash
import enum
from datetime import datetime, timezone, date
from api.utils_auth.utils_vacations import HolidayStatus
from typing import Optional

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
    shift_types: Mapped[list["ShiftType"]] = relationship(
        "ShiftType",
        back_populates="company",
        cascade="all, delete-orphan"
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
# Vacation Balance
# --------------------

class VacationBalance(db.Model):
    __tablename__ = "vacation_balance"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("company.id"), nullable=False)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employee.id"), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    allocated_days: Mapped[int] = mapped_column(Integer, nullable=False, default=22)
    used_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        server_onupdate=func.now(),
        nullable=False
    )

    __table_args__ = (
        CheckConstraint("allocated_days >= 0", name="ck_balance_alloc_nonneg"),
        CheckConstraint("used_days >= 0", name="ck_balance_used_nonneg"),
        Index("ix_balance_emp_year", "employee_id", "year", unique=True),
        Index("ix_balance_company_emp_year", "company_id", "employee_id", "year"),
    )

    def serialize(self):
        return {
            "company_id": self.company_id,
            "employee_id": self.employee_id,
            "year": self.year,
            "allocated_days": self.allocated_days,
            "used_days": self.used_days,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

# --------------------
# Holidays
# --------------------

class Holidays(db.Model):
    __tablename__ = "holidays"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("company.id"), nullable=False)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employee.id"), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[HolidayStatus] = mapped_column(
        Enum(HolidayStatus, name="holiday_status"),
        nullable=False,
        default=HolidayStatus.PENDING,
    )
    approved_user_id: Mapped[int] = mapped_column(ForeignKey("employee.id"), nullable=True)
    approved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    requested_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reason: Mapped[str] = mapped_column(String(500), nullable=True)


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

    __table_args__ = (
        CheckConstraint("start_date <= end_date", name="ck_holidays_start_le_end"),
        CheckConstraint("requested_days >= 0", name="ck_holidays_req_nonneg"),
        Index("ix_holidays_emp_start", "employee_id", "start_date"),
        Index("ix_holidays_company_emp_start", "company_id", "employee_id", "start_date"),
    )

    def serialize(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "employee_id": self.employee_id,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "status": self.status.value if isinstance(self.status, HolidayStatus) else self.status,
            "approved_user_id": self.approved_user_id,
            "approved_at": self.approved_at.isoformat() if self.approved_at else None,
            "requested_days": self.requested_days,
            "reason": self.reason,
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
    image: Mapped[Optional[str]] = mapped_column(Text)
    password_hash: Mapped[str] = mapped_column(nullable = False)

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
        foreign_keys=[Holidays.employee_id],  
        cascade="all, delete-orphan",
    )
    approved_holidays: Mapped[list["Holidays"]] = relationship(
        "Holidays",
        back_populates="approved_user",
        foreign_keys=[Holidays.approved_user_id], 
    )
    payrolls: Mapped[list["Payroll"]] = relationship(
        "Payroll",
        back_populates="employee",
        cascade="all, delete-orphan",
    )
    
    time_punches: Mapped[list["TimePunch"]] = relationship(
        "TimePunch",
        back_populates="employee",
        cascade="all, delete-orphan"
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def serialize(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "company" : self.company.name,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "dni": self.dni,
            "birth": self.birth.isoformat() if self.birth else None,
            "address": self.address,
            "email": self.email,
            "seniority": self.seniority.isoformat() if self.seniority else None,
            "phone": self.phone,
            "image" : self.image,
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

    # NUEVO: fecha y horas del turno
    date: Mapped[Date] = mapped_column(Date, nullable=False)           # día local del turno
    start_time: Mapped[Time] = mapped_column(Time, nullable=False)     # HH:MM
    end_time: Mapped[Time] = mapped_column(Time, nullable=False)       # HH:MM

    # NUEVO: referencia a tipo
    type_id: Mapped[int] = mapped_column(ForeignKey("shift_type.id"), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="planned")  # planned|published|cancelled

    company: Mapped["Company"] = relationship("Company", back_populates="shifts")
    employee: Mapped["Employee"] = relationship("Employee", back_populates="shifts")
    type: Mapped["ShiftType"] = relationship("ShiftType", back_populates="shifts")

    __table_args__ = (
        Index("ix_shift_company_emp_date", "company_id", "employee_id", "date"),
    )

    def serialize(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "employee_id": self.employee_id,
            "date": self.date.isoformat(),
            "start_time": self.start_time.strftime("%H:%M"),
            "end_time": self.end_time.strftime("%H:%M"),
            "type": self.type.serialize() if self.type else None,
            "notes": self.notes,
            "status": self.status,
        }
    


# --------------------
# ShiftType (catálogo de tipos/colores)
# --------------------
class ShiftType(db.Model):
    __tablename__ = "shift_type"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Si company_id es None => tipo GLOBAL (válido para todas las empresas)
    company_id: Mapped[int | None] = mapped_column(ForeignKey("company.id"), nullable=True)
    code: Mapped[str] = mapped_column(String(50), nullable=False)      # REGULAR|MORNING|EVENING|HOLIDAY...
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color_hex: Mapped[str] = mapped_column(String(7), nullable=False)  # "#3b82f6"

    company: Mapped["Company"] = relationship("Company", back_populates="shift_types")
    shifts: Mapped[list["Shifts"]] = relationship("Shifts", back_populates="type")

    __table_args__ = (
        UniqueConstraint("company_id", "code", name="uq_shift_type_company_code"),
    )

    def serialize(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "code": self.code,
            "name": self.name,
            "color_hex": self.color_hex,
        }
    

# --------------------
# ShiftSeries (reglas recurrentes)
# --------------------
class ShiftSeries(db.Model):
    __tablename__ = "shift_series"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("company.id"), nullable=False)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employee.id"), nullable=False)
    type_id: Mapped[int] = mapped_column(ForeignKey("shift_type.id"), nullable=False)

    start_date: Mapped[Date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Date | None] = mapped_column(Date, nullable=True)  # null = sin fin
    start_time: Mapped[Time] = mapped_column(Time, nullable=False)
    end_time: Mapped[Time] = mapped_column(Time, nullable=False)

    weekdays_mask: Mapped[int] = mapped_column(Integer, nullable=False)  # bits Lun..Dom (bit0=Lun)
    interval_weeks: Mapped[int] = mapped_column(Integer, nullable=False, default=1)  # cada N semanas
    tz_name: Mapped[str] = mapped_column(String(64), nullable=False, default="Europe/Madrid")
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    company: Mapped["Company"] = relationship("Company")
    employee: Mapped["Employee"] = relationship("Employee")
    type: Mapped["ShiftType"] = relationship("ShiftType")
    exceptions: Mapped[list["ShiftException"]] = relationship(
        "ShiftException", back_populates="series", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_shift_series_company_emp", "company_id", "employee_id"),
    )

    def serialize(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "employee_id": self.employee_id,
            "type": self.type.serialize() if self.type else None,
            "start_date": self.start_date.isoformat(),
            "end_date": (self.end_date.isoformat() if self.end_date else None),
            "start_time": self.start_time.strftime("%H:%M"),
            "end_time": self.end_time.strftime("%H:%M"),
            "weekdays_mask": self.weekdays_mask,
            "interval_weeks": self.interval_weeks,
            "tz_name": self.tz_name,
            "active": self.active,
            "notes": self.notes,
        }



# --------------------
# ShiftException (cancelar/modificar un día de una serie)
# --------------------
class ShiftException(db.Model):
    __tablename__ = "shift_exception"

    id: Mapped[int] = mapped_column(primary_key=True)
    series_id: Mapped[int] = mapped_column(ForeignKey("shift_series.id"), nullable=False)
    date: Mapped[Date] = mapped_column(Date, nullable=False)

    # action: 'cancel' o 'modify'
    action: Mapped[str] = mapped_column(String(10), nullable=False)  # 'cancel' | 'modify'
    new_start_time: Mapped[Time | None] = mapped_column(Time, nullable=True)
    new_end_time: Mapped[Time | None] = mapped_column(Time, nullable=True)
    new_type_id: Mapped[int | None] = mapped_column(ForeignKey("shift_type.id"), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    series: Mapped["ShiftSeries"] = relationship("ShiftSeries", back_populates="exceptions")
    new_type: Mapped["ShiftType"] = relationship("ShiftType")

    __table_args__ = (
        UniqueConstraint("series_id", "date", name="uq_shift_exception_series_date"),
        Index("ix_shift_exception_series_date", "series_id", "date"),
    )

    def serialize(self):
        return {
            "id": self.id,
            "series_id": self.series_id,
            "date": self.date.isoformat(),
            "action": self.action,
            "new_start_time": (self.new_start_time.strftime("%H:%M") if self.new_start_time else None),
            "new_end_time": (self.new_end_time.strftime("%H:%M") if self.new_end_time else None),
            "new_type_id": self.new_type_id,
            "note": self.note,
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



class PunchType(enum.Enum):
    IN = "IN"
    BREAK_START = "BREAK_START"
    BREAK_END = "BREAK_END"
    OUT = "OUT"


class TimePunch(db.Model):
    __tablename__ = "time_punch"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employee.id"), nullable=False)

    punch_type: Mapped[PunchType] = mapped_column(
        Enum(PunchType, name="punch_type", native_enum=False, validate_strings=True),
        nullable=False
    )
    punched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    employee: Mapped["Employee"] = relationship(
    "Employee",
    back_populates="time_punches"
    )

    __table_args__ = (
        Index("ix_time_punch_employee_time", "employee_id", "punched_at"),
    )

    def serialize(self) -> dict:
        return {
            "id": self.id,
            "employee_id": self.employee_id,
            "punch_type": self.punch_type.value,
            "punched_at": self.punched_at.isoformat(),
            "note": self.note,
        }

  