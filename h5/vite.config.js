import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

export default defineConfig({
  plugins: [uni()],
  base: './',
  css: {
    preprocessorOptions: {
      scss: {
        // Dart Sass 1.79+ 对 legacy JS API 的弃用提示，静默之（uni-app 编译器内部仍走旧版 API）
        silenceDeprecations: ['legacy-js-api'],
      },
    },
  },
  server: {
    port: 5174,
    open: false
  }
});