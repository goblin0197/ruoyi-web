<!-- 纵向布局作为基础布局 -->
<script setup lang="ts">
import { useSafeArea } from '@/hooks/useSafeArea';
import { useWindowWidthObserver } from '@/hooks/useWindowWidthObserver';
import Aside from '@/layouts/components/Aside/index.vue';
import Header from '@/layouts/components/Header/index.vue';
import Main from '@/layouts/components/Main/index.vue';
import { useDesignStore } from '@/stores';

const designStore = useDesignStore();

const isCollapse = computed(() => designStore.isCollapse);

/* 是否移入了安全区 */
useSafeArea({
  direction: 'left',
  size: 50,
  onChange(isInSafeArea) {
    // 设置悬停为 true
    designStore.isSafeAreaHover = isInSafeArea;
  },
  enabled: isCollapse, // 折叠才开启监听
});

/** 监听窗口大小变化，折叠侧边栏 */
useWindowWidthObserver();
</script>

<template>
  <el-container class="layout-container">
    <el-header class="layout-header">
      <Header />
    </el-header>
    <el-container class="layout-container-main">
      <Aside />
      <el-main class="layout-main">
        <!-- 路由页面 -->
        <Main />
      </el-main>
    </el-container>
  </el-container>
</template>

<style lang="scss" scoped>
.layout-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  .layout-header {
    padding: 0;
  }
  .layout-main {
    padding: 0;
    // flex item 的高度完全交给 flex 算法：只拿剩余空间，不被内容撑大。
    // 注意不能写 height:100%——flex 容器的高度是 auto，百分比相对它计算会失效、
    // 回退为按内容高度。溢出走 el-main 自带的 overflow:auto。
    // 聊天页内容正好填满可视区，无影响。
    flex: 1 1 0;
    min-height: 0;
  }
  .layout-container-main {
    margin-left: var(--sidebar-left-container-default-width, 0);
    transition: margin-left 0.3s ease;
    // column 方向 flex 容器的直接子项：默认 min-height:auto 会被长页面内容撑大，
    // 连带把 .layout-container 的 overflow:hidden 区域撑出视口导致无法滚动。
    // 收紧后高度恒为 100vh-header，溢出由内部 el-main 的 overflow:auto 接管。
    min-height: 0;
  }
}

/** 去除菜单右侧边框 */
.el-menu {
  border-right: none;
}
.layout-scrollbar {
  width: 100%;
}
</style>
