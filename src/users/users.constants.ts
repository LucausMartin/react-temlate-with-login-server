/**
 * @description 发送验证码请求错误类型枚举
 */
export const enum SendCodeErrorTypeEnums {
  USER_NOT_FOUND = 1,
  USER_ALREADY_EXISTS = 2,
  FAILED_TO_SEND = 3,
}

/**
 * @description 注册请求错误类型枚举
 */
export const enum RegisterErrorTypeEnums {
  NO_SENT_CODE = 1,
  CODE_ERROR = 2,
  FAILED_TO_REGISTER = 3,
  USER_ALREADY_EXISTS = 4,
}

/**
 * @description 登录请求错误类型枚举
 */
export const enum LoginErrorTypeEnums {
  NO_SENT_CODE = 1,
  CODE_ERROR = 2,
  USER_DOES_NOT_EXIST = 3,
}

export const enum RefreshTokenErrorTypeEnums {
  TOKEN_TYPE_INVALID = 2,
}
