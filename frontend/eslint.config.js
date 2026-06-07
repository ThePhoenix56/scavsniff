import { defineConfig } from 'eslint/config'
import lnuConfig from '@lnu/eslint-config'
import pluginVue from 'eslint-plugin-vue'

export default defineConfig([
  ...lnuConfig,
  ...pluginVue.configs['flat/recommended'],
])
