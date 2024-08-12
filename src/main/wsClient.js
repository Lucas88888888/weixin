import WebSocket from 'ws'
const NODE_ENV = process.env.NODE_ENV

import store from './store'
import { saveOrUpdateChatSessionBatch4Init } from './db/ChatSessionUserModel'
import { saveMessageBatch } from './db/ChatMessageModel'
import { updateContactNoReadCount } from './db/UserSettingModel'

let ws = null
let maxReConnectTimes = null
let lockReconnect = false
let wsUrl = null
let sender = null
let needReconnect = null
const initWs = (config, _sender) => {
  wsUrl = `${NODE_ENV !== 'development' ? store.getData('prodWsDomain') : store.getData('devWsDomain')}?token=${config.token}`
  sender = _sender
  needReconnect = true
  maxReConnectTimes = 5
  createWs()
}

const createWs = () => {
  if (wsUrl == null) {
    return
  }

  ws = new WebSocket(wsUrl)
  ws.onopen = function () {
    console.log('客户端连接成功')
    ws.send('heart beat')
    maxReConnectTimes = 5
  }

  //从服务器接收到信息的回调函数
  ws.onmessage = async function (e) {
    console.log('收到服务器消息', e.data)
    const message = JSON.parse(e.data)
    const messageType = message.messageType
    switch (messageType) {
      case 0: //ws连接成功
        //保存会话信息
        await saveOrUpdateChatSessionBatch4Init(message.extendData.chatSessionList)

        //保存消息
        await saveMessageBatch(message.extendData.chatMessageList)

        //更新联系人申请数
        await updateContactNoReadCount({
          userId: store.getUserId(),
          noReadCount: message.extendData.applyCount
        })
        //   sender.send('')
        break
    }
  }

  ws.onclose = function () {
    console.log('关闭客户端连接重连')
    reconnect()
  }

  ws.onerror = function () {
    console.log('连接失败了准备重连')
    reconnect()
  }

  const reconnect = () => {
    if (!needReconnect) {
      console.log('连接断开无需重连')
      return
    }
    if (ws != null) {
      ws.close()
    }
    if (lockReconnect) {
      return
    }
    lockReconnect = true
    if (maxReConnectTimes > 0) {
      console.log('准备重连，剩余重来次数' + maxReConnectTimes, new Date().getTime())
      maxReConnectTimes--
      setTimeout(() => {
        createWs()
        lockReconnect = false
      }, 5000)
    } else {
      console.log('连接已经超时')
    }
  }

  setInterval(() => {
    if (ws != null && ws.readyState == 1) {
      ws.send('heart beat')
    }
  }, 5000)
}

const closeWs = () => {
  needReconnect = false
  ws.close()
}

export { initWs, closeWs }
