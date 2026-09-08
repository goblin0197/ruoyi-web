/// <reference types="vite/client" />

// 兼容从 qsbg-ui 迁移的纯 JS 页面（不带 lang="ts" 的 .vue 单文件组件）
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>;
  export default component;
}
