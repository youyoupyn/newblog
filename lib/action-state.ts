/**
 * 表单状态。放在这里而不是 actions 文件里，是因为 "use server" 文件
 * 只能导出 async 函数，导出常量会导致构建报错。
 */
export type ActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export const EMPTY_ACTION_STATE: ActionState = { ok: false };
