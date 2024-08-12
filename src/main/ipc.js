import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import store from './store'
import { initWs } from './wsClient'
import { addUserSetting } from './db/UserSettingModel'

const NODE_ENV = process.env.NODE_ENV

const onLoginOrRegister = (callback) => {
  ipcMain.on('loginOrRegister', (e, isLogin) => {
    callback(isLogin)
  })
}

const onLoginSuccess = (callback) => {
  ipcMain.on('openChat', (e, config) => {
    store.initUserId(config.userId)
    store.setUserData('token', config.token)
    addUserSetting(config.userId, config.email)
    callback(config)
    initWs(config, e.sender)
  })
}

const winTitleOp = (callback) => {
  ipcMain.on('winTitleOp', (e, data) => {
    callback(e, data)
  })
}

const onSetLocalStore = () => {
  ipcMain.on('setLocalStore', (e, { key, value }) => {
    store.setData(key, value)
    console.log(store.getData(key))
  })
}

const onGetLocalStore = () => {
  ipcMain.on('getLocalStore', (e, key) => {
    console.log('收到渲染进程的获取事件key:', key)
    e.sender.send('getLocalStoreCallback', '这是主进程返回的内容:' + store.getData(key))
  })
}

export { onLoginOrRegister, onLoginSuccess, winTitleOp, onSetLocalStore, onGetLocalStore }
