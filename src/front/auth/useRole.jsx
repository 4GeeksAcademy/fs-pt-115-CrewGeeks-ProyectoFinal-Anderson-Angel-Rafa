import { useMemo } from "react";
import { useAuth } from "../hooks/useAuth"
import { normalizeRole, ROLES } from "./roles";
import { parseJwt } from "./jwt";

export const useRole = () => {
    const {user, token} = useAuth();

    const systemRole = useMemo(() => {
        const direct = normalizeRole(user?.system_role);
        if (direct) return direct;

        const fromUserRole = normalizeRole(user?.role?.name);
        if (fromUserRole) return fromUserRole;

        const claims = parseJwt(token) || {};
        const fromClaim = normalizeRole(claims.system_role);
        if(fromClaim) return fromClaim;

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