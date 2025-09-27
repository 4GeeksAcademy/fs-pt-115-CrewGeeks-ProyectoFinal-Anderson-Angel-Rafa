export const ROLES = {
  OWNERDB: "OWNERDB",
  ADMIN: "ADMIN",
  HR: "HR",
  EMPLOYEE: "EMPLOYEE",
};


const KNOWN = new Set(Object.values(ROLES));


export const normalizeRole = (value) => {
  if (value == null) return null;

  // Objeto Role { id, name, description }
  if (typeof value === "object") {
    const name = value?.name;
    if (typeof name === "string") {
      const normalized = name.trim().toUpperCase();
      return KNOWN.has(normalized) ? normalized : null;
    }
    // Como alternativa, por id si lo necesitas
    if (typeof value?.id === "number") {
      return mapRoleId(value.id);
    }
    return null;
  }

  
  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase();
    return KNOWN.has(normalized) ? normalized : null;
  }

  
  if (typeof value === "number") {
    return mapRoleId(value);
  }

  return null;
};

// Mapa por id (ajústalo a tus seeds si los tienes fijos)
const mapRoleId = (id) => {
  const MAP = {
    1: ROLES.OWNERDB,
    2: ROLES.ADMIN,
    3: ROLES.HR,
    4: ROLES.EMPLOYEE,
  };
  return MAP[id] || null;
};

// ¿El rol actual está permitido?
export const roleIsAllowed = (currentRole, allowedRoles = []) => {
  if (!currentRole || !Array.isArray(allowedRoles) || allowedRoles.length === 0) return false;
  const normalizedCurrent = normalizeRole(currentRole);
  const normalizedAllowed = allowedRoles.map(normalizeRole).filter(Boolean);
  return normalizedCurrent ? normalizedAllowed.includes(normalizedCurrent) : false;
};
