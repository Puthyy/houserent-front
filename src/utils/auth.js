import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 5000,
  withCredentials: true // 允许跨域请求携带 cookie
})

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response
  },
  error => {
    if (error.response) {
      // 处理错误响应
      const { status, data } = error.response
      if (status === 401) {
        // 未授权，跳转到登录页
        window.location.href = '/login'
      }
      return Promise.reject(data)
    }
    return Promise.reject(error)
  }
)

/**
 * 用户注册
 * @param {Object} userData - 用户注册数据
 * @param {string} userData.username - 用户名
 * @param {string} userData.password - 密码
 * @param {string} userData.role - 角色 (landlord/tenant)
 * @param {string} userData.email - 邮箱
 * @returns {Promise} 返回注册结果
 */
export const register = (userData) => {
  return api.post('/register', userData)
}

/**
 * 用户登录
 * @param {Object} credentials - 登录凭证
 * @param {string} credentials.username - 用户名
 * @param {string} credentials.password - 密码
 * @returns {Promise} 返回登录结果，包含用户信息
 */
export const login = (credentials) => {
  return api.post('/login', credentials)
}

/**
 * 用户登出
 * @returns {Promise} 返回登出结果
 */
export const logout = () => {
  return api.post('/logout')
}

export default api 