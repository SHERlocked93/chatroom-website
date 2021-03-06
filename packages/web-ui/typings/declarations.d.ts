/// <reference types="im-core/typings" />
declare module '*.css' {
  const classes: { readonly [className: string]: string };
  export default classes;
}

declare module '*.scss' {
  const classes: { readonly [className: string]: string };
  export default classes;
}

declare interface IAction {
  type: string
  payload?: any    // todo: 完善payload类型
}

// 聊天室信息对象
declare interface IChatroomInfoItem {
  id: number;
  name: string;
  messageList: IMessageItem[];
}

declare interface apiResponse<T = any> {
  code: number;
  data?: T;
  message?: string;
}

declare interface userInfo {
  uid: number | null;
  username: string | null;
}

declare interface loginQuery {
  username: string;
  password: string;
}

// 聊天室面板信息，显示在chatroomList中预览的
declare interface IChatroomNameItem {
  id: number;
  name: string;
  // 最近消息
  recentMessage: string | null;
  recentMessageUsername: string | null;
}

// 请求消息体
declare interface IMessageItemRequest extends userInfo {
  message: string;
}

// 消息体
declare interface IMessageItem extends userInfo {
  message: string;
  messageId: string;
}

interface IAction {
  type: string;
  payload?: any;
}
