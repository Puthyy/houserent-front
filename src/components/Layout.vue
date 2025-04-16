<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-wrapper">
        <div class="logo-section">
          <router-link to="/" class="logo">房屋租赁系统</router-link>
        </div>
        
        <nav class="nav-section">
          <router-link to="/" class="nav-item">首页</router-link>
          <router-link to="/listings" class="nav-item">房源市场</router-link>
          <router-link to="/profile" class="nav-item">个人中心</router-link>
        </nav>
        
        <div class="user-section">
          <template v-if="userStore.isLoggedIn">
            <el-button type="primary" @click="handleLogout">退出登录</el-button>
          </template>
          <template v-else>
            <el-button type="primary" @click="$router.push('/login')">登录/注册</el-button>
          </template>
        </div>
      </div>
    </header>

    <main class="app-main">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const router = useRouter()

const handleLogout = async () => {
  try {
    await userStore.logoutUser()
    ElMessage.success('退出登录成功')
    router.push('/login')
  } catch (error) {
    ElMessage.error('退出登录失败')
  }
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.app-header {
  background-color: #ffffff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 64px;
}

.header-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.logo-section {
  flex: 0 0 auto;
}

.logo {
  font-size: 24px;
  font-weight: 600;
  color: #409EFF;
  text-decoration: none;
  letter-spacing: 0.5px;
}

.nav-section {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 40px;
  margin: 0 40px;
}

.nav-item {
  color: #606266;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  padding: 8px 0;
  position: relative;
  transition: color 0.3s;
}

.nav-item:hover {
  color: #409EFF;
}

.nav-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #409EFF;
  transform: scaleX(0);
  transition: transform 0.3s;
}

.nav-item:hover::after {
  transform: scaleX(1);
}

.router-link-active {
  color: #409EFF;
}

.router-link-active::after {
  transform: scaleX(1);
}

.user-section {
  flex: 0 0 auto;
}

.app-main {
  margin-top: 64px;
  flex: 1;
  padding: 24px;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
}

:deep(.el-button) {
  font-size: 14px;
  font-weight: 500;
  padding: 8px 24px;
  border-radius: 4px;
  transition: all 0.3s;
}

:deep(.el-button--primary) {
  background-color: #409EFF;
  border-color: #409EFF;
}

:deep(.el-button--primary:hover) {
  background-color: #66b1ff;
  border-color: #66b1ff;
}
</style> 