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
            label-width="80px"
            :disabled="!isEditing"
            class="compact-form"
          >
            <div class="form-row">
              <el-form-item label="ID">
                <el-input v-model="userForm.id" disabled />
              </el-form-item>
              <el-form-item label="用户名">
                <el-input v-model="userForm.username" disabled />
              </el-form-item>
            </div>
            <div class="form-row">
              <el-form-item label="邮箱">
                <el-input v-model="userForm.email" :disabled="!isEditing" />
              </el-form-item>
              <el-form-item label="用户类型">
                <el-input v-model="userForm.role" disabled />
              </el-form-item>
            </div>
            <div class="form-row">
              <el-form-item label="链上交易">
                <el-input v-model="userForm.chain_tx" disabled />
              </el-form-item>
            </div>
          </el-form>

          <div class="form-actions" v-if="isEditing">
            <el-button @click="cancelEdit">取消</el-button>
            <el-button type="primary" @click="saveProfile" :loading="saving">
              保存
            </el-button>
          </div>
        </el-card>

        <!-- 房东已上架房源 -->
        <el-card v-if="userForm.role === 'landlord'" class="listings-card">
          <template #header>
            <div class="card-header">
              <span>已上架房源</span>
              <el-button type="primary" @click="showCreateListingDialog">上架房源</el-button>
            </div>
          </template>

          <el-table :data="landlordListings" style="width: 100%">
            <el-table-column prop="ID" label="房源ID" width="100" />
            <el-table-column prop="housename" label="房源名称" />
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="location" label="位置" />
            <el-table-column prop="price" label="价格">
              <template #default="scope">
                ¥{{ scope.row.price }}/月
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'available' ? 'success' : 'info'">
                  {{ scope.row.status === 'available' ? '可租' : '已租' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="tenant_id" label="租客ID" width="100" />
            <el-table-column label="评价">
              <template #default="scope">
                <el-tag v-if="scope.row.reviews && scope.row.reviews.length > 0" type="success">
                  {{ scope.row.reviews.length }}条评价
                </el-tag>
                <el-tag v-else type="info">暂无评价</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button 
                  type="primary" 
                  size="small"
                  @click="viewListingDetail(scope.row.ID)"
                >
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 租客已租用房源 -->
        <el-card v-if="userForm.role === 'tenant'" class="rented-listings-card">
          <template #header>
            <div class="card-header">
              <span>已租用房源</span>
            </div>
          </template>

          <el-table :data="tenantListings" style="width: 100%">
            <el-table-column prop="ID" label="房源ID" width="100" />
            <el-table-column prop="housename" label="房源名称" />
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="location" label="位置" />
            <el-table-column prop="price" label="价格">
              <template #default="scope">
                ¥{{ scope.row.price }}/月
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态">
              <template #default="scope">
                <el-tag type="success">已租用</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="landlord_id" label="房东ID" width="100" />
            <el-table-column label="评价">
              <template #default="scope">
                <el-tag v-if="scope.row.reviews && scope.row.reviews.length > 0" type="success">
                  {{ scope.row.reviews.length }}条评价
                </el-tag>
                <el-tag v-else type="info">暂无评价</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button 
                  type="primary" 
                  size="small"
                  @click="viewListingDetail(scope.row.ID)"
                >
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
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
                  size="small"
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
          <span class="label">房东ID：</span>
          <span>{{ currentTransaction.landlord_id }}</span>
        </div>
        <div class="detail-item">
          <span class="label">租客ID：</span>
          <span>{{ currentTransaction.tenant_id }}</span>
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
        <div class="detail-item">
          <span class="label">链上交易：</span>
          <span>{{ currentTransaction.chain_tx || '暂无' }}</span>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="transactionDialogVisible = false">关闭</el-button>
          <el-button 
            v-if="userForm.role === 'landlord' && currentTransaction?.status === 'pending'"
            type="primary" 
            @click="confirmTransaction"
            :loading="confirming"
          >
            确认交易
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 创建房源对话框 -->
    <el-dialog
      v-model="createListingDialogVisible"
      title="上架房源"
      width="500px"
    >
      <el-form
        ref="createListingFormRef"
        :model="createListingForm"
        :rules="createListingRules"
        label-width="100px"
      >
        <el-form-item label="房源名称" prop="housename">
          <el-input v-model="createListingForm.housename" placeholder="请输入房源名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="createListingForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入房源描述"
          />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number
            v-model="createListingForm.price"
            :min="0"
            :precision="2"
            :step="100"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="位置" prop="location">
          <el-input v-model="createListingForm.location" placeholder="请输入房源位置" />
        </el-form-item>
        <el-form-item label="图片" prop="images">
          <el-input
            v-model="createListingForm.images"
            type="textarea"
            :rows="2"
            placeholder="请输入图片URL，多个图片用逗号分隔"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createListingDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createListing" :loading="creating">
            确认
          </el-button>
        </span>
      </template>
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
const landlordListings = ref([])
const tenantListings = ref([])
const confirming = ref(false)
const createListingDialogVisible = ref(false)
const createListingFormRef = ref(null)
const creating = ref(false)

const userForm = ref({
  id: '',
  username: '',
  email: '',
  role: '',
  chain_tx: ''
})

const createListingForm = ref({
  housename: '',
  description: '',
  price: 0,
  location: '',
  images: ''
})

const createListingRules = {
  housename: [
    { required: true, message: '请输入房源名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符之间', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入房源描述', trigger: 'blur' },
    { min: 5, max: 200, message: '长度在 5 到 200 个字符之间', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入价格', trigger: 'blur' }
  ],
  location: [
    { required: true, message: '请输入位置', trigger: 'blur' }
  ]
}

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
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        role: response.data.role,
        chain_tx: response.data.chain_tx || '暂无'
      }
      // 根据用户角色获取相应的房源列表
      if (userForm.value.role === 'landlord') {
        await fetchLandlordListings()
      } else if (userForm.value.role === 'tenant') {
        await fetchTenantListings()
      }
      // 获取交易记录
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

// 获取房东已上架房源
const fetchLandlordListings = async () => {
  try {
    const response = await api.post('/listings/landlord', {
      landlord_id: userStore.user.ID
    })
    if (response && response.data && response.data.data) {
      landlordListings.value = response.data.data.listings || []
    } else {
      ElMessage.error('获取房源列表失败：数据格式错误')
    }
  } catch (error) {
    console.error('获取房源列表失败:', error)
    ElMessage.error(error.response?.data?.error || '获取房源列表失败')
  }
}

// 获取租客已租用房源
const fetchTenantListings = async () => {
  try {
    const response = await api.post('/listings/tenant', {
      tenant_id: userStore.user.ID
    })
    if (response && response.data && response.data.data) {
      tenantListings.value = response.data.data.listings || []
    } else {
      ElMessage.error('获取房源列表失败：数据格式错误')
    }
  } catch (error) {
    console.error('获取房源列表失败:', error)
    ElMessage.error(error.response?.data?.error || '获取房源列表失败')
  }
}

// 查看房源详情
const viewListingDetail = (id) => {
  router.push(`/listings/${id}`)
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
      id: userForm.value.id,
      username: userForm.value.username,
      email: userForm.value.email,
      role: userForm.value.role,
      password: userStore.user.password,
      chain_tx: userForm.value.chain_tx
    })
    
    if (response && response.data && response.data.user) {
      ElMessage.success('保存成功')
      isEditing.value = false
      // 重新获取用户信息
      await fetchUserProfile()
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

// 确认交易
const confirmTransaction = async () => {
  if (!currentTransaction.value) return

  confirming.value = true
  try {
    const response = await api.post('/transaction/update', {
      id: currentTransaction.value.ID,
      status: 'completed',
      listing_id: currentTransaction.value.listing_id,
      landlord_id: currentTransaction.value.landlord_id,
      tenant_id: currentTransaction.value.tenant_id,
      amount: currentTransaction.value.amount,
      start_date: currentTransaction.value.start_date,
      end_date: currentTransaction.value.end_date
    })

    if (response && response.data && response.data.transaction) {
      ElMessage.success('交易确认成功')
      // 更新当前交易信息
      currentTransaction.value = response.data.transaction
      // 重新获取交易列表
      await fetchTransactions()
    } else {
      ElMessage.error('交易确认失败：数据格式错误')
    }
  } catch (error) {
    console.error('交易确认失败:', error)
    ElMessage.error(error.response?.data?.error || '交易确认失败')
  } finally {
    confirming.value = false
  }
}

// 显示创建房源对话框
const showCreateListingDialog = () => {
  createListingForm.value = {
    housename: '',
    description: '',
    price: 0,
    location: '',
    images: ''
  }
  createListingDialogVisible.value = true
}

// 创建房源
const createListing = async () => {
  if (!createListingFormRef.value) return

  try {
    await createListingFormRef.value.validate()
    creating.value = true

    const listingData = {
      housename: createListingForm.value.housename,
      description: createListingForm.value.description,
      price: parseFloat(createListingForm.value.price),
      location: createListingForm.value.location,
      images: createListingForm.value.images,
      landlord_id: parseInt(userStore.user.ID),
      status: 'available',
      chain_tx: ''
    }

    const response = await api.post('/listings/create', listingData)
    
    if (response && response.data && response.data.listing) {
      ElMessage.success('房源创建成功')
      createListingDialogVisible.value = false
      // 刷新房源列表
      await fetchLandlordListings()
    } else {
      ElMessage.error('房源创建失败：数据格式错误')
    }
  } catch (error) {
    console.error('房源创建失败:', error)
    ElMessage.error(error.response?.data?.error || '房源创建失败')
  } finally {
    creating.value = false
  }
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
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.card-header span {
  font-size: 16px;
  font-weight: 500;
}

.card-header .el-button {
  margin-left: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.compact-form {
  max-width: 800px;
  margin: 0 auto;
}

.form-row {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.form-row .el-form-item {
  flex: 1;
  margin-bottom: 0;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  padding-right: 8px;
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