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

const { title, widthClass } = defineProps<{
  title: string
  widthClass?: string
}>()
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-black/35" />
      <DialogContent
        :class="[
          'fixed top-0 right-0 z-50 flex h-screen w-[min(92vw,340px)] flex-col border-l border-border bg-panel shadow-2xl focus:outline-none',
          widthClass
        ]"
      >
        <div class="flex min-h-12 items-center justify-between border-b border-border px-4 py-3">
          <DialogTitle class="text-sm font-semibold text-surface">
            {{ title }}
          </DialogTitle>
          <DialogClose
            class="inline-flex size-8 items-center justify-center rounded-md text-muted transition hover:bg-hover hover:text-surface"
          >
            <icon-lucide-x class="size-4" />
          </DialogClose>
        </div>
        <div class="min-h-0 flex-1 overflow-auto px-4 py-3">
          <slot />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
