import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodeMailer from 'nodemailer';
import { StayStateItemType } from './users.interface';
import { Users } from './users.entities';
import { RegisterErrorTypeEnums, LoginErrorTypeEnums } from './users.constants';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    private readonly jwtService: JwtService,
  ) {}

  // 邮件传输器
  private ransporter = nodeMailer.createTransport({
    host: 'smtp.qq.com',
    secure: true,
    auth: {
      user: '2602685411@qq.com',
      pass: 'bvrgjtoejrzbecbf',
    },
  });

  // 注册表
  private registerTable: StayStateItemType[] = [];
  // 登录表
  private loginTable: StayStateItemType[] = [];

  /**
   * @description 查询是否存在用户
   * @param email 邮箱
   * @returns 用户信息
   */
  hasUser = async (email: string): Promise<Users> => {
    return await this.usersRepository.findOneBy({ email });
  };

  /**
   * @description 向登录表中添加邮箱、验证码、倒计时定时器
   * @param email  邮箱
   * @param code 验证码
   * @returns 添加成功状态
   */
  addLoginUser = async (email: string, code: string) => {
    const sendRes = await this.sendVerificationCode(email, code, true);
    if (!sendRes.res) {
      return false;
    }
    const timer = setTimeout(() => {
      this.removeFromLoginTable(email);
    }, 5 * 60000);
    this.loginTable.push({ email, code, timer });
    return true;
  };

  /**
   * @description 从登录表中删除邮箱、验证码、倒计时定时器
   * @param email 邮箱
   * @returns 删除成功状态
   */
  removeFromLoginTable = (email: string) => {
    const index = this.loginTable.findIndex((item) => item.email === email);
    if (index === -1) {
      return false;
    }
    clearTimeout(this.loginTable[index].timer);
    this.loginTable.splice(index, 1);
    return true;
  };

  /**
   * @description 向注册表中添加邮箱、验证码、倒计时定时器
   * @param email 邮箱
   * @returns 添加成功状态
   */
  addRegisterUser = async (email: string, code: string) => {
    const sendRes = await this.sendVerificationCode(email, code, false);
    if (!sendRes.res) {
      return false;
    }
    const timer = setTimeout(() => {
      this.removeFromRegisterTable(email);
    }, 5 * 60000);
    this.registerTable.push({ email, code, timer });
    return true;
  };

  /**
   * @description 从注册表中删除邮箱、验证码、倒计时定时器
   * @param email 邮箱
   * @returns 删除成功状态
   */
  removeFromRegisterTable = (email: string) => {
    const index = this.registerTable.findIndex((item) => item.email === email);
    if (index === -1) {
      return false;
    }
    clearTimeout(this.registerTable[index].timer);
    this.registerTable.splice(index, 1);
    return true;
  };

  /**
   * @description 发送验证码
   * @param email 接收验证码的邮箱
   * @param code 验证码
   * @returns 发送成功状态
   */
  sendVerificationCode = async (
    email: string,
    code: string,
    login: boolean,
  ) => {
    let status: boolean;
    let message: nodeMailer.SentMessageInfo;
    await new Promise<void>((resolve, reject) => {
      this.ransporter.sendMail(
        {
          from: '2602685411@qq.com',
          to: email,
          subject: `网站账户${login ? '登录' : '注册'}验证码`,
          html:
            `
            <p>网站账户${login ? '登录' : '注册'}验证码：</p>
            <span style="font-size: 18px; color: red">` +
            code +
            `</span>`,
        },
        function (err: Error, info: nodeMailer.SentMessageInfo) {
          if (err) {
            status = false;
            message = info;
            reject();
          } else {
            status = true;
            resolve();
          }
        },
      );
    });
    return {
      res: status,
      message,
    };
  };

  /**
   * @description 随机生成英文加数字的六位验证码
   * @returns 验证码
   */
  generateVerificationCode(email: string) {
    // 检查是否已经发送过验证码
    const registerIndex = this.registerTable.findIndex(
      (item) => item.email === email,
    );
    if (registerIndex !== -1) {
      // 重置定时器
      clearTimeout(this.registerTable[registerIndex].timer);
      this.registerTable[registerIndex].timer = setTimeout(() => {
        this.removeFromRegisterTable(email);
      }, 5 * 60000);
      return this.registerTable[registerIndex].code;
    }
    const loginIndex = this.loginTable.findIndex(
      (item) => item.email === email,
    );
    if (loginIndex !== -1) {
      // 重置定时器
      clearTimeout(this.loginTable[loginIndex].timer);
      this.loginTable[loginIndex].timer = setTimeout(() => {
        this.removeFromLoginTable(email);
      }, 5 * 60000);
      return this.loginTable[loginIndex].code;
    }
    const letterCount = Math.floor(Math.random() * 3) + 3;
    const numberCount = 6 - letterCount;
    let code = '';
    for (let i = 0; i < letterCount; i++) {
      code += String.fromCharCode(Math.floor(Math.random() * 26) + 65);
    }
    for (let i = 0; i < numberCount; i++) {
      code += Math.floor(Math.random() * 10);
    }
    // 打乱
    code = code
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
    return code;
  }

  /**
   * @description 注册
   * @param email 邮箱
   * @param code 验证码
   * @returns 注册成功状态
   */
  register = async (email: string, code: string) => {
    const has = await this.hasUser(email);
    if (has) {
      return {
        res: false,
        message: 'User already exists',
        error_type: RegisterErrorTypeEnums.USER_ALREADY_EXISTS,
      };
    }
    const index = this.registerTable.findIndex((item) => item.email === email);
    if (index === -1) {
      return {
        res: false,
        message: 'No sent verification code',
        error_type: RegisterErrorTypeEnums.NO_SENT_CODE,
      };
    }
    if (this.registerTable[index].code !== code) {
      return {
        res: false,
        message: 'Verification code error',
        error_type: RegisterErrorTypeEnums.CODE_ERROR,
      };
    }
    const res = await this.usersRepository.insert({ email });
    if (!res) {
      return {
        res: false,
        message: 'User registration failed',
        error_type: RegisterErrorTypeEnums.FAILED_TO_REGISTER,
      };
    }
    this.removeFromRegisterTable(email);
    return {
      res: true,
      message: 'Register successfully',
    };
  };

  /**
   * @description 登录
   * @param email 邮箱
   * @param code 验证码
   * @returns 登录成功状态
   */
  login = async (email: string, code: string) => {
    const index = this.loginTable.findIndex((item) => item.email === email);
    if (index === -1) {
      return {
        res: false,
        message: 'No sent verification code',
        error_type: LoginErrorTypeEnums.NO_SENT_CODE,
      };
    }
    if (this.loginTable[index].code !== code) {
      return {
        res: false,
        message: 'Verification code error',
        error_type: LoginErrorTypeEnums.CODE_ERROR,
      };
    }
    const res = await this.hasUser(email);
    if (!res) {
      return {
        res: false,
        message: 'User does not exist',
        error_type: LoginErrorTypeEnums.USER_DOES_NOT_EXIST,
      };
    }
    this.removeFromLoginTable(email);
    return {
      res: true,
      message: 'Login successfully',
    };
  };

  /**
   * @description 生成访问 token
   * @param email 邮箱
   * @returns token
   */
  generateAccessToken = (email: string) => {
    return this.jwtService.sign({ email, type: 'access' });
  };

  /**
   * @description 生成刷新 token
   * @param email 邮箱
   * @returns token
   */
  generateRefreshToken = (email: string) => {
    return this.jwtService.sign(
      { email, type: 'refresh' },
      {
        expiresIn: '7d',
      },
    );
  };
}
