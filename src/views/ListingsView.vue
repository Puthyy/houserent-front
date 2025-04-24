<template>
  <div class="listings-page">
    <div class="page-header">
      <h1 class="page-title">房源市场</h1>
      <div class="page-description">浏览最新房源信息，找到您理想的住所</div>
    </div>

    <div class="search-section">
      <div class="search-box">
        <el-input
          v-model="searchQuery"
          placeholder="搜索房源名称"
          class="search-input"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      
      <div class="price-filter">
        <el-input
          v-model="minPrice"
          placeholder="最低价"
          class="price-input"
          @input="handlePriceFilter"
        />
        <span class="price-separator">-</span>
        <el-input
          v-model="maxPrice"
          placeholder="最高价"
          class="price-input"
          @input="handlePriceFilter"
        />
      </div>
      
      <div class="filter-box">
        <el-radio-group v-model="statusFilter" @change="handleFilter">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="available">待出租</el-radio-button>
          <el-radio-button label="rented">已出租</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="listings-grid" v-loading="loading">
      <div 
        v-for="listing in filteredListings" 
        :key="listing.ID" 
        class="listing-card"
        @click="goToDetail(listing.ID)"
      >
        <div class="card-image">
          <el-image 
            :src="getFirstImage(listing.images)" 
            fit="cover"
            :preview-src-list="getImageList(listing.images)"
          >
            <template #error>
              <div class="image-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <div class="card-status" :class="listing.status">
            {{ listing.status === 'rented' ? '已出租' : '待出租' }}
          </div>
        </div>

        <div class="card-content">
          <h3 class="card-title">{{ listing.housename }}</h3>
          
          <div class="card-info">
            <div class="info-item">
              <el-icon><Location /></el-icon>
              <span>{{ listing.location }}</span>
            </div>
            <div class="info-item price">
              <el-icon><Money /></el-icon>
              <span>¥{{ listing.price }}/月</span>
            </div>
          </div>

          <p class="card-description">{{ listing.description }}</p>

          <div class="card-reviews" v-if="listing.reviews && listing.reviews.length > 0">
            <el-rate
              v-model="listing.reviews[0].rating"
              disabled
              show-score
              text-color="#ff9900"
            />
            <p class="review-text">{{ listing.reviews[0].comment }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredListings.length === 0" class="no-results">
      <el-empty description="暂无符合条件的房源" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Picture, Location, Money, Search } from '@element-plus/icons-vue'
import api from '@/utils/auth'

const router = useRouter()
const listings = ref([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('all')
const minPrice = ref('')
const maxPrice = ref('')

// 过滤后的房源列表
const filteredListings = computed(() => {
  return listings.value.filter(listing => {
    // 状态筛选
    if (statusFilter.value !== 'all' && listing.status !== statusFilter.value) {
      return false
    }
    
    // 名称搜索
    if (searchQuery.value) {
      return listing.housename.toLowerCase().includes(searchQuery.value.toLowerCase())
    }
    
    // 价格筛选
    if (minPrice.value && listing.price < parseFloat(minPrice.value)) {
      return false
    }
    if (maxPrice.value && listing.price > parseFloat(maxPrice.value)) {
      return false
    }
    
    return true
  })
})

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已通过计算属性实现
}

// 处理筛选
const handleFilter = () => {
  // 筛选逻辑已通过计算属性实现
}

// 处理价格筛选
const handlePriceFilter = () => {
  // 价格筛选逻辑已通过计算属性实现
}

// 跳转到详情页
const goToDetail = (id) => {
  router.push(`/listings/${id}`)
}

const fetchListings = async () => {
  loading.value = true
  try {
    const response = await api.post('/listings/list', {})
    listings.value = response.data
  } catch (error) {
    ElMessage.error('获取房源信息失败')
  } finally {
    loading.value = false
  }
}

const getFirstImage = (images) => {
  if (!images) return ''
  const imageList = images.split(',')
  const firstImage = imageList[0] || ''
  // 如果 URL 已经是完整的，直接返回
  if (firstImage.startsWith('http')) return firstImage
  // 否则添加后端 API 地址
  return `http://localhost:8080${firstImage}`
}

const getImageList = (images) => {
  if (!images) return []
  return images.split(',').map(url => {
    // 如果 URL 已经是完整的，直接返回
    if (url.startsWith('http')) return url
    // 否则添加后端 API 地址
    return `http://localhost:8080${url}`
  })
}

onMounted(() => {
  fetchListings()
})
</script>

<style scoped>
.listings-page {
  padding: 0 24px;
}

.page-header {
  margin-bottom: 40px;
  text-align: center;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px;
}

.page-description {
  font-size: 16px;
  color: #606266;
}

.search-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  gap: 16px;
}

.search-box {
  flex: 0 0 200px;
}

.price-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-input {
  width: 120px;
}

.price-separator {
  color: #909399;
}

.filter-box {
  flex-shrink: 0;
}

:deep(.el-radio-button__inner) {
  padding: 8px 20px;
  font-size: 14px;
}

:deep(.el-input__wrapper) {
  padding: 0 12px;
}

:deep(.el-input__prefix) {
  font-size: 16px;
  color: #909399;
}

.listings-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin: 0 auto;
}

.listing-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.listing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.card-image {
  position: relative;
  height: 240px;
}

.card-image .el-image {
  width: 100%;
  height: 100%;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 40px;
}

.card-status {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.card-status.rented {
  background-color: #67c23a;
  color: #fff;
}

.card-status.available {
  background-color: #e6a23c;
  color: #fff;
}

.card-content {
  padding: 20px;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px;
  line-height: 1.4;
}

.card-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 15px;
}

.info-item.price {
  color: #f56c6c;
  font-weight: 500;
}

.card-description {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 44px;
}

.card-reviews {
  border-top: 1px solid #ebeef5;
  padding-top: 16px;
}

.review-text {
  margin: 12px 0 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.no-results {
  margin-top: 40px;
  text-align: center;
}

:deep(.el-rate) {
  --el-rate-font-size: 14px;
}

:deep(.el-rate__icon) {
  font-size: 16px;
}
</style> 