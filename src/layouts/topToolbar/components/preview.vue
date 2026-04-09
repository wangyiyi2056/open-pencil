<script setup lang="ts">
import { useEventListener, useResizeObserver } from '@vueuse/core'
import { computed, nextTick, ref, watch } from 'vue'
import {
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger
} from 'reka-ui'
import ArrowLeft from '~icons/lucide/arrow-left'
import ArrowRight from '~icons/lucide/arrow-right'
import BookOpenText from '~icons/lucide/book-open-text'
import SlidersHorizontal from '~icons/lucide/sliders-horizontal'
import X from '~icons/lucide/x'

import { getActiveStore, useTabsStore } from '@/stores/tabs'

import type { Color } from '@open-pencil/core'

type ScaleMode = 'fit-width' | 'fit-height' | 'fit-screen' | 'none'

const visible = defineModel<boolean>({ default: false })

const { tabs, activeTabId } = useTabsStore()

const previewCurrentId = ref('')
const previewContainerRef = ref<HTMLElement | null>(null)
const scaleX = ref(1)
const scaleY = ref(1)
const scaleMode = ref<ScaleMode>('none')

const scaleModeItems = [
  { value: 'fit-width' as const, label: '适应宽度' },
  { value: 'fit-height' as const, label: '适应高度' },
  { value: 'fit-screen' as const, label: '铺满视口' },
  { value: 'none' as const, label: '原始尺寸' }
]

const currentTab = computed(() => tabs.value.find((tab) => tab.id === previewCurrentId.value))
const currentIndex = computed(() =>
  tabs.value.findIndex((tab) => tab.id === previewCurrentId.value)
)
const currentTabTitle = computed(() => currentTab.value?.name ?? '未命名标签')
const isPreviewingCurrent = computed(() => previewCurrentId.value === activeTabId.value)
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(
  () => currentIndex.value !== -1 && currentIndex.value < tabs.value.length - 1
)
const runtimeStore = computed(() => (isPreviewingCurrent.value ? getActiveStore() : null))

const previewPage = computed(() => {
  const store = runtimeStore.value
  const page = store?.graph.getNode(store.state.currentPageId)

  return {
    width: page && Number.isFinite(page.width) && page.width > 0 ? page.width : 1920,
    height: page && Number.isFinite(page.height) && page.height > 0 ? page.height : 1080,
    backgroundColor: colorToCss(store?.state.pageColor)
  }
})

const canvasWidth = computed(() => previewPage.value.width)
const canvasHeight = computed(() => previewPage.value.height)
const canvasBackground = computed(() => previewPage.value.backgroundColor)

watch(
  visible,
  (value) => {
    if (!value) return
    previewCurrentId.value = activeTabId.value
    void nextTick(calculateScale)
  },
  { immediate: true }
)

watch(activeTabId, (value) => {
  if (!visible.value) return
  if (!previewCurrentId.value) previewCurrentId.value = value
})

watch([previewCurrentId, canvasWidth, canvasHeight, scaleMode], () => {
  if (!visible.value) return
  void nextTick(calculateScale)
})

useResizeObserver(previewContainerRef, () => {
  if (!visible.value) return
  void nextTick(calculateScale)
})

useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  if (!visible.value) return

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      handlePrev()
      break
    case 'ArrowRight':
      event.preventDefault()
      handleNext()
      break
    case 'Escape':
      event.preventDefault()
      visible.value = false
      break
  }
})

function colorToCss(color?: Color) {
  if (!color) return '#ffffff'
  const r = Math.round(color.r * 255)
  const g = Math.round(color.g * 255)
  const b = Math.round(color.b * 255)
  const a = color.a ?? 1
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

function calculateScale() {
  if (!previewContainerRef.value) return

  const containerWidth = previewContainerRef.value.clientWidth
  const containerHeight = previewContainerRef.value.clientHeight
  const nextWidth = canvasWidth.value || 1
  const nextHeight = canvasHeight.value || 1

  switch (scaleMode.value) {
    case 'fit-width': {
      const ratio = containerWidth / nextWidth
      scaleX.value = ratio
      scaleY.value = ratio
      break
    }
    case 'fit-height': {
      const ratio = containerHeight / nextHeight
      scaleX.value = ratio
      scaleY.value = ratio
      break
    }
    case 'fit-screen':
      scaleX.value = containerWidth / nextWidth
      scaleY.value = containerHeight / nextHeight
      break
    case 'none':
    default:
      scaleX.value = 1
      scaleY.value = 1
      break
  }
}

function setScaleMode(mode: ScaleMode) {
  scaleMode.value = mode
}

function handlePrev() {
  if (!hasPrev.value) return
  previewCurrentId.value = tabs.value[currentIndex.value - 1]?.id ?? previewCurrentId.value
}

function handleNext() {
  if (!hasNext.value) return
  previewCurrentId.value = tabs.value[currentIndex.value + 1]?.id ?? previewCurrentId.value
}

function openNewWindowPreview() {
  window.open('/preview', '_blank')
  visible.value = false
}
</script>

<template>
  <DialogRoot v-model:open="visible">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-black/45" />
      <DialogContent
        class="fixed top-1/2 left-1/2 z-50 flex max-h-[90vh] w-[80vw] max-w-none -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-panel shadow-2xl focus:outline-none"
      >
        <div data-testid="preview-dialog" class="flex h-[80vh] flex-col overflow-hidden">
          <div class="flex min-h-10 items-center justify-between border-b border-border px-2 py-1">
            <div class="flex min-w-0 items-center">
              <button
                class="mx-0.5 inline-flex size-6 items-center justify-center rounded text-muted transition hover:bg-hover hover:text-surface"
                :class="
                  !hasPrev
                    ? 'cursor-not-allowed opacity-30 hover:bg-transparent hover:text-muted'
                    : ''
                "
                type="button"
                :disabled="!hasPrev"
                @click="handlePrev"
              >
                <ArrowLeft class="size-4" />
              </button>
              <button
                class="mx-0.5 inline-flex size-6 items-center justify-center rounded text-muted transition hover:bg-hover hover:text-surface"
                :class="
                  !hasNext
                    ? 'cursor-not-allowed opacity-30 hover:bg-transparent hover:text-muted'
                    : ''
                "
                type="button"
                :disabled="!hasNext"
                @click="handleNext"
              >
                <ArrowRight class="size-4" />
              </button>
            </div>

            <div class="min-w-0 flex-1 px-4 text-center text-sm font-semibold text-surface">
              <span class="mx-auto block max-w-[300px] truncate">
                {{ currentTabTitle }}
              </span>
            </div>

            <div class="flex min-w-0 items-center">
              <button
                class="mx-0.5 inline-flex size-6 items-center justify-center rounded text-muted transition hover:bg-hover hover:text-surface"
                type="button"
                @click="openNewWindowPreview"
              >
                <BookOpenText class="size-4" />
              </button>
              <DropdownMenuRoot>
                <DropdownMenuTrigger as-child>
                  <button
                    class="mx-0.5 inline-flex size-6 items-center justify-center rounded text-muted transition hover:bg-hover hover:text-surface"
                    type="button"
                  >
                    <SlidersHorizontal class="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuContent
                    align="end"
                    side="top"
                    :side-offset="8"
                    class="z-50 min-w-40 rounded-lg border border-border bg-panel p-1 shadow-xl"
                  >
                    <DropdownMenuItem
                      v-for="item in scaleModeItems"
                      :key="item.value"
                      class="flex cursor-pointer items-center rounded-md px-3 py-2 text-xs transition outline-none data-[highlighted]:bg-hover data-[highlighted]:text-surface"
                      :class="scaleMode === item.value ? 'bg-accent/10 text-surface' : 'text-muted'"
                      @select="setScaleMode(item.value)"
                    >
                      {{ item.label }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenuPortal>
              </DropdownMenuRoot>
              <button
                class="mx-0.5 inline-flex size-8 items-center justify-center rounded-md text-muted transition hover:bg-hover hover:text-surface"
                type="button"
                @click="visible = false"
              >
                <X class="size-4" />
              </button>
            </div>
          </div>

          <div
            ref="previewContainerRef"
            data-testid="preview-runtime-surface"
            class="flex min-h-0 flex-1 justify-center overflow-auto bg-hover text-center"
          >
            <div
              class="shrink-0"
              :style="{
                width: `${canvasWidth * scaleX}px`,
                height: `${canvasHeight * scaleY}px`
              }"
            >
              <div
                class="relative"
                :style="{
                  width: `${canvasWidth}px`,
                  height: `${canvasHeight}px`,
                  backgroundColor: canvasBackground,
                  transform: `scale(${scaleX}, ${scaleY})`,
                  transformOrigin: '0 0'
                }"
              >
                <div class="absolute inset-0 flex items-center justify-center text-xs text-muted">
                  预览画布占位
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
