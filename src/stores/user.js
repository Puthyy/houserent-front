import { defineStore } from 'pinia'
import { ref } from 'vue'
import { register, login, logout } from '@/utils/auth'

/**
 * 用户状态管理
 * 基于 Pinia 的状态管理，处理用户认证相关状态
 */
export const useUserStore = defineStore('user', () => {
  // 用户信息，与后端 User 结构体对应
  const user = ref(null)

  /**
   * 设置用户信息
   * @param {Object} userData - 用户数据，与后端 User 结构体对应
   */
  function setUser(userData) {
    user.value = userData
  }

  /**
   * 清除用户信息
   */
  function clearUser() {
    user.value = null
  }

  /**
   * 用户注册
   * @param {Object} userData - 用户注册数据
   * @returns {Promise} 返回注册结果
   */
  async function registerUser(userData) {
    try {
      const response = await register(userData)
      return response.data
    } catch (error) {
      throw error
    }
  }

  /**
   * 用户登录
   * @param {Object} credentials - 登录凭证
   * @returns {Promise} 返回登录结果
   */
  async function loginUser(credentials) {
    try {
      const response = await login(credentials)
      setUser(response.data.user)
      return response.data
    } catch (error) {
      throw error
    }
  }

  /**
   * 用户登出
   * @returns {Promise} 返回登出结果
   */
  async function logoutUser() {
    try {
      await logout()
      clearUser()
    } catch (error) {
      // 即使后端请求失败，也清除本地状态
      clearUser()
      throw error
    }
  }

  /**
   * 检查用户是否已登录
   * @returns {boolean} 是否已登录
   */
  function isLoggedIn() {
    return user.value !== null
  }

  return {
    user,
    setUser,
    clearUser,
    registerUser,
    loginUser,
    logoutUser,
    isLoggedIn
  }
}) 