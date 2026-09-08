import path from 'node:path';
import process from 'node:process';
import { defineConfig, loadEnv } from 'vite';
import plugins from './.build/plugins';

// https://vite.dev/config/
export default defineConfig((cnf) => {
  const { mode } = cnf;
  const env = loadEnv(mode, process.cwd());
  const { VITE_APP_ENV } = env;
  return {
    base: VITE_APP_ENV === 'production' ? '/' : '/',
    plugins: plugins(cnf),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    css: {
      // css全局变量使用，@/styles/variable.scss文件
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/styles/var.scss" as *;',
        },
      },
    },
    // 浏览器缓存问题
    server: {
      // 监听所有网卡，允许局域网通过本机 IP 访问（如 http://192.168.1.100:5173）
      host: true,
      proxy: {
        // 后端 API 统一走 dev server 转发，浏览器只请求同源地址，
        // 局域网跨设备访问不再直连后端 IP（127.0.0.1 在客户端指向客户端自己）
        '/dev-api': {
          target: 'http://127.0.0.1:6039',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/dev-api/, ''),
        },
      },
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  };
});
