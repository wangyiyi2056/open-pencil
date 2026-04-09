<script setup lang="ts">
  import { computed, ref } from "vue";
  import Moon from "~icons/lucide/moon";
  import Sun from "~icons/lucide/sun";

  import AppGroupedSelect from "@/components/ui/AppGroupedSelect.vue";
  import { toast } from "@/utils/toast";
  import { useI18n } from "@open-pencil/vue";
  import TopToolbarDialog from "./TopToolbarDialog.vue";

  const { locale, localeLabels, setLocale } = useI18n();

  // 中文语言
  const chineseLocales = ["zh", "zh-TW"] as const;
  // 其他语言
  const otherLocales = ["en", "de", "es", "fr", "it", "pl", "ru"] as const;

  const languageGroups = [
    {
      label: "中文",
      items: chineseLocales.map((code) => ({
        label: localeLabels[code],
        value: code,
      })),
    },
    {
      label: "其他语言",
      items: otherLocales.map((code) => ({
        label: localeLabels[code],
        value: code,
      })),
    },
  ];

  const currentLanguageLabel = computed(
    () => localeLabels[locale.value] || locale.value,
  );

  const modelValue = defineModel<boolean>({ default: false });

  const booleanOptions = [
    { label: "开启", value: true },
    { label: "关闭", value: false },
  ] as const;

  const themeOptions = [
    { label: "浅色", value: "light", icon: Sun },
    { label: "深色", value: "dark", icon: Moon },
  ] as const;

  const themeValue = ref<"light" | "dark">("dark");
  const editorRealTimeUpdate = ref(true);

  const gridValue = ref(true);
  const gradeLen = ref(16);
  const showComponentPanel = ref(true);
  const showPropertyPanel = ref(true);
  const isProfileCapturing = ref(false);

  const profilerSnapshots = [
    {
      fps: 60,
      frameTimeMs: 16.7,
      cpuTimeMs: 8.9,
      gpuTimeMs: 5.4,
      drawCalls: 124,
      culledNodes: 58,
      totalNodes: 316,
    },
    {
      fps: 58,
      frameTimeMs: 17.2,
      cpuTimeMs: 9.4,
      gpuTimeMs: 5.9,
      drawCalls: 131,
      culledNodes: 64,
      totalNodes: 316,
    },
    {
      fps: 62,
      frameTimeMs: 15.9,
      cpuTimeMs: 8.1,
      gpuTimeMs: 5.1,
      drawCalls: 118,
      culledNodes: 61,
      totalNodes: 316,
    },
  ] as const;

  const profilerSnapshotIndex = ref(0);
  const profilerSnapshot = computed(
    () =>
      profilerSnapshots[profilerSnapshotIndex.value] ?? profilerSnapshots[0],
  );

  const profileStatusLabel = computed(() =>
    isProfileCapturing.value ? "捕获中" : "未捕获",
  );

  function segmentClass(active: boolean) {
    return [
      "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors",
      active
        ? "border-accent bg-accent/12 text-surface"
        : "border-border bg-input text-muted hover:bg-hover hover:text-surface",
    ];
  }

  function cardClass(span = false) {
    return [
      "rounded-xl border border-border bg-canvas/40 p-4",
      span ? "md:col-span-2" : "",
    ];
  }

  function cycleProfilerSnapshot() {
    profilerSnapshotIndex.value =
      (profilerSnapshotIndex.value + 1) % profilerSnapshots.length;
  }

  function refreshProfilerSnapshot() {
    cycleProfilerSnapshot();
    toast.show("已刷新示例性能快照");
  }

  function startProfileCapture() {
    isProfileCapturing.value = true;
    cycleProfilerSnapshot();
    toast.show("当前为样式演示，已模拟开始捕获");
  }

  function stopCaptureAndExportSpeedscope() {
    isProfileCapturing.value = false;
    cycleProfilerSnapshot();
    toast.show("当前为样式演示，已模拟导出性能文件");
  }
</script>

<template>
  <TopToolbarDialog
    v-model="modelValue"
    title="设置"
    width-class="w-[min(92vw,720px)]"
  >
    <div class="flex flex-col">
      <div class="flex flex-col gap-4 p-5">
        <div class="grid gap-4 md:grid-cols-2">
          <section :class="cardClass()">
            <div class="mb-3">
              <div class="text-sm font-medium text-surface">主题</div>
              <p class="mt-1 text-xs leading-5 text-muted">
                仅保留界面样式，后续再接入真实主题切换。
              </p>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="item in themeOptions"
                :key="item.value"
                :class="segmentClass(themeValue === item.value)"
                type="button"
                @click="themeValue = item.value"
              >
                <component :is="item.icon" class="size-4" />
                <span>{{ item.label }}</span>
              </button>
            </div>
          </section>

          <section :class="cardClass()">
            <div class="mb-3">
              <div class="text-sm font-medium text-surface">实时更新</div>
              <p class="mt-1 text-xs leading-5 text-muted">
                用本地模拟状态展示开关样式。
              </p>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="item in booleanOptions"
                :key="`realtime-${item.label}`"
                :class="segmentClass(editorRealTimeUpdate === item.value)"
                type="button"
                @click="editorRealTimeUpdate = item.value"
              >
                {{ item.label }}
              </button>
            </div>
          </section>

          <section :class="cardClass()">
            <div class="mb-3">
              <div class="text-sm font-medium text-surface">界面语言</div>
              <p class="mt-1 text-xs leading-5 text-muted">
                切换编辑器显示语言。
              </p>
            </div>

            <AppGroupedSelect
              v-model="locale"
              :groups="languageGroups"
              :display-value="currentLanguageLabel"
              :ui="{
                trigger: 'w-full rounded-lg px-3 py-2 text-sm min-h-9',
                item: 'rounded px-3 py-2 text-sm',
                label: 'px-3 py-1.5 text-xs text-muted',
              }"
              @update:model-value="setLocale($event as any)"
            />
          </section>

          <section :class="cardClass()">
            <div class="mb-3">
              <div class="text-sm font-medium text-surface">网格设置</div>
              <p class="mt-1 text-xs leading-5 text-muted">
                先恢复视觉结构，数值不会写入真实配置。
              </p>
            </div>

            <div class="grid gap-3">
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="item in booleanOptions"
                  :key="`grid-${item.label}`"
                  :class="segmentClass(gridValue === item.value)"
                  type="button"
                  @click="gridValue = item.value"
                >
                  {{ item.label }}
                </button>
              </div>

              <label v-if="gridValue" class="grid gap-2">
                <span class="text-xs text-muted">网格尺寸（px）</span>
                <input
                  v-model.number="gradeLen"
                  class="h-10 rounded-lg border border-border bg-input px-3 text-sm text-surface transition outline-none placeholder:text-muted focus:border-accent"
                  min="0"
                  step="1"
                  type="number"
                />
              </label>
            </div>
          </section>

          <section :class="cardClass()">
            <div class="mb-3">
              <div class="text-sm font-medium text-surface">左侧面板</div>
              <p class="mt-1 text-xs leading-5 text-muted">
                使用模拟开关预览当前交互样式。
              </p>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="item in booleanOptions"
                :key="`left-panel-${item.label}`"
                :class="segmentClass(showComponentPanel === item.value)"
                type="button"
                @click="showComponentPanel = item.value"
              >
                {{ item.label }}
              </button>
            </div>
          </section>

          <section :class="cardClass()">
            <div class="mb-3">
              <div class="text-sm font-medium text-surface">右侧面板</div>
              <p class="mt-1 text-xs leading-5 text-muted">
                当前仅还原外观，不联动实际布局。
              </p>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="item in booleanOptions"
                :key="`right-panel-${item.label}`"
                :class="segmentClass(showPropertyPanel === item.value)"
                type="button"
                @click="showPropertyPanel = item.value"
              >
                {{ item.label }}
              </button>
            </div>
          </section>
        </div>

        <div
          class="flex flex-col gap-3 border-t border-border pt-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between"
        >
          <p>当前弹窗仅用于还原新框架下的设置样式，后续可再接入真实配置。</p>
          <button
            class="inline-flex min-h-9 items-center justify-center rounded-lg border border-border bg-input px-4 text-sm font-medium text-surface transition hover:bg-hover"
            type="button"
            @click="modelValue = false"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </TopToolbarDialog>
</template>
