<template>
  <div class="listing-detail">
    <div class="listing-container">
      <div class="listing-header">
        <h1>{{ listing.housename }}</h1>
        <el-tag :type="listing.status === 'available' ? 'success' : 'danger'">
          {{ listing.status === 'available' ? '可租' : '已租' }}
        </el-tag>
      </div>

      <div class="listing-content" v-loading="loading">
        <el-card class="listing-card">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
            </div>
          </template>

          <div class="listing-info">
            <div class="info-item">
              <span class="label">房源ID：</span>
              <span>{{ listing.ID }}</span>
            </div>
            <div class="info-item">
              <span class="label">房屋名称：</span>
              <span>{{ listing.housename }}</span>
            </div>
            <div class="info-item">
              <span class="label">描述：</span>
              <span>{{ listing.description }}</span>
            </div>
            <div class="info-item">
              <span class="label">位置：</span>
              <span>{{ listing.location }}</span>
            </div>
            <div class="info-item">
              <span class="label">价格：</span>
              <span>¥{{ listing.price }}/月</span>
            </div>
            <div class="info-item">
              <span class="label">状态：</span>
              <el-tag :type="listing.status === 'available' ? 'success' : 'danger'">
                {{ listing.status === 'available' ? '可租' : '已租' }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">链上交易：</span>
              <span>{{ listing.chain_tx || '暂无' }}</span>
            </div>
          </div>
        </el-card>

        <el-card class="landlord-card">
          <template #header>
            <div class="card-header">
              <span>房东信息</span>
            </div>
          </template>

          <div class="landlord-info">
            <div class="info-item">
              <span class="label">房东ID：</span>
              <span>{{ listing.landlord_id }}</span>
            </div>
            <div class="info-item">
              <span class="label">房东用户名：</span>
              <span>{{ landlord.username }}</span>
            </div>
            <div class="info-item">
              <span class="label">邮箱：</span>
              <span>{{ landlord.email }}</span>
            </div>
            <div class="info-item">
              <span class="label">链上交易：</span>
              <span>{{ landlord.chain_tx || '暂无' }}</span>
            </div>
          </div>
        </el-card>

        <el-card class="reviews-card" v-if="listing.reviews && listing.reviews.length > 0">
          <template #header>
            <div class="card-header">
              <span>租客评价</span>
            </div>
          </template>

          <div class="reviews-list">
            <div v-for="review in listing.reviews" :key="review.ID" class="review-item">
              <div class="review-header">
                <el-rate v-model="review.rating" disabled show-score />
                <span class="review-date">{{ formatDate(review.CreatedAt) }}</span>
              </div>
              <p class="review-content">{{ review.comment }}</p>
            </div>
          </div>
        </el-card>

        <div class="action-card" v-if="listing.status === 'available' && userStore.user && userStore.user.role === 'tenant'">
          <el-button type="primary" size="large" @click="showTransactionDialog">立即租用</el-button>
        </div>
      </div>
    </div>

    <!-- 交易对话框 -->
    <el-dialog
      v-model="transactionDialogVisible"
      title="创建交易"
      width="500px"
    >
      <el-form
        ref="transactionFormRef"
        :model="transactionForm"
        :rules="transactionRules"
        label-width="100px"
      >
        <el-form-item label="起租日期" prop="start_date">
          <el-date-picker
            v-model="transactionForm.start_date"
            type="date"
            placeholder="选择起租日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledDate"
          />
        </el-form-item>
        <el-form-item label="租期（月）" prop="months">
          <el-input-number
            v-model="transactionForm.months"
            :min="1"
            :max="12"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="transactionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createTransaction" :loading="creating">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const creating = ref(false)
const listing = ref({})
const landlord = ref({})
const transactionDialogVisible = ref(false)
const transactionFormRef = ref(null)

const transactionForm = ref({
  start_date: '',
  months: 1
})

const transactionRules = {
  start_date: [
    { required: true, message: '请选择起租日期', trigger: 'change' }
  ],
  months: [
    { required: true, message: '请选择租期', trigger: 'change' }
  ]
}

// 获取房源详情
const fetchListingDetail = async () => {
  loading.value = true
  try {
    const listingId = parseInt(route.params.id)
    if (isNaN(listingId)) {
      ElMessage.error('无效的房源ID')
      return
    }
    console.log('正在获取房源详情，ID:', listingId)
    const response = await api.post('/listings/get', {
      id: listingId
    })
    console.log('获取到的房源详情:', response)
    if (response && response.listing) {
      listing.value = response.listing
      // 获取房东信息
      await fetchLandlordInfo(listing.value.landlord_id)
    } else {
      ElMessage.error('获取房源详情失败：数据格式错误')
    }
  } catch (error) {
    console.error('获取房源详情失败:', error)
    ElMessage.error(error.response?.data?.error || '获取房源详情失败')
  } finally {
    loading.value = false
  }
}

// 获取房东信息
const fetchLandlordInfo = async (landlordId) => {
  try {
    const id = parseInt(landlordId)
    if (isNaN(id)) {
      ElMessage.error('无效的房东ID')
      return
    }
    console.log('正在获取房东信息，ID:', id)
    const response = await api.post('/user', {
      id: id
    })
    console.log('获取到的房东信息:', response)
    if (response) {
      landlord.value = response
    } else {
      ElMessage.error('获取房东信息失败：数据格式错误')
    }
  } catch (error) {
    console.error('获取房东信息失败:', error)
    ElMessage.error(error.response?.data?.error || '获取房东信息失败')
  }
}

// 禁用今天之前的日期
const disabledDate = (time) => {
  return time.getTime() < Date.now() - 8.64e7 // 禁用今天之前的日期
}

// 显示交易对话框
const showTransactionDialog = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  if (userStore.user.role !== 'tenant') {
    ElMessage.warning('只有租客才能创建交易')
    return
  }
  transactionDialogVisible.value = true
}

// 创建交易
const createTransaction = async () => {
  if (!transactionFormRef.value) return

  try {
    await transactionFormRef.value.validate()
    creating.value = true

    // 计算结束日期
    const startDate = new Date(transactionForm.value.start_date)
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + transactionForm.value.months)

    const transactionData = {
      listing_id: parseInt(listing.value.ID),
      landlord_id: parseInt(listing.value.landlord_id),
      tenant_id: parseInt(userStore.user.ID),
      amount: parseFloat(listing.value.price),
      status: 'pending',
      start_date: transactionForm.value.start_date,
      end_date: endDate.toISOString().split('T')[0]
    }

    console.log('创建交易数据:', transactionData)
    const response = await api.post('/transaction/create', transactionData)
    console.log('创建交易响应:', response)
    
    ElMessage.success('交易创建成功')
    transactionDialogVisible.value = false
    // 刷新房源详情
    await fetchListingDetail()
  } catch (error) {
    console.error('创建交易失败:', error)
    ElMessage.error(error.response?.data?.error || '创建交易失败')
  } finally {
    creating.value = false
  }
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
  console.log('组件挂载，路由参数:', route.params)
  fetchListingDetail()
})
</script>

<style scoped>
.listing-detail {
  padding: 24px;
}

.listing-container {
  max-width: 1000px;
  margin: 0 auto;
}

.listing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.listing-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.listing-content {
  display: grid;
  gap: 24px;
}

.listing-card,
.landlord-card,
.reviews-card {
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

.listing-info,
.landlord-info {
  display: grid;
  gap: 16px;
}

.info-item {
  display: flex;
  line-height: 32px;
}

.info-item .label {
  width: 100px;
  color: #606266;
  font-weight: 500;
}

.reviews-list {
  display: grid;
  gap: 16px;
}

.review-item {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.review-date {
  font-size: 14px;
  color: #909399;
}

.review-content {
  color: #606266;
  line-height: 1.6;
  margin: 0;
}

.action-card {
  display: flex;
  justify-content: center;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  margin-top: 24px;
}

.action-card .el-button {
  min-width: 120px;
}

:deep(.el-date-picker) {
  width: 100%;
}

:deep(.el-input-number) {
  width: 100%;
}
</style> 