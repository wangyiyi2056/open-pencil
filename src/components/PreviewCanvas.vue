<script setup lang="ts">
  import { ref } from "vue";
  import { useCanvas } from "@open-pencil/vue";
  import type { EditorStore } from "@/stores/editor";

  const props = defineProps<{ store: EditorStore }>();

  const canvasRef = ref<HTMLCanvasElement | null>(null);

  useCanvas(canvasRef, props.store, { showRulers: false });
</script>

<template>
  <canvas ref="canvasRef" class="block h-full w-full" />
</template>
