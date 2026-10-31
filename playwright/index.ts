import '../src/styles/index.css'

import { beforeMount } from '@playwright/experimental-ct-react/hooks'

beforeMount(async () => {
  // 필요 시 Provider 래핑 — 현재 디자인시스템 컴포넌트는 외부 Provider 의존이 없음.
})
