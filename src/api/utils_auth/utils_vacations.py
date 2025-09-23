import enum
from datetime import date, timedelta

class HolidayStatus(enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

def business_days(start: date, end: date) -> int:
    # """
    # Cuenta días laborables (L-V) entre start y end (ambos inclusive).
    # No incluye festivos aún.
    # """
    if not start or not end or end < start:
        return 0
    days = 0
    d = start
    one = timedelta(days=1)
    while d <= end:
        if d.weekday() < 5:  # 0=Lunes ... 4=Viernes
            days += 1
        d += one
    return days
