<template>
  <div class="profile-page">
    <div class="profile-container">
      <div class="profile-header">
        <h1>个人中心</h1>
      </div>

      <div class="profile-content" v-loading="loading">
        <el-card class="profile-card">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
              <el-button type="primary" @click="startEdit" v-if="!isEditing">编辑</el-button>
            </div>
          </template>

          <el-form 
            :model="userForm" 
            label-width="100px"
            :disabled="!isEditing"
          >
            <el-form-item label="用户名">
              <el-input v-model="userForm.username" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="userForm.email" />
            </el-form-item>
            <el-form-item label="用户类型">
              <el-input v-model="userForm.role" disabled />
            </el-form-item>
          </el-form>

          <div class="form-actions" v-if="isEditing">
            <el-button @click="cancelEdit">取消</el-button>
            <el-button type="primary" @click="saveProfile" :loading="saving">
              保存
            </el-button>
          </div>
        </el-card>

        <el-card class="transactions-card">
          <template #header>
            <div class="card-header">
              <span>交易记录</span>
            </div>
          </template>

          <el-table :data="transactions" style="width: 100%">
            <el-table-column prop="listing_id" label="房源ID" width="100" />
            <el-table-column prop="amount" label="金额">
              <template #default="scope">
                ¥{{ scope.row.amount }}/月
              </template>
            </el-table-column>
            <el-table-column prop="start_date" label="起租日期" />
            <el-table-column prop="end_date" label="到期日期" />
            <el-table-column prop="status" label="状态">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button 
                  type="primary" 
                  link
                  @click="viewTransactionDetail(scope.row.ID)"
                >
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </div>

    <!-- 交易详情对话框 -->
    <el-dialog
      v-model="transactionDialogVisible"
      title="交易详情"
      width="600px"
    >
      <div v-if="currentTransaction" class="transaction-detail">
        <div class="detail-item">
          <span class="label">交易ID：</span>
          <span>{{ currentTransaction.ID }}</span>
        </div>
        <div class="detail-item">
          <span class="label">房源ID：</span>
          <span>{{ currentTransaction.listing_id }}</span>
        </div>
        <div class="detail-item">
          <span class="label">金额：</span>
          <span>¥{{ currentTransaction.amount }}/月</span>
        </div>
        <div class="detail-item">
          <span class="label">起租日期：</span>
          <span>{{ currentTransaction.start_date }}</span>
        </div>
        <div class="detail-item">
          <span class="label">到期日期：</span>
          <span>{{ currentTransaction.end_date }}</span>
        </div>
        <div class="detail-item">
          <span class="label">状态：</span>
          <el-tag :type="getStatusType(currentTransaction.status)">
            {{ getStatusText(currentTransaction.status) }}
          </el-tag>
        </div>
        <div class="detail-item">
          <span class="label">创建时间：</span>
          <span>{{ formatDate(currentTransaction.CreatedAt) }}</span>
        </div>
        <div class="detail-item">
          <span class="label">更新时间：</span>
          <span>{{ formatDate(currentTransaction.UpdatedAt) }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/utils/auth'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const saving = ref(false)
const isEditing = ref(false)
const transactions = ref([])
const transactionDialogVisible = ref(false)
const currentTransaction = ref(null)

const userForm = ref({
  username: '',
  email: '',
  role: '',
  password: ''
})

// 获取用户信息
const fetchUserProfile = async () => {
  // 检查用户是否已登录
  if (!userStore.user) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  loading.value = true
  try {
    const response = await api.post('/user', {
      id: userStore.user.ID
    })
    if (response && response.data) {
      userForm.value = {
        username: response.data.username,
        email: response.data.email,
        role: response.data.role
      }
      // 获取用户信息后立即获取交易记录
      await fetchTransactions()
    } else {
      ElMessage.error('获取用户信息失败：数据格式错误')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error(error.response?.data?.error || '获取用户信息失败')
  } finally {
    loading.value = false
  }
}

// 获取交易记录
const fetchTransactions = async () => {
  try {
    let response
    if (userForm.value.role === 'landlord') {
      response = await api.post('/transactions/landlord', {
        landlord_id: userStore.user.ID
      })
    } else {
      response = await api.post('/transactions/tenant', {
        tenant_id: userStore.user.ID
      })
    }
    if (response && response.data) {
      transactions.value = response.data.transactions || []
    } else {
      ElMessage.error('获取交易记录失败：数据格式错误')
    }
  } catch (error) {
    console.error('获取交易记录失败:', error)
    ElMessage.error(error.response?.data?.error || '获取交易记录失败')
  }
}

// 开始编辑
const startEdit = () => {
  isEditing.value = true
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
  fetchUserProfile() // 重新加载用户信息
}

// 保存个人信息
const saveProfile = async () => {
  saving.value = true
  try {
    const response = await api.post('/update', {
      id: userStore.user.ID,
      username: userForm.value.username,
      email: userForm.value.email,
      role: userForm.value.role,
      password: userForm.value.password || userStore.user.password,
      chain_tx: userStore.user.chain_tx || ''
    })
    
    if (response && response.data && response.data.user) {
      ElMessage.success('保存成功')
      isEditing.value = false
      // 更新 store 中的用户信息
      userStore.updateUserInfo(response.data.user)
      // 重新获取交易记录
      await fetchTransactions()
    } else {
      ElMessage.error('保存失败：数据格式错误')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error(error.response?.data?.error || '保存失败')
  } finally {
    saving.value = false
  }
}

// 查看交易详情
const viewTransactionDetail = async (id) => {
  try {
    const response = await api.post('/transaction/get', { id })
    currentTransaction.value = response.data.transaction
    transactionDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取交易详情失败')
  }
}

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    completed: 'success',
    cancelled: 'danger'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    pending: '待处理',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

// 格式化日期
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  // 检查用户是否已登录
  if (!userStore.user) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  fetchUserProfile()
})
</script>

<style scoped>
.profile-page {
  padding: 24px;
}

.profile-container {
  max-width: 1000px;
  margin: 0 auto;
}

.profile-header {
  margin-bottom: 24px;
}

.profile-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.profile-content {
  display: grid;
  gap: 24px;
}

.profile-card,
.transactions-card {
  background: #fff;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-size: 16px;
  font-weight: 500;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input__wrapper) {
  box-shadow: none;
  border: 1px solid #dcdfe6;
}

:deep(.el-input__wrapper:hover) {
  border-color: #409eff;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 1px #409eff;
}

.transaction-detail {
  padding: 20px;
}

.detail-item {
  display: flex;
  margin-bottom: 16px;
  line-height: 32px;
}

.detail-item .label {
  width: 100px;
  color: #606266;
  font-weight: 500;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.el-select {
  width: 100%;
}
</style> 