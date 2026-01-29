import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../enums/user-role.enum';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

@Injectable()
export class PermissionsMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // This middleware assumes user is already authenticated
    // and attached to request.user by JWT strategy
    if (!req.user) {
      throw new ForbiddenException('User not authenticated');
    }

    // User is authenticated, continue
    next();
  }
}

@Injectable()
export class AdminPermissionMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (
      req.user.role !== UserRole.ADMIN &&
      req.user.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Admin access required');
    }

    next();
  }
}

@Injectable()
export class SuperAdminPermissionMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super admin access required');
    }

    next();
  }
}

@Injectable()
export class AssetManagerPermissionMiddleware implements NestMiddleware {
  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
      throw new ForbiddenException('User not authenticated');
    }

    const allowedRoles = [
      UserRole.ASSET_MANAGER,
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ];
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException('Asset manager access required');
    }

    next();
  }
}
