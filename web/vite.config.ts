import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// GitHub Pages 部署在子路径（https://<user>.github.io/<repo>/）时，
// 在 CI 里设置 HLL_BASE_URL=/<repo>/；本地开发默认 '/'。
const base = process.env.HLL_BASE_URL || '/'

export default defineConfig({
  // 可配置 base：本地默认 '/'，GitHub Pages 构建时通过 HLL_BASE_URL 环境变量注入
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ['monaco-editor'],
          echarts: ['echarts'],
          mermaid: ['mermaid'],
          xyflow: ['@xyflow/react'],
        },
      },
    },
  },
})
