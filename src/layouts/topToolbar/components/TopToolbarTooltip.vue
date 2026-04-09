<script setup lang="ts">
import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger
} from 'reka-ui'

const { content, delayDuration, side } = defineProps<{
  content: string
  delayDuration?: number
  side?: 'top' | 'right' | 'bottom' | 'left'
}>()
</script>

<template>
  <TooltipProvider>
    <TooltipRoot :delay-duration="delayDuration ?? 500">
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          :side="side ?? 'top'"
          :side-offset="6"
          class="z-50 rounded-md bg-black/85 px-2 py-1 text-xs text-white shadow-lg"
        >
          {{ content }}
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
