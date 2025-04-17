<template>
  <div class="listing-detail">
    <div class="listing-container">
      <div class="listing-header">
        <div class="header-left">
          <el-button 
            type="primary" 
            size="small"
            @click="goBack"
            class="back-button"
          >
            返回
          </el-button>
          <h1>{{ listing.housename }}</h1>
        </div>
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
              <el-tag :type="listing.status === 'available' ? 'success' : 'info'">
                {{ listing.status === 'available' ? '可租' : '已租' }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">创建时间：</span>
              <span>{{ formatDate(listing.CreatedAt) }}</span>
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
              <span>其他信息</span>
            </div>
          </template>

          <div class="landlord-info">
            <div class="info-item">
              <span class="label">房东ID：</span>
              <span>{{ listing.landlord_id }}</span>
            </div>
            <div class="info-item">
              <span class="label">房东名字：</span>
              <span>{{ landlord.username }}</span>
            </div>
            <div class="info-item">
              <span class="label">邮箱：</span>
              <span>{{ landlord.email }}</span>
            </div>
            <div class="info-item" v-if="listing.status !== 'available'">
              <span class="label">租客ID：</span>
              <span>{{ listing.tenant_id }}</span>
            </div>
            <div class="info-item" v-if="transaction">
              <span class="label">交易ID：</span>
              <span>{{ transaction.ID }}</span>
            </div>
            <div class="info-item" v-if="transaction">
              <span class="label">起租日期：</span>
              <span>{{ transaction.start_date }}</span>
            </div>
            <div class="info-item" v-if="transaction">
              <span class="label">到期日期：</span>
              <span>{{ transaction.end_date }}</span>
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
              <el-button 
                v-if="canWriteReview"
                type="primary" 
                size="small"
                @click="showReviewDialog"
              >
                写评价
              </el-button>
            </div>
          </template>

          <div class="reviews-list">
            <div v-for="review in listing.reviews" :key="review.ID" class="review-item">
              <div class="review-header">
                <el-rate v-model="review.rating" disabled show-score />
                <div class="review-actions">
                  <span class="review-date">{{ formatDate(review.CreatedAt) }}</span>
                  <el-button 
                    v-if="canEditReview(review)"
                    type="default" 
                    size="small"
                    @click="editReview(review)"
                  >
                    修改
                  </el-button>
                </div>
              </div>
              <p class="review-content">{{ review.comment }}</p>
            </div>
          </div>
        </el-card>

        <!-- 添加评价按钮（当没有评价时显示） -->
        <el-card v-else-if="canWriteReview" class="reviews-card">
          <div class="empty-reviews">
            <p>暂无评价</p>
            <el-button type="primary" @click="showReviewDialog">写评价</el-button>
          </div>
        </el-card>

        <div class="action-card" v-if="listing.status === 'available' && userStore.user && userStore.user.role === 'tenant'">
          <el-button type="primary" size="large" @click="showTransactionDialog">立即租用</el-button>
        </div>
      </div>
    </div>

    <!-- 评价对话框 -->
    <el-dialog
      v-model="reviewDialogVisible"
      title="写评价"
      width="500px"
    >
      <el-form
        ref="reviewFormRef"
        :model="reviewForm"
        :rules="reviewRules"
        label-width="80px"
      >
        <el-form-item label="评分" prop="rating">
          <el-rate v-model="reviewForm.rating" show-score />
        </el-form-item>
        <el-form-item label="评价" prop="comment">
          <el-input
            v-model="reviewForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入您的评价"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reviewDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitReview" :loading="submitting">
            提交
          </el-button>
        </span>
      </template>
    </el-dialog>

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
import { ref, onMounted, computed } from 'vue'
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
const transaction = ref(null)
const transactionDialogVisible = ref(false)
const transactionFormRef = ref(null)
const reviewDialogVisible = ref(false)
const reviewFormRef = ref(null)
const submitting = ref(false)

const transactionForm = ref({
  start_date: '',
  months: 1
})

const reviewForm = ref({
  id: null,
  rating: 5,
  comment: ''
})

const transactionRules = {
  start_date: [
    { required: true, message: '请选择起租日期', trigger: 'change' }
  ],
  months: [
    { required: true, message: '请选择租期', trigger: 'change' }
  ]
}

const reviewRules = {
  rating: [
    { required: true, message: '请选择评分', trigger: 'change' }
  ],
  comment: [
    { required: true, message: '请输入评价内容', trigger: 'blur' },
    { min: 5, max: 200, message: '评价内容长度在 5 到 200 个字符之间', trigger: 'blur' }
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
      // 如果房源已租用，获取交易信息
      if (listing.value.status !== 'available') {
        await fetchTransactionInfo(listingId)
      }
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

// 获取交易信息
const fetchTransactionInfo = async (listingId) => {
  try {
    const response = await api.post('/transaction/get', {
      id: listingId
    })
    if (response && response.transaction) {
      transaction.value = response.transaction
    } else {
      ElMessage.error('获取交易信息失败：数据格式错误')
    }
  } catch (error) {
    console.error('获取交易信息失败:', error)
    ElMessage.error(error.response?.data?.error || '获取交易信息失败')
  }
}

// 禁用今天之前的日期
const disabledDate = (time) => {
  return time.getTime() < Date.now() - 8.64e7 // 禁用今天之前的日期
}

// 判断是否可以写评价
const canWriteReview = computed(() => {
  // 检查是否已经评价过
  const hasReviewed = listing.value.reviews?.some(
    review => review.tenant_id === userStore.user?.ID
  )
  
  return listing.value.status !== 'available' && 
         userStore.user && 
         userStore.user.role === 'tenant' &&
         listing.value.tenant_id === userStore.user.ID &&
         !hasReviewed
})

// 判断是否可以编辑评价
const canEditReview = (review) => {
  return userStore.user && 
         userStore.user.role === 'tenant' && 
         review.tenant_id === userStore.user.ID
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
    
    if (response && response.transaction) {
      // 更新房源状态，保持原有信息不变
      const updateListingData = {
        id: listing.value.ID,
        housename: listing.value.housename,
        description: listing.value.description,
        price: listing.value.price,
        location: listing.value.location,
        images: listing.value.images,
        landlord_id: listing.value.landlord_id,
        status: 'rented',
        tenant_id: userStore.user.ID,
        chain_tx: listing.value.chain_tx
      }
      await api.post('/listings/update', updateListingData)
      
      ElMessage.success('交易创建成功')
      transactionDialogVisible.value = false
      // 刷新房源详情
      await fetchListingDetail()
    } else {
      ElMessage.error('创建交易失败：数据格式错误')
    }
  } catch (error) {
    console.error('创建交易失败:', error)
    ElMessage.error(error.response?.data?.error || '创建交易失败')
  } finally {
    creating.value = false
  }
}

// 显示评价对话框
const showReviewDialog = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  reviewDialogVisible.value = true
}

// 编辑评价
const editReview = (review) => {
  reviewForm.value = {
    id: review.ID,
    rating: review.rating,
    comment: review.comment
  }
  reviewDialogVisible.value = true
}

// 提交评价
const submitReview = async () => {
  if (!reviewFormRef.value) return

  try {
    await reviewFormRef.value.validate()
    submitting.value = true

    let response
    if (reviewForm.value.id) {
      // 更新评价
      const updateData = {
        id: reviewForm.value.id,
        tenant_id: parseInt(userStore.user.ID),
        rating: reviewForm.value.rating,
        comment: reviewForm.value.comment
      }
      response = await api.post('/reviews/update', updateData)
    } else {
      // 创建新评价
      const createData = {
        listing_id: parseInt(listing.value.ID),
        tenant_id: parseInt(userStore.user.ID),
        rating: reviewForm.value.rating,
        comment: reviewForm.value.comment
      }
      response = await api.post('/reviews/create', createData)
    }
    
    if (response && response.review) {
      ElMessage.success(reviewForm.value.id ? '评价修改成功' : '评价提交成功')
      reviewDialogVisible.value = false
      // 重置表单
      reviewForm.value = {
        id: null,
        rating: 5,
        comment: ''
      }
      // 刷新房源详情
      await fetchListingDetail()
    } else {
      ElMessage.error('操作失败：数据格式错误')
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error(error.response?.data?.error || '操作失败')
  } finally {
    submitting.value = false
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

// 返回上一页
const goBack = () => {
  router.back()
}

onMounted(() => {
  console.log('组件挂载，路由参数:', route.params)
  fetchListingDetail()
})
</script>

<style scoped>
.listing-detail {
  padding: 16px;
}

.listing-container {
  max-width: 900px;
  margin: 0 auto;
}

.listing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-button {
  margin-right: 12px;
}

.listing-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.listing-content {
  display: grid;
  gap: 16px;
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
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.card-header span {
  font-size: 16px;
  font-weight: 500;
}

.listing-info,
.landlord-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px;
}

.info-item {
  display: flex;
  line-height: 28px;
  min-width: 0; /* 防止内容溢出 */
}

.info-item .label {
  width: 80px;
  color: #606266;
  font-weight: 500;
  flex-shrink: 0; /* 防止标签缩小 */
}

.info-item span:not(.label) {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reviews-list {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.review-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.review-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.review-actions .el-button {
  padding: 4px 12px;
  border-radius: 4px;
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
}

.review-actions .el-button:hover {
  background-color: #e4e7ed;
  border-color: #c6c8cc;
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
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  margin-top: 16px;
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

:deep(.el-card__body) {
  padding: 0;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

.empty-reviews {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
  text-align: center;
}

.empty-reviews p {
  color: #909399;
  margin: 0;
}
</style> 