import { useState } from 'react'

import { Modal } from './Modal'
import anatomy from './Modal.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Modal> = {
  title: 'Components/L2/Modal',
  component: Modal,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy)

export default meta

type Story = StoryObj<typeof Modal>

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <div>
        <Button type="button" onClick={() => setOpen(true)}>
          모달 열기
        </Button>
        <Modal
          open={open}
          onOpenChange={setOpen}
          title="제목"
          footer={
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button type="button" onClick={() => setOpen(false)}>
                확인
              </Button>
            </div>
          }
        >
          <p className="text-fg-muted">
            본문 영역입니다. 오버레이나 닫기 버튼, Escape 로 닫을 수 있습니다.
          </p>
        </Modal>
      </div>
    )
  },
}

/** 로딩 — 확인 버튼만 isLoading. 닫기 버튼·취소·Escape 는 여전히 동작해 사용자가 빠져나올 수 있다. */
export const Loading: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <div>
        <Button type="button" onClick={() => setOpen(true)}>
          모달 열기
        </Button>
        <Modal
          open={open}
          onOpenChange={setOpen}
          title="견적 발송"
          footer={
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button type="button" isLoading>
                발송 중
              </Button>
            </div>
          }
        >
          <p className="text-fg-muted">
            고객에게 견적서를 발송하고 있습니다. 잠시만 기다려 주세요.
          </p>
        </Modal>
      </div>
    )
  },
}

/** 오류 — 본문 최상단에 Alert(danger). 입력은 유지하고 확인 버튼이 "다시 시도" 가 된다. */
export const SubmitError: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <div>
        <Button type="button" onClick={() => setOpen(true)}>
          모달 열기
        </Button>
        <Modal
          open={open}
          onOpenChange={setOpen}
          title="견적 발송"
          footer={
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button type="button">다시 시도</Button>
            </div>
          }
        >
          <div className="flex flex-col gap-3">
            <Alert severity="danger" title="발송에 실패했습니다">
              카카오톡 채널이 응답하지 않습니다. 잠시 후 다시 시도해 주세요.
            </Alert>
            <p className="text-fg-muted">견적 Q-24817 · 고객 김민수 · 가정이사 (마포구 → 성동구)</p>
          </div>
        </Modal>
      </div>
    )
  },
}
