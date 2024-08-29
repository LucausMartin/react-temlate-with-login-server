import { v4 as uuidv4 } from 'uuid';
/**
 * @description 格式化返回数据
 * @param code 状态码
 * @param message 信息
 * @param data 数据
 * @returns 格式化后的数据
 */
export const formatResponse = (
  code: number,
  message: string,
  data: { [key: string]: unknown } | string,
) => {
  return {
    code,
    message,
    data,
  };
};

/**
 * @description 生成UUID
 * @returns 生成的UUID
 */
function generateUUID() {
  return uuidv4();
}

export default generateUUID;
