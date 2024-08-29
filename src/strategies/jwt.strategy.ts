import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_CONFIG } from 'src/constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'access') {
  constructor() {
    super({
      // 分别传入这些参数
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_CONFIG.secret,
    });
  }

  // token校验成功,会走到这里,否则会直接走401
  async validate(payload: {
    email: string;
    type: 'access' | 'refresh';
    exp: number;
    iat: number;
  }) {
    if (payload.type !== 'access') {
      return false;
    }
    return payload;
  }
}
