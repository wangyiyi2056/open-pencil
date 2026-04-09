<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle
} from 'reka-ui'

const open = defineModel<boolean>({ default: false })

const { title, widthClass, hideHeader } = defineProps<{
  title?: string
  widthClass?: string
  hideHeader?: boolean
}>()
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-black/45" />
      <DialogContent
        :class="[
          'fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[min(92vw,960px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-border bg-panel shadow-2xl focus:outline-none',
          widthClass
        ]"
      >
        <div
          v-if="!hideHeader"
          class="flex min-h-12 items-center justify-between border-b border-border px-4 py-3"
        >
          <DialogTitle class="text-sm font-semibold text-surface">
            {{ title }}
          </DialogTitle>
          <DialogClose
            class="inline-flex size-8 items-center justify-center rounded-md text-muted transition hover:bg-hover hover:text-surface"
          >
            <icon-lucide-x class="size-4" />
          </DialogClose>
        </div>
        <div
          :class="
            hideHeader ? 'max-h-[90vh] overflow-auto' : 'max-h-[calc(90vh-3rem)] overflow-auto'
          "
        >
          <slot />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
