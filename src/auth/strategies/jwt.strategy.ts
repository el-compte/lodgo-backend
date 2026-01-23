import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First, try to extract from Authorization header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Then, try to extract from cookies
        (req: Request) => {
          if (req.cookies && req.cookies.accessToken) {
            return req.cookies.accessToken;
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    return this.authService.validateUser(payload);
  }
}
