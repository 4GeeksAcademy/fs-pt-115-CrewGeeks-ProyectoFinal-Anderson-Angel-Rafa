import { useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { parseJwt } from "./jwt";
import { normalizeRole, ROLES } from "./roles";

export const useRole = () => {
  const { user, token } = useAuth();

  const systemRole = useMemo(() => {
    // 1) Modelo: user.role.name
    const byUserRoleName = normalizeRole(user?.role?.name);
    if (byUserRoleName) return byUserRoleName;

    // 2) Alternativa: user.role.id
    const byUserRoleId = normalizeRole(user?.role?.id);
    if (byUserRoleId) return byUserRoleId;

    // 3) Fallback: claim en el JWT (system_role)
    const claims = parseJwt(token) || {};
    const byClaims = normalizeRole(claims.system_role);
    if (byClaims) return byClaims;

    return null;
  }, [user, token]);

  return {
    systemRole,
    isOwnerDb: systemRole === ROLES.OWNERDB,
    isAdmin: systemRole === ROLES.ADMIN,
    isHr: systemRole === ROLES.HR,
    isEmployee: systemRole === ROLES.EMPLOYEE,
  };
};
