<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  feature: {
    type: Object,
    default: null,
  },
  formModel: {
    type: Object,
    default: () => ({}),
  },
  result: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  errors: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['close', 'update:form-model', 'submit', 'reset', 'rerun', 'copyResult']);

const resultExpanded = ref(true);

watch(() => props.result, (newVal) => {
  if (newVal)
    resultExpanded.value = true;
});

const GENERATION_TYPE_SECTION_MAP = {
  标题: ['summary', 'titles', 'localizedNotes'],
  五点描述: ['summary', 'bullets', 'localizedNotes'],
  长文案: ['summary', 'longDescription', 'localizedNotes'],
  卖点文案: ['summary', 'sellingPoints', 'localizedNotes'],
};

const visibleSections = computed(() => {
  if (!props.feature?.resultSections)
    return [];
  const genType = props.formModel?.generationType;
  if (!genType || genType === '全部')
    return props.feature.resultSections;
  const allowedKeys = GENERATION_TYPE_SECTION_MAP[genType];
  if (!allowedKeys)
    return props.feature.resultSections;
  return props.feature.resultSections.filter(s => allowedKeys.includes(s.key));
});

const totalScorePercent = computed(() => {
  if (!props.result?.totalScore)
    return 0;
  return extractNumericScore(props.result.totalScore.score ?? props.result.totalScore);
});

function updateField(key, value) {
  emit('update:form-model', {
    ...props.formModel,
    [key]: value,
  });
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (!value) {
    return [];
  }
  return [value];
}

function normalizeKeyValueList(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => {
    if (typeof item === 'string') {
      return { label: item, value: '' };
    }
    return {
      label: item.label || item.name || item.key || '-',
      value: item.value || item.reason || item.replacement || '',
    };
  });
}

function normalizeScore(value) {
  if (!value) {
    return { score: '-', grade: '', description: '暂无结果' };
  }
  if (typeof value === 'string') {
    return { score: value, grade: '', description: '' };
  }
  return {
    score: value.score ?? value.totalScore ?? '-',
    grade: value.grade || '',
    description: value.description || '',
  };
}

function extractNumericScore(raw) {
  if (raw == null)
    return 0;
  const str = String(raw);
  const slashMatch = str.match(/(\d+)\s*\//);
  if (slashMatch)
    return Number.parseInt(slashMatch[1], 10);
  const unitMatch = str.match(/(\d+)\s*分/);
  if (unitMatch)
    return Number.parseInt(unitMatch[1], 10);
  const numMatch = str.match(/(\d+)/);
  return numMatch ? Number.parseInt(numMatch[1], 10) : 0;
}

function extractScoreBeforeUnit(val) {
  if (val == null)
    return 0;
  const str = String(val);
  const m = str.match(/(\d+)\s*分/);
  if (m)
    return Number.parseInt(m[1], 10);
  const n = str.match(/(\d+)/);
  return n ? Number.parseInt(n[1], 10) : 0;
}

function extractDescAfterUnit(val) {
  if (val == null)
    return '';
  const str = String(val);
  const m = str.match(/分\s*[-—]\s*(.+)/);
  return m ? m[1].trim() : '';
}

function scoreBarColor(score) {
  if (score >= 90)
    return '#22c55e';
  if (score >= 80)
    return '#14b8a6';
  if (score >= 70)
    return '#eab308';
  if (score >= 60)
    return '#f97316';
  return '#ef4444';
}

function normalizeHitList(value) {
  if (!Array.isArray(value))
    return [];
  return value.map(item => ({
    term: item.term || '',
    reason: item.reason || '',
    severity: item.severity || 'info',
    type: item.type || '',
    replacement: item.replacement || '',
  }));
}

function normalizeCategoryList(value) {
  if (!Array.isArray(value))
    return [];
  return value.map(item => ({
    categoryPath: item.categoryPath || item.category_path || '',
    matchScore: item.matchScore || item.match_score || 0,
    status: item.status || 'alternative',
  }));
}

function matchScoreColor(score) {
  if (score >= 90)
    return '#16a34a';
  if (score >= 70)
    return '#ca8a04';
  return '#ea580c';
}

function normalizeKeywordList(value) {
  if (!Array.isArray(value))
    return [];
  return value.map(item => ({
    keyword: item.keyword || '',
    trafficLevel: item.trafficLevel || '',
    competitionLevel: item.competitionLevel || '',
    reason: item.reason || '',
  }));
}

function trafficTagType(level) {
  const map = { 高: 'danger', 中: 'warning', 低: 'info' };
  return map[level] || 'info';
}

function competitionTagType(level) {
  const map = { 高: 'danger', 中: 'warning', 低: 'success' };
  return map[level] || 'info';
}

function severityTagType(severity) {
  const map = { critical: 'danger', warning: 'warning', info: 'info' };
  return map[severity] || 'info';
}

function hitTypeLabel(type) {
  const map = {
    forbidden_words: '违禁词',
    sensitive_words: '敏感词',
    infringement_words: '侵权词',
    false_advertising: '虚假宣传',
  };
  return map[type] || type;
}

function resolveFieldClass(field) {
  if (field.type === 'textarea' || field.type === 'checkboxGroup') {
    return 'is-full-width';
  }
  return '';
}

function getSectionText(section) {
  const val = props.result?.[section.key];
  if (val == null)
    return '';
  if (section.type === 'text' || section.type === 'default' || !section.type) {
    return String(val);
  }
  if (section.type === 'list' || section.type === 'badgeList') {
    return normalizeList(val).join('\n');
  }
  if (section.type === 'kvList' || section.type === 'dimensionScores') {
    return normalizeKeyValueList(val).map(i => `${i.label}：${i.value}`).join('\n');
  }
  if (section.type === 'score' || section.type === 'scoreBar') {
    const s = normalizeScore(val);
    return [s.score, s.grade, s.description].filter(Boolean).join(' | ');
  }
  if (Array.isArray(val)) {
    return val.map(i => (typeof i === 'string' ? i : JSON.stringify(i))).join('\n');
  }
  return String(val);
}

async function copySectionContent(section) {
  const text = getSectionText(section);
  if (!text)
    return;
  try {
    await navigator.clipboard.writeText(text);
  }
  catch {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    destroy-on-close
    width="780px"
    align-center
    append-to-body
    class="ai-feature-dialog"
    @close="$emit('close')"
  >
    <template #header>
      <div class="drawer-header">
        <div>
          <div class="drawer-title">
            {{ feature?.name }}
          </div>
          <div class="drawer-subtitle">
            {{ feature?.description }}
          </div>
        </div>
        <el-tag :style="{ borderColor: feature?.accent, color: feature?.accent }" effect="plain">
          {{ feature?.action }}
        </el-tag>
      </div>
    </template>

    <div v-if="feature" class="drawer-body">
      <div class="drawer-content" :class="[{ 'has-result': Boolean(result) }]">
        <section class="form-panel">
          <el-form label-position="top" class="feature-form">
            <el-form-item
              v-for="field in feature.formFields"
              :key="field.key"
              :label="field.label"
              :required="field.required"
              :error="errors[field.key] || ''"
              :class="resolveFieldClass(field)"
            >
              <el-select
                v-if="field.type === 'select'"
                :model-value="formModel[field.key]"
                :placeholder="field.placeholder || `请选择${field.label}`"
                :clearable="Boolean(field.clearable)"
                :multiple="Boolean(field.multiple)"
                :filterable="Boolean(field.filterable || field.allowCustom)"
                :allow-create="Boolean(field.allowCustom)"
                :default-first-option="Boolean(field.allowCustom)"
                :reserve-keyword="false"
                style="width: 100%;"
                @update:model-value="updateField(field.key, $event)"
              >
                <el-option
                  v-for="option in field.options"
                  :key="option.value ?? option"
                  :label="option.label ?? option"
                  :value="option.value ?? option"
                />
              </el-select>

              <el-checkbox-group
                v-else-if="field.type === 'checkboxGroup'"
                :model-value="formModel[field.key]"
                class="checkbox-group"
                @update:model-value="updateField(field.key, $event)"
              >
                <el-checkbox
                  v-for="option in field.options"
                  :key="option"
                  :label="option"
                  :value="option"
                >
                  {{ option }}
                </el-checkbox>
              </el-checkbox-group>

              <div v-else-if="field.type === 'switch'" class="switch-row">
                <el-switch
                  :model-value="Boolean(formModel[field.key])"
                  @update:model-value="updateField(field.key, $event)"
                />
                <span class="switch-text">{{ Boolean(formModel[field.key]) ? '开启' : '关闭' }}</span>
              </div>

              <el-input
                v-else-if="field.type === 'textarea'"
                :model-value="formModel[field.key]"
                type="textarea"
                :autosize="{ minRows: 2, maxRows: field.rows || 4 }"
                :maxlength="field.maxLength || undefined"
                :show-word-limit="Boolean(field.maxLength)"
                :placeholder="field.placeholder"
                @update:model-value="updateField(field.key, $event)"
              />

              <el-input
                v-else
                :model-value="formModel[field.key]"
                :maxlength="field.maxLength || undefined"
                :show-word-limit="Boolean(field.maxLength)"
                :placeholder="field.placeholder"
                @update:model-value="updateField(field.key, $event)"
              />

              <div v-if="field.helpText" class="field-help">
                <span v-if="field.helpText">{{ field.helpText }}</span>
              </div>
            </el-form-item>
          </el-form>

          <div class="drawer-actions">
            <el-button @click="$emit('reset')">
              重置
            </el-button>
            <el-button type="primary" :loading="loading" @click="$emit('submit')">
              {{ feature.action }}
            </el-button>
          </div>
        </section>

        <div v-if="feature?.resultSections" class="result-toggle" @click="resultExpanded = !resultExpanded">
          <span class="result-toggle-label">生成结果</span>
          <span class="result-toggle-arrow" :class="[{ expanded: resultExpanded }]">▾</span>
        </div>

        <section v-show="resultExpanded" class="result-panel">
          <template v-if="result">
            <div class="result-toolbar">
              <span class="result-title">最新结果</span>
              <div class="toolbar-actions">
                <el-button text @click="$emit('rerun')">
                  重新生成
                </el-button>
                <el-button text @click="$emit('copyResult')">
                  复制结果
                </el-button>
              </div>
            </div>
            <el-alert
              type="info"
              :closable="false"
              show-icon
              class="ai-disclaimer"
            >
              以下内容由AI大模型生成，建议您根据当地法律法规和平台规则进行二次审核
            </el-alert>

            <div
              v-for="section in visibleSections"
              :key="section.key"
              class="result-card"
            >
              <div class="result-card-header">
                <div class="result-card-title">
                  {{ section.label }}
                </div>
                <el-button text size="small" class="card-copy-btn" @click="copySectionContent(section)">
                  复制
                </el-button>
              </div>

              <template v-if="section.type === 'list'">
                <ul v-if="normalizeList(result[section.key]).length" class="result-list">
                  <li v-for="item in normalizeList(result[section.key])" :key="item">
                    {{ item }}
                  </li>
                </ul>
                <div v-else class="result-text">
                  {{ section.emptyText || '暂无结果' }}
                </div>
              </template>

              <template v-else-if="section.type === 'kvList'">
                <div v-if="normalizeKeyValueList(result[section.key]).length" class="result-kv-list">
                  <div
                    v-for="(item, idx) in normalizeKeyValueList(result[section.key])"
                    :key="idx"
                    class="result-kv-item"
                  >
                    <span class="kv-label">{{ item.label }}</span>
                    <span class="kv-value">{{ item.value }}</span>
                  </div>
                </div>
                <div v-else class="result-text">
                  暂无结果
                </div>
              </template>

              <template v-else-if="section.type === 'dimensionScores'">
                <div v-if="normalizeKeyValueList(result[section.key]).length" class="dimension-scores-list">
                  <div
                    v-for="item in normalizeKeyValueList(result[section.key])"
                    :key="item.label"
                    class="dimension-score-item"
                  >
                    <div class="dimension-score-header">
                      <span class="dimension-score-label">{{ item.label }}</span>
                      <span class="dimension-score-number">{{ extractScoreBeforeUnit(item.value) }}</span>
                    </div>
                    <div class="dimension-score-bar-track">
                      <div
                        class="dimension-score-bar-fill"
                        :style="{ width: `${extractScoreBeforeUnit(item.value)}%`, background: scoreBarColor(extractScoreBeforeUnit(item.value)) }"
                      />
                    </div>
                    <div class="dimension-score-desc">
                      {{ extractDescAfterUnit(item.value) }}
                    </div>
                  </div>
                </div>
                <div v-else class="result-text">
                  暂无结果
                </div>
              </template>

              <template v-else-if="section.type === 'keywordList'">
                <div v-if="normalizeKeywordList(result[section.key]).length" class="keyword-list">
                  <div
                    v-for="(item, idx) in normalizeKeywordList(result[section.key])"
                    :key="`${item.keyword}-${idx}`"
                    class="keyword-item"
                  >
                    <div class="keyword-header">
                      <span class="keyword-text">{{ item.keyword }}</span>
                      <div class="keyword-tags">
                        <el-tag v-if="item.trafficLevel" size="small" :type="trafficTagType(item.trafficLevel)">
                          {{ item.trafficLevel }}流量
                        </el-tag>
                        <el-tag v-if="item.competitionLevel" size="small" :type="competitionTagType(item.competitionLevel)">
                          {{ item.competitionLevel }}竞争
                        </el-tag>
                      </div>
                    </div>
                    <div v-if="item.reason" class="keyword-reason">
                      {{ item.reason }}
                    </div>
                  </div>
                </div>
                <div v-else class="result-text">
                  暂无推荐
                </div>
              </template>

              <template v-else-if="section.type === 'report'">
                <div v-if="result[section.key]" class="report-grid">
                  <div class="report-item">
                    <span class="report-label">关键词总数</span>
                    <span class="report-value">{{ result[section.key].totalKeywords || '-' }}</span>
                  </div>
                  <div class="report-item">
                    <span class="report-label">关键词密度</span>
                    <span class="report-value">{{ result[section.key].density || '-' }}</span>
                  </div>
                  <div class="report-item">
                    <span class="report-label">可读性</span>
                    <span class="report-value">{{ result[section.key].readability || '-' }}</span>
                  </div>
                  <div class="report-item">
                    <span class="report-label">合规性</span>
                    <span class="report-value">{{ result[section.key].compliance || '-' }}</span>
                  </div>
                </div>
                <div v-else class="result-text">
                  暂无报告
                </div>
              </template>

              <template v-else-if="section.type === 'hitList'">
                <div v-if="normalizeHitList(result[section.key]).length" class="result-hit-list">
                  <div
                    v-for="item in normalizeHitList(result[section.key])"
                    :key="item.term"
                    class="result-hit-item"
                    :class="`severity-${item.severity}`"
                  >
                    <div class="hit-header">
                      <el-tag :type="severityTagType(item.severity)" size="small" effect="dark">
                        {{ item.term }}
                      </el-tag>
                      <span class="hit-type">{{ hitTypeLabel(item.type) }}</span>
                    </div>
                    <div class="hit-reason">
                      {{ item.reason }}
                    </div>
                    <div v-if="item.replacement" class="hit-replacement">
                      建议替换：{{ item.replacement }}
                    </div>
                  </div>
                </div>
                <div v-else class="result-text">
                  {{ section.emptyText || '暂无命中' }}
                </div>
              </template>

              <template v-else-if="section.type === 'score'">
                <div class="score-card">
                  <div class="score-number">
                    {{ normalizeScore(result[section.key]).score }}
                  </div>
                  <div class="score-meta">
                    <div class="score-grade">
                      {{ normalizeScore(result[section.key]).grade }}
                    </div>
                    <div class="score-description">
                      {{ normalizeScore(result[section.key]).description }}
                    </div>
                  </div>
                </div>
              </template>

              <template v-else-if="section.type === 'scoreBar'">
                <div class="score-bar-card">
                  <div class="score-bar-top">
                    <span class="score-bar-number">{{ normalizeScore(result[section.key]).score }}</span>
                    <span class="score-bar-grade">{{ normalizeScore(result[section.key]).grade }}</span>
                  </div>
                  <div class="score-bar-track">
                    <div
                      class="score-bar-fill"
                      :style="{ width: `${totalScorePercent}%`, background: scoreBarColor(totalScorePercent) }"
                    />
                  </div>
                  <div class="score-bar-desc">
                    {{ normalizeScore(result[section.key]).description }}
                  </div>
                </div>
              </template>

              <template v-else-if="section.type === 'categoryList'">
                <div v-if="normalizeCategoryList(result[section.key]).length" class="category-list">
                  <div
                    v-for="(item, idx) in normalizeCategoryList(result[section.key])"
                    :key="idx"
                    class="category-item"
                  >
                    <div class="category-header">
                      <span class="category-path">{{ item.categoryPath }}</span>
                      <span
                        class="category-score"
                        :style="{ color: matchScoreColor(item.matchScore) }"
                      >{{ item.matchScore }}%</span>
                    </div>
                    <div class="category-bar-track">
                      <div
                        class="category-bar-fill"
                        :style="{ width: `${item.matchScore}%`, background: matchScoreColor(item.matchScore) }"
                      />
                    </div>
                    <el-tag
                      :type="item.status === 'recommended' ? 'success' : 'warning'"
                      size="small"
                      effect="plain"
                    >
                      {{ item.status === 'recommended' ? '推荐首选' : '备选' }}
                    </el-tag>
                  </div>
                </div>
                <div v-else class="result-text">
                  暂无匹配类目
                </div>
              </template>

              <template v-else-if="section.type === 'badgeList'">
                <div class="badge-list">
                  <el-tag
                    v-for="item in normalizeList(result[section.key])"
                    :key="item"
                    effect="plain"
                    class="badge-item"
                  >
                    {{ item }}
                  </el-tag>
                </div>
              </template>

              <template v-else>
                <div class="result-text">
                  {{ result[section.key] || '暂无结果' }}
                </div>
              </template>
            </div>
          </template>
          <div v-else class="result-empty">
            点击上方「{{ feature?.action }}」按钮生成结果
          </div>
        </section>
      </div>
    </div>
  </el-dialog>
</template>

<style>
/* dialog 使用 append-to-body 移至 body 下，scoped 样式无法穿透，必须全局 */
.ai-feature-dialog {
  max-width: calc(100vw - 120px);
}

.ai-feature-dialog .el-dialog {
  margin: 40px auto !important;
  border-radius: 16px;
}

.ai-feature-dialog .el-dialog__header {
  padding: 36px 52px 0;
}

.ai-feature-dialog .el-dialog__body {
  padding: 32px 52px 44px;
  max-height: calc(94vh - 88px);
  overflow-y: auto;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.drawer-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.drawer-subtitle {
  margin-top: 8px;
  color: #6b7280;
  font-size: 14px;
}

.drawer-body {
  padding: 6px 6px 10px;
}

.drawer-content {
  display: block;
  padding: 0 6px;
}

.drawer-content.has-result {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-panel {
  min-width: 0;
}

.feature-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 24px;
  padding-right: 0;
}

.feature-form .el-form-item {
  margin-bottom: 16px;
}

.feature-form .el-form-item.is-full-width {
  grid-column: 1 / -1;
}

.checkbox-group {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 14px;
}

.switch-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.switch-text {
  color: #4b5563;
  font-size: 14px;
}

.field-help {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
}

.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}

.result-panel {
  min-width: 0;
}

.result-empty {
  padding: 32px 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}

.result-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  margin: 8px 0 4px;
  border-radius: 8px;
  background: #f1f5f9;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.result-toggle:hover {
  background: #e2e8f0;
}

.result-toggle-label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.result-toggle-arrow {
  font-size: 12px;
  color: #94a3b8;
  transition: transform 0.2s ease;
  transform: rotate(-90deg);
}

.result-toggle-arrow.expanded {
  transform: rotate(0deg);
}

.result-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.ai-disclaimer {
  margin-bottom: 16px;
}

.ai-disclaimer .el-alert__content,
.ai-disclaimer .el-alert__description,
.ai-disclaimer .el-alert__icon,
.ai-disclaimer .el-alert__icon svg {
  color: #f56c6c !important;
  fill: #f56c6c !important;
}

.result-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.toolbar-actions {
  display: flex;
  gap: 4px;
}

.result-card {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 20px 22px;
  margin-bottom: 16px;
  overflow: hidden;
  position: relative;
}

.result-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.result-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.card-copy-btn {
  padding: 2px 6px !important;
  font-size: 12px !important;
  color: #9ca3af !important;
  min-height: auto !important;
}

.card-copy-btn:hover {
  color: #4b5563 !important;
}

.result-text {
  line-height: 1.7;
  color: #374151;
  white-space: pre-wrap;
}

.result-list {
  margin: 0;
  padding-left: 18px;
  color: #374151;
  line-height: 1.7;
}

.result-kv-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-kv-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kv-label {
  font-weight: 600;
  color: #111827;
}

.kv-value {
  color: #4b5563;
  line-height: 1.6;
}

.result-hit-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-hit-item {
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 4px solid #d1d5db;
  background: #f9fafb;
}

.result-hit-item.severity-critical {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.result-hit-item.severity-warning {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.result-hit-item.severity-info {
  border-left-color: #3b82f6;
  background: #eff6ff;
}

.hit-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.hit-type {
  font-size: 12px;
  color: #6b7280;
}

.hit-reason {
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
}

.hit-replacement {
  margin-top: 4px;
  font-size: 13px;
  color: #059669;
  line-height: 1.5;
}

.score-card {
  display: flex;
  align-items: center;
  gap: 18px;
}

.score-number {
  font-size: 34px;
  line-height: 1;
  font-weight: 700;
  color: #0f766e;
}

.score-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.score-grade {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.score-description {
  color: #4b5563;
  line-height: 1.6;
}

/* scoreBar: 总分进度条 */
.score-bar-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.score-bar-top {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.score-bar-number {
  font-size: 28px;
  font-weight: 700;
  color: #0f766e;
}

.score-bar-grade {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.score-bar-track {
  height: 10px;
  background: #e5e7eb;
  border-radius: 5px;
  overflow: hidden;
}

.score-bar-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.6s ease;
}

.score-bar-desc {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
}

/* dimensionScores: 维度评分进度条 */
.dimension-scores-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dimension-score-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dimension-score-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.dimension-score-label {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
}

.dimension-score-number {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.dimension-score-bar-track {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.dimension-score-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
}

.dimension-score-desc {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.category-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-path {
  font-weight: 500;
  color: #1e293b;
}

.category-score {
  font-weight: 700;
  font-size: 16px;
}

.category-bar-track {
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
}

.category-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}

.badge-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.badge-item {
  margin: 0;
  max-width: 100%;
  white-space: normal;
  word-break: break-word;
}

.keyword-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.keyword-item {
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.keyword-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.keyword-text {
  font-weight: 600;
  color: #111827;
}

.keyword-tags {
  display: flex;
  gap: 6px;
}

.keyword-reason {
  margin-top: 8px;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.report-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.report-label {
  font-size: 12px;
  color: #6b7280;
}

.report-value {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

@media (max-width: 768px) {
  .ai-feature-dialog {
    max-width: calc(100vw - 40px);
  }

  .ai-feature-dialog .el-dialog {
    margin: 16px auto !important;
    border-radius: 14px;
  }

  .ai-feature-dialog .el-dialog__header {
    padding: 26px 28px 0;
  }

  .ai-feature-dialog .el-dialog__body {
    padding: 24px 28px 30px;
    max-height: calc(92vh - 88px);
    overflow-y: auto;
  }

  .feature-form {
    grid-template-columns: 1fr;
  }

  .checkbox-group {
    grid-template-columns: 1fr;
  }

  .result-panel {
    max-height: none;
    overflow: visible;
  }

  .score-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
