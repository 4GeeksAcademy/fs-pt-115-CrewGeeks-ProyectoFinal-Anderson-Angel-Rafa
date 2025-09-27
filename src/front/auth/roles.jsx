export const ROLES = {
    OWNERDB: "OWNERDB",
    ADMIN: "ADMIN",
    HR: "HR",
    EMPLOYEE: "EMPLOYEE",
}

export const normalizeRole = (rawRole) => {
    if(!rawRole) return null;
    const normalized = String(rawRole).trim().toUpperCase().replace(/[\s\-_]/g, "");
    if(normalized.includes("OWNERDB")) return ROLES.OWNERDB;
    if(normalized.includes("ADMIN")) return ROLES.ADMIN;
    if(normalized.includes("HR") || normalized.includes("RRHH") || normalized.includes("RECURSOS")) return ROLES.HR;
    if(normalized.includes("EMPLOYEE") || normalized.includes("EMPLEADO")) return ROLES.EMPLOYEE;
    return null;
}

export const roleIsAllowed = (currentRole, allowedRoles = []) => {
    if(!currentRole || !Array.isArray(allowedRoles) || allowedRoles.length === 0) return false;
    const normalizedCurrent = normalizeRole(currentRole);
    const normalizedAllowed = allowedRoles.map(normalizeRole).filter(Boolean);
    return normalizedAllowed.includes(normalizedCurrent);
}