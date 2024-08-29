import { Body, Controller, Post, UseGuards, Get, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { formatResponse } from 'src/utils';
import { HTTP_STATUS } from 'src/constants';
import {
  SendCodeErrorTypeEnums,
  RefreshTokenErrorTypeEnums,
} from './users.constants';
import { Request } from 'express';
import { Public } from 'src/decorators/public.decorator';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RefreshJwtAuthGuard } from 'src/guards/refresh-jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 发送验证码接口
  @Public()
  @UseGuards(JwtAuthGuard)
  @Post('send-verification-code')
  async sendVerificationCode(
    @Body('email') email: string,
    @Body('login') login: boolean,
  ) {
    // 检查是否存在用户
    const user = await this.usersService.hasUser(email);
    // 如果是登录操作，但是用户不存在，报错
    if (login && !user) {
      return formatResponse(HTTP_STATUS.UNAUTHORIZED, 'User not found', {
        error_type: SendCodeErrorTypeEnums.USER_NOT_FOUND,
      });
    }
    // 如果是注册操作，但是用户已存在，报错
    if (!login && user) {
      return formatResponse(HTTP_STATUS.CONFLICT, 'User already exists', {
        error_type: SendCodeErrorTypeEnums.USER_ALREADY_EXISTS,
      });
    }
    // 生成验证码
    const code = this.usersService.generateVerificationCode(email);
    if (login) {
      const addRes = await this.usersService.addLoginUser(email, code);
      // 如果添加过程发送验证码失败，返回错误
      if (!addRes) {
        return formatResponse(
          HTTP_STATUS.BAD_REQUEST,
          'Failed to send verification code',
          {
            error_type: SendCodeErrorTypeEnums.FAILED_TO_SEND,
          },
        );
      }
    } else {
      const addRes = await this.usersService.addRegisterUser(email, code);
      // 如果添加过程发送验证码失败，返回错误
      if (!addRes) {
        return formatResponse(
          HTTP_STATUS.BAD_REQUEST,
          'Failed to send verification code',
          {
            error_type: SendCodeErrorTypeEnums.FAILED_TO_SEND,
          },
        );
      }
    }
    // 返回成功
    return formatResponse(HTTP_STATUS.OK, 'Send successfully', {
      success: true,
    });
  }

  @Public()
  @UseGuards(JwtAuthGuard)
  @Post('register')
  async register(@Body() body) {
    const { email, code } = body;
    const registerUser = await this.usersService.register(email, code);
    if (!registerUser.res) {
      return formatResponse(HTTP_STATUS.BAD_REQUEST, registerUser.message, {
        error_type: registerUser.error_type,
      });
    } else {
      return formatResponse(HTTP_STATUS.CREATED, registerUser.message, {
        access_token: this.usersService.generateAccessToken(email),
        refresh_token: this.usersService.generateRefreshToken(email),
      });
    }
  }

  @Public()
  @UseGuards(JwtAuthGuard)
  @Post('login')
  async login(@Body() body) {
    const { email, code } = body;
    const loginUser = await this.usersService.login(email, code);
    if (!loginUser.res) {
      return formatResponse(HTTP_STATUS.UNAUTHORIZED, loginUser.message, {
        error_type: loginUser.error_type,
      });
    } else {
      return formatResponse(HTTP_STATUS.OK, loginUser.message, {
        accessToken: this.usersService.generateAccessToken(email),
        refreshToken: this.usersService.generateRefreshToken(email),
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('test')
  async test(@Req() request: Request) {
    console.log(request.user);
    return formatResponse(HTTP_STATUS.OK, 'Test successfully', {
      user: request.user,
    });
  }

  @UseGuards(RefreshJwtAuthGuard)
  @Get('refresh-token')
  async refreshToken(@Req() request: Request) {
    const { email, type } = request.user as {
      email: string;
      type: string;
      exp: number;
    };
    if (type !== 'refresh') {
      return formatResponse(HTTP_STATUS.BAD_REQUEST, 'Invalid token type', {
        error_type: RefreshTokenErrorTypeEnums.TOKEN_TYPE_INVALID,
      });
    }
    return formatResponse(HTTP_STATUS.OK, 'Refresh token successfully', {
      access_token: this.usersService.generateAccessToken(email),
      refresh_token: this.usersService.generateRefreshToken(email),
    });
  }
}
