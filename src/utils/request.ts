import type { HookFetchPlugin } from 'hook-fetch';
import { ElMessage } from 'element-plus';
import hookFetch from 'hook-fetch';
import { sseTextDecoderPlugin } from 'hook-fetch/plugins';
import router from '@/routers';
import { useUserStore } from '@/stores';

interface BaseResponse {
  code: number;
  data: never;
  msg: string;
  rows: never;
}

export const request = hookFetch.create<BaseResponse, 'data' | 'rows'>({
  // 走相对路径由 dev server（vite proxy）/ 生产 nginx 转发到后端，
  // 避免浏览器直连后端 IP：局域网跨设备访问、代理/TUN 模式下都会出问题。
  // dev 为 /dev-api，生产为 /prod-api（见 .env.*）
  baseURL: import.meta.env.VITE_WEB_BASE_API,
  headers: {
    'Content-Type': 'application/json',
  },
  plugins: [sseTextDecoderPlugin({ json: true, prefix: 'data:' })],
});

function jwtPlugin(): HookFetchPlugin<BaseResponse> {
  const userStore = useUserStore();
  return {
    name: 'jwt',
    beforeRequest: async (config) => {
      config.headers = new Headers(config.headers);
      config.headers.set('authorization', `Bearer ${userStore.token}`);
      config.headers.set('ClientID', import.meta.env.VITE_CLIENT_ID);
      // AI 能力中心（/ai/center/**）免登录，后端通过 X-USERINFO 识别用户（ERP 网关注入）。
      // ruoyi-web 已登录，此处直接注入当前登录用户，格式与后端 RequestUserId 解析器约定一致。
      const url = String(config.url ?? '');
      if (url.includes('/ai/center')) {
        const userId = userStore.userInfo?.userId;
        if (userId != null) {
          config.headers.set(
            'X-USERINFO',
            encodeURIComponent(JSON.stringify({ id: userId })),
          );
        }
      }
      return config;
    },
    afterResponse: async (response) => {
      // console.log(response);
      if (response.result?.code === 200) {
        return response;
      }
      // 处理403逻辑
      if (response.result?.code === 403) {
        // 跳转到403页面（确保路由已配置）
        router.replace({
          name: '403',
        });
        ElMessage.error(response.result?.msg);
        return Promise.reject(response);
      }
      // 处理401逻辑
      if (response.result?.code === 401) {
        // 如果没有权限，退出，且弹框提示登录
        userStore.handleAuthExpired(
          router.currentRoute.value.fullPath,
          '登录状态已失效，请重新登录',
        );
        return Promise.reject(response);
      }
      ElMessage.error(response.result?.msg);
      return Promise.reject(response);
    },
  };
}

request.use(jwtPlugin());

export const post = request.post;

export const get = request.get;

export const put = request.put;

export const del = request.delete;

export default request;
