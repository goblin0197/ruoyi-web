<script setup>
import {
  ChatDotRound,
  CollectionTag,
  DataAnalysis,
  EditPen,
  Grid,
  MagicStick,
  Opportunity,
  Search,
  WarnTriangleFilled,
} from '@element-plus/icons-vue';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';

import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { matchAiCategory } from '@/api/ai-center/categoryApi.js';
import { detectAiProhibitedWords } from '@/api/ai-center/complianceApi.js';
import {
  generateAiMultilingualCopy,
  optimizeAiCopywriting,
} from '@/api/ai-center/copywritingApi.js';
import { scoreAiListing } from '@/api/ai-center/listingApi.js';
import { extractAiSellingPoints } from '@/api/ai-center/productApi.js';
import { analyzeAiSeo } from '@/api/ai-center/seoApi.js';
import { recommendAiVariants } from '@/api/ai-center/variantApi.js';

import AiFeatureDrawer from './components/AiFeatureDrawer.vue';
import ChatAssistant from './components/ChatAssistant.vue';
import SessionHistory from './components/SessionHistory.vue';

import {
  AI_FEATURE_CODES,
  AI_FEATURE_MAP,
  AI_FEATURES,
  createDefaultFeatureForm,
  normalizeFeatureForm,
  validateFeatureForm,
} from './constants/features.js';

import {
  getFeatureDraft,
  trackActivity,
} from './services/aiCenterStorage.js';

import {
  abortAssistantRequest,
  activities,
  currentSessionId,
  handleModelChange,
  loadModels,
  loadSessionList,
  loadSessionMessages,
  modelList,
  overview,
  refreshOverview,
  savedDraftCount,
  selectedModelId,
} from './store/aiStore.js';

const iconMap = {
  MagicStick,
  Search,
  Opportunity,
  WarnTriangleFilled,
  EditPen,
  CollectionTag,
  Grid,
  DataAnalysis,
  ChatDotRound,
};

const featureExecutors = {
  [AI_FEATURE_CODES.MULTILINGUAL]: generateAiMultilingualCopy,
  [AI_FEATURE_CODES.SEO]: analyzeAiSeo,
  [AI_FEATURE_CODES.SELLING_POINTS]: extractAiSellingPoints,
  [AI_FEATURE_CODES.PROHIBITED_WORDS]: detectAiProhibitedWords,
  [AI_FEATURE_CODES.COPY_OPTIMIZE]: optimizeAiCopywriting,
  [AI_FEATURE_CODES.CATEGORY_MATCH]: matchAiCategory,
  [AI_FEATURE_CODES.VARIANT_RECOMMEND]: recommendAiVariants,
  [AI_FEATURE_CODES.LISTING_SCORE]: scoreAiListing,
};

const features = AI_FEATURES;

const drawerVisible = ref(false);
const featureLoading = ref(false);
const currentFeatureCode = ref('');
const currentForm = ref({});
const currentResult = ref(null);
const currentErrors = ref({});

const activitiesRef = ref(null);
const assistantPanelRef = ref(null);
const usageChartRef = ref(null);
let usageChart = null;

const currentFeature = computed(() => AI_FEATURE_MAP[currentFeatureCode.value] || null);
const activeFeatureCount = computed(() => Object.values(overview.value.featureUsage || {}).filter(count => count > 0).length);
const statCards = computed(() => [
  { key: 'optimizedListings', label: '已优化 Listing', value: overview.value.stats.optimizedListings, note: '累计模拟', type: 'primary' },
  { key: 'generatedCopies', label: 'AI 生成文案', value: overview.value.stats.generatedCopies, note: '草稿产出', type: 'success' },
  { key: 'riskScans', label: '风险扫描次数', value: overview.value.stats.riskScans, note: '合规检测', type: 'warning' },
  { key: 'seoLift', label: 'SEO 得分提升', value: `${overview.value.stats.seoLift}%`, note: '趋势指标', type: 'info' },
]);
const usageChartData = computed(() => {
  return features
    .filter(feature => feature.code !== AI_FEATURE_CODES.ASSISTANT)
    .map(feature => ({
      name: feature.name.replace('智能', '').replace('生成', '').replace('质量', '').trim(),
      fullName: feature.name,
      value: getFeatureUsage(feature.code),
      color: feature.accent,
    }));
});

function renderUsageChart() {
  if (!usageChartRef.value) {
    return;
  }

  if (!usageChart) {
    usageChart = echarts.init(usageChartRef.value);
  }

  const chartData = usageChartData.value;
  const nameMap = {};
  chartData.forEach((item) => {
    nameMap[item.name] = item.fullName;
  });

  usageChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter(params) {
        const item = params[0];
        const fullName = nameMap[item.name] || item.name;
        return `${fullName}<br/>使用次数：${item.value}`;
      },
    },
    grid: {
      left: 48,
      right: 24,
      top: 28,
      bottom: 48,
    },
    xAxis: {
      type: 'category',
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#d1d5db' } },
      axisLabel: { color: '#6b7280', fontSize: 11 },
      data: usageChartData.value.map(item => item.name),
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280' },
    },
    series: [
      {
        type: 'bar',
        barWidth: 36,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color(params) {
            return usageChartData.value[params.dataIndex]?.color || '#2563eb';
          },
        },
        data: usageChartData.value.map(item => item.value),
      },
    ],
  });
}

function handleResize() {
  usageChart?.resize();
}

function getFeatureUsage(code) {
  return overview.value.featureUsage?.[code] || 0;
}

function resolveErrorMessage(error, fallback) {
  if (error?.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}

function handleFeatureAction(feature) {
  currentFeatureCode.value = feature.code;
  currentForm.value = getFeatureDraft(feature.code) || createDefaultFeatureForm(feature);
  currentResult.value = null;
  currentErrors.value = {};
  drawerVisible.value = true;
}

function closeFeatureDialog() {
  drawerVisible.value = false;
  currentResult.value = null;
  currentErrors.value = {};
}

function handleFormModelUpdate(newForm) {
  currentForm.value = newForm;
}

function submitCurrentFeature() {
  handleDrawerSubmit();
}

function resetCurrentFeature() {
  currentForm.value = createDefaultFeatureForm(currentFeature.value);
  currentErrors.value = {};
}

function copyCurrentResult() {
  if (!currentResult.value)
    return;
  const text = JSON.stringify(currentResult.value, null, 2);
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('结果已复制到剪贴板');
  }).catch(() => {
    ElMessage.error('复制失败');
  });
}

function handleDrawerSubmit() {
  const feature = currentFeature.value;
  if (!feature) {
    return;
  }

  const executor = featureExecutors[feature.code];
  if (!executor) {
    ElMessage.warning('该功能暂未实现');
    return;
  }

  const { isValid, errors, normalizedForm } = validateFeatureForm(feature, currentForm.value);
  currentForm.value = normalizedForm;
  currentErrors.value = errors;
  if (!isValid) {
    ElMessage.warning('请先完成必填项并修正表单错误');
    return;
  }

  const submittingFeature = currentFeature.value;
  const normalizedPayload = normalizeFeatureForm(submittingFeature, currentForm.value);

  // 违禁词检测：补充可读的 label 字段供后端拼入用户提示词
  if (submittingFeature.code === AI_FEATURE_CODES.PROHIBITED_WORDS) {
    const platformField = submittingFeature.formFields.find(f => f.key === 'targetPlatform');
    const typeField = submittingFeature.formFields.find(f => f.key === 'detectionType');
    if (platformField) {
      const opt = platformField.options.find(o => (o.value ?? o) === normalizedPayload.targetPlatform);
      normalizedPayload.targetPlatformLabel = opt?.label ?? normalizedPayload.targetPlatform;
    }
    if (typeField) {
      const opt = typeField.options.find(o => (o.value ?? o) === normalizedPayload.detectionType);
      normalizedPayload.detectionTypeLabel = opt?.label ?? normalizedPayload.detectionType;
    }
  }

  featureLoading.value = true;
  executor(normalizedPayload)
    .then((response) => {
      currentResult.value = response.data;
      const subject = normalizedPayload.title || normalizedPayload.productTitle || normalizedPayload.productName || '-';
      activities.value = trackActivity(submittingFeature.code, submittingFeature.name, {
        action: submittingFeature.action,
        subject,
        summary: `${submittingFeature.name} 完成`,
      });
      refreshOverview();
      currentErrors.value = {};
      ElMessage.success(`${submittingFeature.name} 已生成结果`);
    })
    .catch((error) => {
      ElMessage.error(resolveErrorMessage(error, `${submittingFeature.name} 生成失败，请稍后重试`));
    })
    .finally(() => {
      featureLoading.value = false;
    });
}

function scrollToActivities() {
  activitiesRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openAssistantCard() {
  nextTick(() => {
    assistantPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

onMounted(() => {
  refreshOverview();
  loadSessionList();
  loadModels();
  if (currentSessionId.value) {
    loadSessionMessages(currentSessionId.value);
  }
  window.addEventListener('resize', handleResize);
  nextTick(() => {
    renderUsageChart();
  });
});

watch(usageChartData, () => {
  nextTick(() => {
    renderUsageChart();
  });
}, { deep: true });

onBeforeUnmount(() => {
  abortAssistantRequest();
  window.removeEventListener('resize', handleResize);
  if (usageChart) {
    usageChart.dispose();
    usageChart = null;
  }
});
</script>

<template>
  <div class="ai-center-page">
    <section class="hero-section">
      <div class="hero-copy">
        <div class="hero-badge">
          AI 工具箱
        </div>
        <h1>AI 工具箱</h1>
        <p>围绕跨境电商 Listing、文案和选品辅助，提供统一的 AI 智能工作台。</p>
        <div class="hero-actions">
          <el-button type="primary" @click="openAssistantCard">
            立即咨询
          </el-button>
          <el-button @click="scrollToActivities">
            查看最近活动
          </el-button>
        </div>
      </div>
      <div class="hero-side">
        <div class="hero-stat">
          <span>当前模型</span>
          <el-select
            v-model="selectedModelId"
            placeholder="选择模型"
            size="small"
            style="width: 180px"
            @change="handleModelChange"
          >
            <el-option
              v-for="m in modelList"
              :key="m.id"
              :label="m.modelName"
              :value="String(m.id)"
            />
          </el-select>
        </div>
        <div class="hero-stat">
          <span>今日活跃功能</span>
          <strong>{{ activeFeatureCount }}</strong>
        </div>
        <div class="hero-stat">
          <span>已保存草稿</span>
          <strong>{{ savedDraftCount }}</strong>
        </div>
      </div>
    </section>

    <section class="stats-grid">
      <article
        v-for="card in statCards"
        :key="card.key"
        class="stat-card"
      >
        <div>
          <div class="stat-label">
            {{ card.label }}
          </div>
          <div class="stat-value">
            {{ card.value }}
          </div>
        </div>
        <el-tag effect="plain" :type="card.type">
          {{ card.note }}
        </el-tag>
      </article>
    </section>

    <section class="content-grid">
      <div class="features-column">
        <div class="section-header">
          <div>
            <h2>AI 核心功能</h2>
          </div>
        </div>

        <div class="feature-grid">
          <article
            v-for="feature in features"
            :key="feature.code"
            class="feature-card"
            :style="{ '--feature-accent': feature.accent }"
          >
            <div class="feature-top-line" />
            <div class="feature-card-header">
              <div class="feature-icon">
                <component :is="iconMap[feature.icon]" />
              </div>
              <div class="feature-meta">
                <h3>{{ feature.name }}</h3>
                <p>{{ feature.description }}</p>
              </div>
            </div>
            <div class="feature-tags">
              <el-tag
                v-for="tag in feature.tags"
                :key="tag"
                effect="plain"
                size="small"
              >
                {{ tag }}
              </el-tag>
            </div>
            <div class="feature-card-footer">
              <el-button
                type="primary"
                @click="feature.code === AI_FEATURE_CODES.ASSISTANT ? openAssistantCard() : handleFeatureAction(feature)"
              >
                {{ feature.buttonText }}
              </el-button>
            </div>
          </article>
        </div>
      </div>

      <aside ref="assistantPanelRef" class="assistant-column">
        <div class="assistant-panel">
          <SessionHistory />
          <ChatAssistant />
        </div>
      </aside>
    </section>

    <section ref="activitiesRef" class="activity-section">
      <div class="section-header">
        <div>
          <h2>最近 AI 活动</h2>
          <p>所有功能的最近结果和咨询记录都会沉淀到这里，并保存在本地。</p>
        </div>
      </div>
      <el-table :data="activities.slice(0, 6)" border>
        <el-table-column prop="featureName" label="功能" min-width="180" />
        <el-table-column prop="action" label="操作" min-width="160" />
        <el-table-column prop="subject" label="对象" min-width="180" />
        <el-table-column prop="timestamp" label="时间" width="150" />
        <el-table-column label="状态" width="110">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'warning' ? 'warning' : 'success'">
              {{ scope.row.status === 'warning' ? '警告' : '成功' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="summary" label="摘要" min-width="260" show-overflow-tooltip />
      </el-table>
    </section>

    <section class="usage-chart-section">
      <div class="section-header">
        <div>
          <h2>AI功能使用统计</h2>
        </div>
      </div>
      <div ref="usageChartRef" class="usage-chart" />
    </section>

    <AiFeatureDrawer
      :visible="drawerVisible"
      :feature="currentFeature"
      :form-model="currentForm"
      :result="currentResult"
      :loading="featureLoading"
      :errors="currentErrors"
      @close="closeFeatureDialog"
      @update:form-model="handleFormModelUpdate"
      @submit="submitCurrentFeature"
      @reset="resetCurrentFeature"
      @rerun="submitCurrentFeature"
      @copy-result="copyCurrentResult"
    />
  </div>
</template>

<style scoped>
.ai-center-page {
  padding: 24px;
  background: #f5f7fb;
  min-height: calc(100vh - 56px);
}

.hero-section {
  background: linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%);
  border-radius: 16px;
  padding: 28px 32px;
  color: #fff;
  display: flex;
  justify-content: flex-start;
  gap: 24px;
  margin-bottom: 24px;
}

.hero-side {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-left: auto;
  min-width: 200px;
}

.hero-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-stat span {
  font-size: 12px;
  opacity: 0.7;
}

.hero-stat strong {
  font-size: 20px;
}

.hero-badge {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 12px;
  margin-bottom: 16px;
}

.hero-copy h1 {
  margin: 0 0 12px;
  font-size: 32px;
}

.hero-copy p {
  margin: 0;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.85);
  max-width: 640px;
}

.hero-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.stat-label {
  color: #6b7280;
  font-size: 14px;
}

.stat-value {
  color: #111827;
  font-size: 28px;
  font-weight: 700;
  margin-top: 8px;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 2.1fr) minmax(360px, 0.9fr);
  gap: 20px;
  align-items: start;
}

.features-column,
.assistant-panel,
.activity-section {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
}

.features-column,
.activity-section {
  padding: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.section-header h2 {
  margin: 0 0 6px;
  font-size: 20px;
  color: #111827;
}

.section-header p {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.feature-card {
  position: relative;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
  padding: 24px;
  min-height: 236px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--feature-accent) 20%, #d7deea);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
}

.feature-top-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 5px;
  border-top-left-radius: 18px;
  border-top-right-radius: 18px;
  background: var(--feature-accent);
}

.feature-card-header {
  display: flex;
  gap: 16px;
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--feature-accent) 14%, white);
  color: var(--feature-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.feature-meta h3 {
  margin: 0 0 10px;
  font-size: 18px;
  color: #111827;
  line-height: 1.35;
}

.feature-meta p {
  margin: 0;
  font-size: 14px;
  line-height: 1.75;
  color: #6b7280;
}

.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}

.feature-card-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 22px;
}

.feature-card-footer :deep(.el-button) {
  min-width: 132px;
  height: 40px;
  border-radius: 10px;
}

.assistant-column {
  position: sticky;
  top: 18px;
}

.assistant-panel {
  padding: 20px;
}

.activity-section {
  margin-top: 24px;
}

.usage-chart-section {
  margin-top: 24px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  padding: 20px;
}

.usage-chart {
  height: 320px;
  width: 100%;
}

@media (max-width: 1440px) {
  .feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: minmax(0, 1.8fr) minmax(320px, 0.9fr);
  }
}

@media (max-width: 1080px) {
  .stats-grid,
  .content-grid,
  .feature-grid {
    grid-template-columns: 1fr;
  }

  .hero-section {
    flex-direction: column;
  }

  .assistant-column {
    position: static;
  }
}
</style>
