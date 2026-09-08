import {
  CONTENT_TYPE_OPTIONS,
  COPY_STYLE_OPTIONS,
  DEFAULT_TARGET_LANGUAGE,
  MARKET_OPTIONS,
  SUPPORTED_LANGUAGE_OPTIONS,
  SUPPORTED_SITE_OPTIONS,
  TARGET_REGION_OPTIONS,
} from './options.js';

export {
  CONTENT_TYPE_OPTIONS,
  COPY_STYLE_OPTIONS,
  DEFAULT_TARGET_LANGUAGE,
  MARKET_OPTIONS,
  SUPPORTED_LANGUAGE_OPTIONS,
  SUPPORTED_SITE_OPTIONS,
  TARGET_REGION_OPTIONS,
};

export const AI_FEATURE_CODES = {
  MULTILINGUAL: 'multilingual',
  SEO: 'seo',
  SELLING_POINTS: 'sellingPoints',
  PROHIBITED_WORDS: 'prohibitedWords',
  COPY_OPTIMIZE: 'copyOptimize',
  CATEGORY_MATCH: 'categoryMatch',
  VARIANT_RECOMMEND: 'variantRecommend',
  LISTING_SCORE: 'listingScore',
  ASSISTANT: 'assistant',
};

const AUDIENCE_OPTIONS = [
  '所有人群',
  '商务人士',
  '学生',
  '健身爱好者',
  '旅行者',
  '宝妈',
  '户外爱好者',
  '游戏玩家',
  '老年人',
];

const SCENARIO_OPTIONS = [
  '日常使用',
  '通勤',
  '运动健身',
  '旅行出差',
  '居家办公',
  '节日送礼',
  '户外探险',
  '游戏娱乐',
];

const MULTILINGUAL_STYLE_OPTIONS = [
  { label: '专业正式', value: 'professionalFormal' },
  { label: '友好亲切', value: 'friendlyWarm' },
  { label: '随性休闲', value: 'livelyEngaging' },
  { label: '技术专业', value: 'techFocused' },
  { label: '营销导向', value: 'marketingDriven' },
  { label: '儿童友好', value: 'kidFriendly' },
  { label: '高端奢华', value: 'luxuryPremium' },
  { label: '简约实用', value: 'conciseClear' },
];

const OPTIMIZATION_TYPE_OPTIONS = [
  '语法优化',
  '拼写纠错',
  '本地化适配',
  '文化合规检查',
  '平台规范适配',
  '语气统一',
];

const DETECTION_TYPE_OPTIONS = [
  { label: '全部类型', value: 'all' },
  { label: '违禁词', value: 'forbidden_words' },
  { label: '敏感词', value: 'sensitive_words' },
  { label: '侵权词', value: 'infringement_words' },
  { label: '虚假宣传', value: 'false_advertising' },
];

function safeClone(value) {
  if (Array.isArray(value)) {
    return [...value];
  }
  if (value && typeof value === 'object') {
    return { ...value };
  }
  return value;
}

function createTextField(key, label, placeholder, extra = {}) {
  return {
    key,
    label,
    type: 'input',
    placeholder,
    ...extra,
  };
}

function createTextareaField(key, label, placeholder, extra = {}) {
  return {
    key,
    label,
    type: 'textarea',
    rows: 4,
    placeholder,
    ...extra,
  };
}

function createSelectField(key, label, options, extra = {}) {
  return {
    key,
    label,
    type: 'select',
    options,
    ...extra,
  };
}

export const AI_FEATURES = [
  {
    code: AI_FEATURE_CODES.MULTILINGUAL,
    name: '多语种文案生成',
    icon: 'MagicStick',
    tone: 'blue',
    accent: '#2563eb',
    buttonText: '立即使用',
    tags: ['标题生成', '五点描述', '长文案', '卖点文案'],
    description: '根据平台规范生成多语种 Listing 文案草稿。',
    action: '生成文案',
    formFields: [
      createTextField('productName', '产品名称', '例如：便携式榨汁杯', {
        required: true,
        maxLength: 100,
        helpText: '',
        validationMessage: '请输入产品名称。',
      }),
      createTextareaField('productDescription', '产品描述', '输入核心功能、技术参数、材质、适用场景、目标人群、独特卖点、包装内容等信息', {
        required: true,
        maxLength: 2000,
        rows: 5,
        // helpText: '产品描述建议包含：核心功能、技术参数、材质、适用场景、目标人群、独特卖点、包装内容等信息',
        validationMessage: '请输入产品描述。',
      }),
      createSelectField('targetLanguage', '目标语言', SUPPORTED_LANGUAGE_OPTIONS, {
        required: true,
        allowCustom: true,
        filterable: true,
        optionSource: '统一字段.md',
        defaultValue: DEFAULT_TARGET_LANGUAGE,
        validationMessage: '请选择目标语言。',
      }),
      createSelectField('generationType', '生成类型', ['标题', '五点描述', '长文案', '卖点文案', '全部'], {
        required: true,
        defaultValue: '全部',
        validationMessage: '请选择生成类型。',
      }),
      createSelectField('targetSite', '目标站点', SUPPORTED_SITE_OPTIONS, {
        required: true,
        optionSource: '统一字段.md',
        defaultValue: 'Amazon',
        validationMessage: '请选择目标站点。',
      }),
      createSelectField('styleRequirements', '风格要求', MULTILINGUAL_STYLE_OPTIONS, {
        clearable: true,
        helpText: '可选，不选则使用默认风格。',
      }),
    ],
    resultSections: [
      { key: 'summary', label: '生成摘要', type: 'text' },
      { key: 'titles', label: '标题建议', type: 'list' },
      { key: 'bullets', label: '五点描述', type: 'list' },
      { key: 'longDescription', label: '长文案', type: 'text' },
      { key: 'sellingPoints', label: '卖点文案', type: 'list' },
      { key: 'localizedNotes', label: '本地化建议', type: 'list' },
    ],
  },
  {
    code: AI_FEATURE_CODES.SEO,
    name: 'SEO 智能埋词',
    icon: 'Search',
    tone: 'green',
    accent: '#16a34a',
    buttonText: '立即使用',
    tags: ['关键词匹配', '智能埋词', '排名分析', '竞争分析'],
    description: '围绕目标关键词完成埋词建议和文案重写。',
    action: '分析 SEO',
    formFields: [
      createTextField('productName', '产品名称', '例如：宠物饮水机'),
      createSelectField('marketplace', '目标站点', SUPPORTED_SITE_OPTIONS, {
        optionSource: '统一字段.md',
        defaultValue: 'Amazon',
      }),
      createSelectField('targetLanguage', '目标语言', SUPPORTED_LANGUAGE_OPTIONS, {
        allowCustom: true,
        filterable: true,
        defaultValue: DEFAULT_TARGET_LANGUAGE,
      }),
      createSelectField('contentType', '文案类型', CONTENT_TYPE_OPTIONS, {
        defaultValue: '标题',
        required: true,
      }),
      createTextareaField('seedKeywords', '核心关键词', '每行一个关键词，或用逗号分隔'),
      createTextareaField('baseCopy', '当前文案', '输入当前标题或描述'),
    ],
    resultSections: [
      { key: 'summary', label: '分析摘要', type: 'text' },
      { key: 'highTrafficKeywords', label: '高流量关键词', type: 'keywordList' },
      { key: 'lowCompetitionKeywords', label: '低竞争关键词', type: 'keywordList' },
      { key: 'highConversionKeywords', label: '高转化长尾词', type: 'keywordList' },
      { key: 'keywords', label: '推荐关键词', type: 'kvList' },
      { key: 'embeddedCopy', label: '埋词结果', type: 'text' },
      { key: 'report', label: 'SEO 数据报告', type: 'report' },
      { key: 'riskNotes', label: '风险提示', type: 'list' },
      { key: 'competitorSignals', label: '竞争观察', type: 'list' },
    ],
  },
  {
    code: AI_FEATURE_CODES.SELLING_POINTS,
    name: '产品卖点提炼',
    icon: 'Opportunity',
    tone: 'purple',
    accent: '#7c3aed',
    buttonText: '立即使用',
    tags: ['核心卖点', '差异化优势', '场景营销', '转化优化'],
    description: '按文档结构提炼卖点、受众和场景话术。',
    action: '提炼卖点',
    formFields: [
      createTextField('productName', '产品名称', '例如：露营充电风扇', {
        required: true,
        maxLength: 200,
        validationMessage: '请输入产品名称。',
      }),
      createTextareaField('productDescription', '产品描述', '输入产品详细介绍、材质、工艺、包装等', {
        maxLength: 5000,
        rows: 5,
        helpText: '与“产品特点”至少填写一项。',
      }),
      createTextareaField('productFeatures', '产品特点', '输入逗号分隔的核心参数、功能点', {
        maxLength: 3000,
        rows: 4,
        normalizeComma: true,
        helpText: '与“产品描述”至少填写一项。',
      }),
      createSelectField('targetAudience', '目标受众', AUDIENCE_OPTIONS, {
        required: true,
        allowCustom: true,
        filterable: true,
        maxLength: 100,
        defaultValue: '所有人群',
        validationMessage: '请选择或输入目标受众。',
      }),
      createSelectField('marketingScenario', '营销场景', SCENARIO_OPTIONS, {
        required: true,
        allowCustom: true,
        filterable: true,
        maxLength: 100,
        defaultValue: '日常使用',
        validationMessage: '请选择或输入营销场景。',
      }),
      createSelectField('targetLanguage', '目标语言', SUPPORTED_LANGUAGE_OPTIONS, {
        required: true,
        allowCustom: true,
        filterable: true,
        optionSource: '统一字段.md',
        defaultValue: DEFAULT_TARGET_LANGUAGE,
        validationMessage: '请选择目标语言。',
      }),
      createSelectField('targetPlatform', '目标平台', SUPPORTED_SITE_OPTIONS, {
        required: true,
        optionSource: '统一字段.md',
        defaultValue: 'Amazon',
        validationMessage: '请选择目标平台。',
      }),
    ],
    resultSections: [
      { key: 'summary', label: '提炼摘要', type: 'text' },
      { key: 'coreSellingPoints', label: '核心卖点', type: 'list' },
      { key: 'differentiators', label: '差异化优势', type: 'list' },
      { key: 'scenarioScripts', label: '场景话术', type: 'list' },
      { key: 'conversionTips', label: '转化建议', type: 'list' },
      { key: 'complianceWarnings', label: '合规警告', type: 'list', emptyText: '暂无' },
    ],
  },
  {
    code: AI_FEATURE_CODES.PROHIBITED_WORDS,
    name: '违禁词检测',
    icon: 'WarnTriangleFilled',
    tone: 'red',
    accent: '#dc2626',
    buttonText: '立即检测',
    tags: ['违禁词检测', '敏感词过滤', '违规预警', '侵权检测'],
    description: '按目标平台和检测类型扫描风险表达。',
    action: '检测风险',
    formFields: [
      createTextareaField('detectionContent', '检测内容', '标题、五点或详情描述', {
        required: true,
        maxLength: 10000,
        rows: 5,
        validationMessage: '请输入待检测内容。',
      }),
      createSelectField('targetPlatform', '目标平台', [...SUPPORTED_SITE_OPTIONS, 'all'], {
        required: true,
        optionSource: '统一字段.md',
        defaultValue: 'Amazon',
        validationMessage: '请选择目标平台。',
      }),
      createSelectField('detectionType', '检测类型', DETECTION_TYPE_OPTIONS, {
        required: true,
        defaultValue: '全部类型',
        validationMessage: '请选择检测类型。',
      }),
      createSelectField('language', '语言', SUPPORTED_LANGUAGE_OPTIONS, {
        defaultValue: '',
        allowCustom: true,
        filterable: true,
        optionSource: '统一字段.md',
      }),
    ],
    resultSections: [
      { key: 'summary', label: '检测摘要', type: 'text' },
      { key: 'riskLevel', label: '风险等级', type: 'text' },
      { key: 'hits', label: '命中词', type: 'hitList', emptyText: '暂无命中' },
      { key: 'suggestions', label: '替换建议', type: 'list' },
      { key: 'correctedText', label: '纠正后文案', type: 'text' },
    ],
  },
  {
    code: AI_FEATURE_CODES.COPY_OPTIMIZE,
    name: '文案优化',
    icon: 'EditPen',
    tone: 'amber',
    accent: '#d97706',
    buttonText: '立即优化',
    tags: ['语法优化', '本地化适配', '风格统一', '平台规范'],
    description: '根据目标语言、地区与风格优化原始文案。',
    action: '优化文案',
    formFields: [
      createTextareaField('originalCopy', '原始文案', '输入需要优化的文案内容', {
        required: true,
        maxLength: 5000,
        rows: 6,
        validationMessage: '请输入原始文案。',
      }),
      createSelectField('targetLanguage', '目标语言', SUPPORTED_LANGUAGE_OPTIONS, {
        required: true,
        allowCustom: true,
        filterable: true,
        optionSource: '统一字段.md',
        defaultValue: DEFAULT_TARGET_LANGUAGE,
        validationMessage: '请选择目标语言。',
      }),
      createSelectField('targetRegion', '目标地区', TARGET_REGION_OPTIONS, {
        required: true,
        defaultValue: '美国',
        filterable: true,
        validationMessage: '请选择目标地区。',
      }),
      createSelectField('optimizationTypes', '优化类型', OPTIMIZATION_TYPE_OPTIONS, {
        required: true,
        multiple: true,
        defaultValue: ['语法优化', '拼写纠错'],
        validationMessage: '请至少选择一种优化类型。',
      }),
      createSelectField('copyStyle', '文案风格', COPY_STYLE_OPTIONS, {
        required: true,
        defaultValue: 'professionalFormal',
        validationMessage: '请选择文案风格。',
      }),
    ],
    resultSections: [
      { key: 'summary', label: '优化摘要', type: 'text' },
      { key: 'originalExcerpt', label: '优化前', type: 'text' },
      { key: 'optimizedCopy', label: '优化后', type: 'text' },
      { key: 'styleSuggestions', label: '风格建议', type: 'list' },
      { key: 'localizationTips', label: '本地化提示', type: 'list' },
    ],
  },
  {
    code: AI_FEATURE_CODES.CATEGORY_MATCH,
    name: '类目匹配',
    icon: 'CollectionTag',
    tone: 'indigo',
    accent: '#4f46e5',
    buttonText: '立即匹配',
    tags: ['类目匹配', '属性补全', '违规预防', '曝光优化'],
    description: '根据标题、关键词和属性推荐类目和属性补全项。',
    action: '匹配类目',
    formFields: [
      createTextField('title', '产品标题', '输入产品标题', {
        required: true,
        validationMessage: '请输入产品标题。',
      }),
      createSelectField('targetSite', '目标平台站点', SUPPORTED_SITE_OPTIONS, {
        defaultValue: 'Amazon',
        allowCustom: true,
        filterable: true,
      }),
      createTextareaField('keywords', '核心关键词', '输入关键词或补充搜索词'),
      createTextareaField('description', '产品描述', '输入产品的详细描述', { rows: 4 }),
    ],
    resultSections: [
      { key: 'summary', label: '匹配摘要', type: 'text' },
      { key: 'recommendedCategories', label: '推荐类目', type: 'categoryList' },
      { key: 'alternatives', label: '备选类目', type: 'list' },
      { key: 'riskNotes', label: '风险提示', type: 'list' },
    ],
  },
  {
    code: AI_FEATURE_CODES.VARIANT_RECOMMEND,
    name: '变体组合推荐',
    icon: 'Grid',
    tone: 'pink',
    accent: '#db2777',
    buttonText: '立即推荐',
    tags: ['变体推荐', '规格优化', '结构建议', '转化提升'],
    description: '按变体属性和平台语言推荐更合理的组合方式。',
    action: '推荐变体',
    formFields: [
      createTextField('baseProductName', '基础产品名称', '例如：Wireless Earbuds', {
        required: true,
        maxLength: 100,
        validationMessage: '请输入基础产品名称。',
      }),
      createTextField('variantAttribute1', '变体属性1', '例如：Black,White,Blue,Red', {
        required: true,
        maxLength: 500,
        normalizeComma: true,
        dedupeCommaValues: true,
        validationMessage: '请输入变体属性1。',
      }),
      createTextField('variantAttribute2', '变体属性2', '例如：Standard,Pro,Max', {
        required: true,
        maxLength: 500,
        normalizeComma: true,
        dedupeCommaValues: true,
        validationMessage: '请输入变体属性2。',
      }),
      createTextField('variantAttribute3', '变体属性3', '例如：16GB,32GB,64GB', {
        maxLength: 500,
        normalizeComma: true,
        dedupeCommaValues: true,
      }),
      createTextareaField('baseProductDescription', '基础产品描述', '输入基础产品描述', {
        required: true,
        maxLength: 2000,
        rows: 5,
        validationMessage: '请输入基础产品描述。',
      }),
      createSelectField('targetPlatform', '目标平台', SUPPORTED_SITE_OPTIONS, {
        required: true,
        defaultValue: 'Amazon',
        optionSource: '统一字段.md',
        validationMessage: '请选择目标平台。',
      }),
      createSelectField('targetLanguage', '目标语言', SUPPORTED_LANGUAGE_OPTIONS, {
        required: true,
        allowCustom: true,
        filterable: true,
        defaultValue: DEFAULT_TARGET_LANGUAGE,
        optionSource: '统一字段.md',
        validationMessage: '请选择目标语言。',
      }),
    ],
    resultSections: [
      { key: 'summary', label: '推荐摘要', type: 'text' },
      { key: 'dimensions', label: '推荐维度', type: 'list' },
      { key: 'recommendedCombos', label: '组合建议', type: 'kvList' },
      { key: 'coverageAdvice', label: '覆盖建议', type: 'list' },
      { key: 'riskNotes', label: '风险提示', type: 'list' },
    ],
  },
  {
    code: AI_FEATURE_CODES.LISTING_SCORE,
    name: 'Listing 质量评分',
    icon: 'DataAnalysis',
    tone: 'teal',
    accent: '#0f766e',
    buttonText: '立即评分',
    tags: ['质量评分', '优化建议', '整改方案', '质量追踪'],
    description: '按平台、类目和市场维度生成 Listing 质量评分。',
    action: '开始评分',
    formFields: [
      createTextField('title', '产品标题', '输入产品标题', {
        required: true,
        validationMessage: '请输入产品标题。',
      }),
      createTextareaField('bulletPoints', '五点描述', '每行一个卖点', {
        required: true,
        rows: 6,
        validationMessage: '请输入五点描述。',
      }),
      createTextareaField('description', '长描述', '输入产品详细描述', {
        rows: 5,
      }),
      createTextareaField('keywords', '关键词', '每行一个关键词，或用逗号分隔', {
        rows: 3,
      }),
      createSelectField('targetPlatform', '目标平台', SUPPORTED_SITE_OPTIONS, {
        required: true,
        defaultValue: 'Amazon',
        validationMessage: '请选择目标平台。',
      }),
      createTextField('productCategory', '产品类目', '例如：电子产品 > 音频设备 > 无线蓝牙耳机', {
        required: true,
        validationMessage: '请输入产品类目。',
      }),
      createSelectField('targetMarket', '目标市场', MARKET_OPTIONS, {
        defaultValue: '',
        allowCustom: true,
        filterable: true,
      }),
      createSelectField('language', '语言', SUPPORTED_LANGUAGE_OPTIONS, {
        defaultValue: '',
        allowCustom: true,
        filterable: true,
      }),
    ],
    resultSections: [
      { key: 'summary', label: '评分摘要', type: 'text' },
      { key: 'totalScore', label: '总分', type: 'scoreBar' },
      { key: 'dimensionScores', label: '维度评分', type: 'dimensionScores' },
      { key: 'priorityActions', label: '优先整改项', type: 'list' },
      { key: 'passItems', label: '已达标项', type: 'list' },
    ],
  },
  {
    code: AI_FEATURE_CODES.ASSISTANT,
    name: 'AI 智能助手',
    icon: 'ChatDotRound',
    tone: 'sky',
    accent: '#0ea5e9',
    buttonText: '立即咨询',
    tags: ['在线咨询', '专业建议', '操作指导', '7x24 小时'],
    description: '轻量问答助手，适合临时整理思路和生成提问模板。',
    action: '咨询助手',
  },
];

export const AI_FEATURE_MAP = AI_FEATURES.reduce((accumulator, feature) => {
  accumulator[feature.code] = feature;
  return accumulator;
}, {});

function getDefaultFieldValue(field) {
  if (field.defaultValue !== undefined) {
    return safeClone(field.defaultValue);
  }
  if (field.multiple || field.type === 'checkboxGroup') {
    return [];
  }
  if (field.type === 'switch') {
    return false;
  }
  return '';
}

export function createDefaultFeatureForm(feature) {
  if (!feature || !feature.formFields) {
    return {};
  }

  return feature.formFields.reduce((accumulator, field) => {
    accumulator[field.key] = getDefaultFieldValue(field);
    return accumulator;
  }, {});
}

function normalizeCommaSeparatedValues(value) {
  return String(value || '')
    .replace(/，/g, ',')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function sanitizeValue(field, value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === null || value === undefined) {
    return getDefaultFieldValue(field);
  }

  let nextValue = String(value).trim();
  if (field.normalizeComma) {
    nextValue = nextValue.replace(/，/g, ',');
  }
  if (field.dedupeCommaValues) {
    nextValue = [...new Set(normalizeCommaSeparatedValues(nextValue))].join(',');
  }
  return nextValue;
}

export function normalizeFeatureForm(feature, formModel = {}) {
  if (!feature || !feature.formFields) {
    return {};
  }

  return feature.formFields.reduce((accumulator, field) => {
    accumulator[field.key] = sanitizeValue(field, formModel[field.key]);
    return accumulator;
  }, {});
}

function isEmptyValue(value) {
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'boolean') {
    return false;
  }
  return !String(value || '').trim();
}

function hasHtmlLikeContent(value) {
  return /<[^>]+>/.test(String(value || ''));
}

function validateField(field, value, errors) {
  if (field.required && isEmptyValue(value)) {
    errors[field.key] = field.validationMessage || `请填写${field.label}`;
    return;
  }
  if (field.maxLength && typeof value === 'string' && value.length > field.maxLength) {
    errors[field.key] = `${field.label}不能超过 ${field.maxLength} 个字符`;
    return;
  }
  if (field.maxSelections && Array.isArray(value) && value.length > field.maxSelections) {
    errors[field.key] = `${field.label}最多选择 ${field.maxSelections} 项`;
    return;
  }
  if (field.allowCustom && typeof value === 'string' && field.maxLength && value.length > field.maxLength) {
    errors[field.key] = `${field.label}不能超过 ${field.maxLength} 个字符`;
  }
}

function validateSellingPoints(formModel, errors) {
  if (!formModel.productDescription && !formModel.productFeatures) {
    errors.productDescription = '产品描述与产品特点至少填写一项';
    errors.productFeatures = '产品描述与产品特点至少填写一项';
  }
}

function validateVariantField(fieldKey, fieldLabel, formModel, errors) {
  const value = formModel[fieldKey];
  if (!value) {
    return;
  }
  if (hasHtmlLikeContent(value)) {
    errors[fieldKey] = `${fieldLabel}不能包含 HTML 或脚本片段`;
  }
}

export function validateFeatureForm(feature, rawFormModel = {}) {
  const formModel = normalizeFeatureForm(feature, rawFormModel);
  const errors = {};

  (feature?.formFields || []).forEach((field) => {
    validateField(field, formModel[field.key], errors);
  });

  switch (feature?.code) {
    case AI_FEATURE_CODES.SELLING_POINTS:
      validateSellingPoints(formModel, errors);
      break;
    case AI_FEATURE_CODES.VARIANT_RECOMMEND:
      validateVariantField('baseProductName', '基础产品名称', formModel, errors);
      validateVariantField('variantAttribute1', '变体属性1', formModel, errors);
      validateVariantField('variantAttribute2', '变体属性2', formModel, errors);
      validateVariantField('variantAttribute3', '变体属性3', formModel, errors);
      break;
    default:
      break;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalizedForm: formModel,
  };
}

export const AI_ASSISTANT_PROMPTS = [
  '帮我整理一个 Amazon 标题优化思路',
  '帮我把当前文案拆成适合广告投放的关键词组',
];
