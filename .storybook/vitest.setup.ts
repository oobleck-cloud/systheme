import { setProjectAnnotations } from '@storybook/react'
import { beforeAll } from 'vitest'

import * as projectAnnotations from './preview'

/**
 * @storybook/experimental-addon-test — story 실행 전 preview.ts의
 * parameters, decorators 등 global annotations를 적용.
 */
const annotations = setProjectAnnotations([projectAnnotations])

beforeAll(annotations.beforeAll)
