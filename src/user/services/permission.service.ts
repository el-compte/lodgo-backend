import { Injectable, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class PermissionService {
  /**
   * Check if a user can delete/update another user based on role hierarchy
   * Super Admin > Admin > Asset Manager > User
   * Rules:
   * - Super Admin can delete/update anyone
   * - Admin can delete/update everyone except Super Admin
   * - Others cannot delete/update users
   */
  canDeleteOrUpdateUser(
    requestingUserRole: UserRole,
    targetUserRole: UserRole,
  ): boolean {
    // Super Admin can do anything
    if (requestingUserRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Admin can delete/update everyone except Super Admin
    if (requestingUserRole === UserRole.ADMIN) {
      return targetUserRole !== UserRole.SUPER_ADMIN;
    }

    // Others cannot delete/update users
    return false;
  }

  /**
   * Check if a user can create a user with a specific role
   * Super Admin > Admin > Asset Manager > User
   * Rules:
   * - Super Admin can create users with any role
   * - Admin can create users with roles lower than Admin (Asset Manager, User)
   * - Others cannot create users
   */
  canCreateUserWithRole(
    requestingUserRole: UserRole,
    targetUserRole: UserRole,
  ): boolean {
    // Super Admin can create any role
    if (requestingUserRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Admin can create roles lower than Admin (but not Super Admin or Admin)
    if (requestingUserRole === UserRole.ADMIN) {
      return (
        targetUserRole !== UserRole.SUPER_ADMIN &&
        targetUserRole !== UserRole.ADMIN
      );
    }

    // Others cannot create users
    return false;
  }

  /**
   * Get role hierarchy level
   * Higher number = higher privilege
   */
  getRoleLevel(role: UserRole): number {
    const hierarchy = {
      [UserRole.USER]: 0,
      [UserRole.ASSET_MANAGER]: 1,
      [UserRole.ADMIN]: 2,
      [UserRole.SUPER_ADMIN]: 3,
    };
    return hierarchy[role] || 0;
  }

  /**
   * Check if a user can promote another user to a specific role
   * Users can only be promoted to roles at or below their own level
   */
  canPromoteToRole(
    requestingUserRole: UserRole,
    targetRole: UserRole,
  ): boolean {
    const requestingLevel = this.getRoleLevel(requestingUserRole);
    const targetLevel = this.getRoleLevel(targetRole);

    return requestingLevel > targetLevel;
  }
}
