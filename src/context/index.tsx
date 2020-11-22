import React, { useEffect, useMemo, useReducer, useRef } from 'react'
import * as Api from 'apis'
import { USER_INFO, USER_SEND_MESSAGE, USER_SEND_MESSAGE_RES } from 'constants/browser'
import { io, Socket } from 'socket.io-client'
import { BaseURL } from 'constants/server'
import * as Utils from 'utils'

interface IAction {
    type: string
    payload?: any    // todo: 完善payload类型
}

declare interface IContextType {
    socket: Socket,
    userInfo: userInfo,
    chatroomInfoList: IChatroomInfoItem[],
    currentChatroom: IChatroomInfoItem | null,
}

type MyCreateContext = IContextType & { chatroomNameListMemo?: IChatroomNameItem[] }

const initContextValue: IContextType = {
    chatroomInfoList: [],
    currentChatroom: null,
    userInfo: {
        uid: null,
        username: null
    },
    socket: io(BaseURL, { transports: ['websocket', 'xhr-polling', 'jsonp-polling'] })
}

// todo 这里一定要传么？
// @ts-ignore
const Context = React.createContext<{ state: MyCreateContext, dispatch: React.Dispatch<IAction> }>(null)

// Actions
const RESET_USER_INFO = 'RESET_USER_INFO'
const CHANGE_CHATROOM = 'CHANGE_CHATROOM'
const CHATROOM_INFO_LIST = 'CHATROOM_INFO_LIST'
const USER_LOGIN = 'USER_LOGIN'

const ACTIONS = {
    RESET_USER_INFO,
    CHANGE_CHATROOM,
    CHATROOM_INFO_LIST,
    USER_LOGIN
}

const reducer: React.Reducer<IContextType, IAction> = (state: IContextType, action: IAction): MyCreateContext => {
    console.log('reducer: ', state, action)
    switch (action.type) {
        case ACTIONS.RESET_USER_INFO:
            return { ...state, ...resetUserInfo() }
        case ACTIONS.CHANGE_CHATROOM:
            return { ...state, ...changeChatroom(action.payload, state) }
        case ACTIONS.CHATROOM_INFO_LIST: {
            return { ...state, ...action.payload }
        }
        case ACTIONS.USER_LOGIN: {
            const { userInfo } = action.payload
            userInfo && sessionStorage.setItem(USER_INFO, JSON.stringify(userInfo))
            return { ...state, userInfo }
        }
        default:
            return state
    }
}

// 清空用户信息
const resetUserInfo = (): { userInfo: userInfo } => {
    sessionStorage.removeItem(USER_INFO)
    return { userInfo: { uid: null, username: null } }
}

// 用户在群组发送消息
// const addMessage = ({ chatroomId, messageObj }: { chatroomId: number, messageObj: IMessageItemRequest }, state: IContextType): void => {
//     state.socket.emit(USER_SEND_MESSAGE, { chatroomId, messageObj })
// }

// 获取群list信息
const getChatroomInfoList = async(): Promise<{ chatroomInfoList: IChatroomInfoItem[] }> => {
    return { chatroomInfoList: await Api.chatroomInfoList() }
}

// 切换群
const changeChatroom = ({ chatroomId }: { chatroomId: number }, state: IContextType): { currentChatroom: IChatroomInfoItem | null } => {
    return { currentChatroom: state.chatroomInfoList.find((T: IChatroomInfoItem) => T.id === chatroomId) || null }
}

// 获取保存在sessionStorage中的用户信息，刷新页面的时候不需要重新登录
const initContextValueFunc = (initContextValue: IContextType) => {
    const sessUserInfo = sessionStorage.getItem(USER_INFO)
    const userInfo = sessUserInfo ? JSON.parse(sessUserInfo) : sessUserInfo
    return { ...initContextValue, userInfo }
}

const ContextProvider = (props: { children: React.ReactNode }): JSX.Element => {
    const [state, dispatch] = useReducer(reducer, initContextValue, initContextValueFunc)
    const chatroomInfoListRef = useRef(state.chatroomInfoList)

    useEffect(() => {
        chatroomInfoListRef.current = state.chatroomInfoList
    }, [state.chatroomInfoList])

    // socket 订阅消息
    useEffect(() => {
        state.socket.on(USER_SEND_MESSAGE_RES, ({ chatroomId, newMessage }: { chatroomId: number, newMessage: IMessageItem }) => {
            const chatroom = chatroomInfoListRef.current.find(chatroom => chatroom.id === chatroomId)
            if (!chatroom) return
            const otherChatroomList = Utils.removeItemInArray<IChatroomInfoItem>(chatroomInfoListRef.current, chatroom)
            const newChatroomInfo = { ...chatroom, messageList: [...chatroom!.messageList, newMessage] }
            dispatch({
                type: ACTIONS.CHATROOM_INFO_LIST,
                payload: { chatroomInfoList: [newChatroomInfo, ...otherChatroomList] }
            })
        })
        Api.chatroomInfoList()
            .then((chatroomInfoList) => {
                dispatch({
                    type: ACTIONS.CHATROOM_INFO_LIST,
                    payload: { chatroomInfoList, currentChatroom: chatroomInfoList.length ? chatroomInfoList[0] : null }
                })
            })
    }, [])

    // 计算属性： 获取左侧群列表信息
    const chatroomNameListMemo: IChatroomNameItem[] = useMemo(() => state.chatroomInfoList?.map(T => {
        const lastMessage = T.messageList.slice(-1)[0]
        return ({
            id: T.id,
            name: T.name,
            recentMessage: lastMessage?.message,
            recentMessageUsername: lastMessage?.username
        })
    }), [state.chatroomInfoList])
    return <Context.Provider value={ { state: { ...state, chatroomNameListMemo }, dispatch } }>
        { props.children }</Context.Provider>
}

export { Context, ContextProvider, ACTIONS }