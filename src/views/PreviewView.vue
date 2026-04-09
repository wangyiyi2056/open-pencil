<script setup lang="ts">
  import { useResizeObserver } from "@vueuse/core";
  import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
  import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuRoot,
    DropdownMenuTrigger,
  } from "reka-ui";
  import ChevronLeft from "~icons/lucide/chevron-left";
  import ChevronRight from "~icons/lucide/chevron-right";
  import SlidersHorizontal from "~icons/lucide/sliders-horizontal";
  import Menu from "~icons/lucide/menu";
  import X from "~icons/lucide/x";
  import Expand from "~icons/lucide/maximize";
  import Shrink from "~icons/lucide/minimize";
  import Play from "~icons/lucide/play";
  import Pause from "~icons/lucide/pause";
  import User from "~icons/lucide/user";
  import { toast } from "@/utils/toast";

  import PreviewCanvas from "@/components/PreviewCanvas.vue";
  import type { EditorStore } from "@/stores/editor";

  type ScaleMode = "fit-width" | "fit-height" | "fit-screen" | "none";

  interface TabInfo {
    id: string;
    name: string;
    isActive: boolean;
    store: EditorStore;
  }

  // 标签页相关
  const tabs = ref<TabInfo[]>([]);
  const currentTabId = ref<string>("");

  // 当前激活的 store（根据当前 tab 切换）
  const store = computed(() => {
    const tab = tabs.value.find((t) => t.id === currentTabId.value);
    return tab?.store ?? null;
  });

  const previewContainerRef = ref<HTMLElement | null>(null);
  const scaleX = ref(1);
  const scaleY = ref(1);
  const scaleMode = ref<ScaleMode>("none");

  // Header 显示状态
  const isHeaderVisible = ref(true);
  let hideHeaderTimer: ReturnType<typeof setTimeout> | null = null;

  // Slider 显示状态
  const isSliderVisible = ref(false);

  // 全屏状态
  const isFullscreen = ref(false);

  // 轮播相关
  const isCarouselPlaying = ref(false);
  const carouselInterval = ref(5000);
  let carouselTimer: ReturnType<typeof setInterval> | null = null;
  const carouselIntervals = [
    { label: "3秒", value: 3000 },
    { label: "5秒", value: 5000 },
    { label: "10秒", value: 10000 },
    { label: "15秒", value: 15000 },
    { label: "30秒", value: 30000 },
  ];

  const scaleModeItems = [
    { value: "fit-width" as const, label: "适应宽度" },
    { value: "fit-height" as const, label: "适应高度" },
    { value: "fit-screen" as const, label: "铺满视口" },
    { value: "none" as const, label: "原始尺寸" },
  ];

  const currentTab = computed(() =>
    tabs.value.find((tab) => tab.id === currentTabId.value),
  );
  const currentIndex = computed(() =>
    tabs.value.findIndex((tab) => tab.id === currentTabId.value),
  );

  const previewPage = computed(() => {
    const s = store.value;
    const page = s?.graph.getNode(s.state.currentPageId);
    return {
      width:
        page && Number.isFinite(page.width) && page.width > 0
          ? page.width
          : 1920,
      height:
        page && Number.isFinite(page.height) && page.height > 0
          ? page.height
          : 1080,
      backgroundColor: colorToCss(s?.state.pageColor),
    };
  });

  const canvasWidth = computed(() => previewPage.value.width);
  const canvasHeight = computed(() => previewPage.value.height);
  const canvasBackground = computed(() => previewPage.value.backgroundColor);
  const documentName = computed(() => currentTab.value?.name ?? "预览");

  // 上一个标签页
  function handlePrev() {
    if (currentIndex.value > 0) {
      const prevTab = tabs.value[currentIndex.value - 1];
      currentTabId.value = prevTab.id;
    }
  }

  // 下一个标签页
  function handleNext() {
    if (currentIndex.value < tabs.value.length - 1) {
      const nextTab = tabs.value[currentIndex.value + 1];
      currentTabId.value = nextTab.id;
    }
  }

  function colorToCss(color?: { r: number; g: number; b: number; a?: number }) {
    if (!color) return "#ffffff";
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = color.a ?? 1;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  function calculateScale() {
    if (!previewContainerRef.value) return;
    const containerWidth = previewContainerRef.value.clientWidth;
    const containerHeight = previewContainerRef.value.clientHeight;
    const canvasW = canvasWidth.value || 1;
    const canvasH = canvasHeight.value || 1;

    switch (scaleMode.value) {
      case "fit-width":
        scaleX.value = containerWidth / canvasW;
        scaleY.value = containerWidth / canvasW;
        break;
      case "fit-height":
        scaleX.value = containerHeight / canvasH;
        scaleY.value = containerHeight / canvasH;
        break;
      case "fit-screen": {
        const ratio = Math.min(
          containerWidth / canvasW,
          containerHeight / canvasH,
        );
        scaleX.value = ratio;
        scaleY.value = ratio;
        break;
      }
      default:
        scaleX.value = 1;
        scaleY.value = 1;
        break;
    }
  }

  function setScaleMode(mode: ScaleMode) {
    scaleMode.value = mode;
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      isFullscreen.value = true;
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        isFullscreen.value = false;
      }
    }
  }

  // 轮播功能
  const startCarousel = () => {
    if (tabs.value.length <= 1) {
      toast.show("页面数量不足，无法轮播", "warning");
      return;
    }

    isCarouselPlaying.value = true;

    const playNext = () => {
      const nextIndex = (currentIndex.value + 1) % tabs.value.length;
      const nextTab = tabs.value[nextIndex];
      currentTabId.value = nextTab.id;
    };

    if (carouselTimer) {
      clearInterval(carouselTimer);
    }

    carouselTimer = setInterval(playNext, carouselInterval.value);
    toast.show("开始轮播", "success");
  };

  const stopCarousel = () => {
    isCarouselPlaying.value = false;
    if (carouselTimer) {
      clearInterval(carouselTimer);
      carouselTimer = null;
    }
    toast.show("暂停轮播", "success");
  };

  const handleCarouselCommand = (command: string) => {
    if (command === "toggle") {
      if (isCarouselPlaying.value) {
        stopCarousel();
      } else {
        startCarousel();
      }
    } else if (command.startsWith("interval-")) {
      const newInterval = parseInt(command.replace("interval-", ""));
      carouselInterval.value = newInterval;

      if (isCarouselPlaying.value) {
        stopCarousel();
        startCarousel();
      }

      const intervalLabel = carouselIntervals.find(
        (item) => item.value === newInterval,
      )?.label;
      toast.show(`轮播间隔设置为 ${intervalLabel}`, "success");
    }
  };

  // Header 相关
  const showHeader = () => {
    isHeaderVisible.value = true;
    resetHideTimer();
  };

  const hideHeader = () => {
    isHeaderVisible.value = false;
  };

  const resetHideTimer = () => {
    if (isSliderVisible.value) return;

    if (hideHeaderTimer) {
      clearTimeout(hideHeaderTimer);
    }
    hideHeaderTimer = setTimeout(() => {
      hideHeader();
    }, 3000);
  };

  const handleHeaderMouseEnter = () => {
    if (hideHeaderTimer) {
      clearTimeout(hideHeaderTimer);
      hideHeaderTimer = null;
    }
  };

  const handleHeaderMouseLeave = () => {
    if (!isSliderVisible.value) {
      resetHideTimer();
    }
  };

  const handlePageClick = () => {
    showHeader();
  };

  const handleCanvasClick = () => {
    if (!isSliderVisible.value) {
      hideHeader();
    }
  };

  // 切换 Slider
  const toggleSlider = () => {
    isSliderVisible.value = !isSliderVisible.value;

    if (isSliderVisible.value) {
      if (hideHeaderTimer) {
        clearTimeout(hideHeaderTimer);
        hideHeaderTimer = null;
      }
      isHeaderVisible.value = true;
    } else {
      resetHideTimer();
    }
  };

  // 全屏状态变化
  const handleFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement;
  };

  // 键盘事件处理
  const handleKeydown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        handlePrev();
        break;
      case "ArrowRight":
        e.preventDefault();
        handleNext();
        break;
      case "f":
      case "F":
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          toggleFullscreen();
        }
        break;
    }
  };

  onMounted(() => {
    // 尝试从 window.opener 获取数据
    try {
      const opener = window.opener as Window & {
        __OPEN_PENCIL_STORE__?: EditorStore;
        __OPEN_PENCIL_ALL_TABS__?: TabInfo[];
        __OPEN_PENCIL_ACTIVE_TAB_ID__?: string;
      };
      if (opener?.__OPEN_PENCIL_ALL_TABS__) {
        tabs.value = opener.__OPEN_PENCIL_ALL_TABS__;
      }
      if (opener?.__OPEN_PENCIL_ACTIVE_TAB_ID__) {
        currentTabId.value = opener.__OPEN_PENCIL_ACTIVE_TAB_ID__;
      }
    } catch {
      // cross-origin or no opener
    }

    void nextTick(calculateScale);

    window.addEventListener("keydown", handleKeydown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // 初始显示 3 秒后自动隐藏
    resetHideTimer();
  });

  watch([canvasWidth, canvasHeight, scaleMode], () => {
    void nextTick(calculateScale);
  });

  useResizeObserver(previewContainerRef, () => {
    void nextTick(calculateScale);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeydown);
    document.removeEventListener("fullscreenchange", handleFullscreenChange);

    if (hideHeaderTimer) {
      clearTimeout(hideHeaderTimer);
    }
    if (carouselTimer) {
      clearInterval(carouselTimer);
    }
  });
</script>

<template>
  <div
    class="flex h-screen w-screen flex-col overflow-hidden bg-panel text-surface"
    @click="handlePageClick"
  >
    <!-- 自动隐藏的 Header -->
    <div
      class="fixed left-0 right-0 top-0 z-[1000] flex h-[50px] items-center justify-between bg-white/95 px-2 backdrop-blur-sm shadow-sm transition-transform duration-300"
      :class="isHeaderVisible ? 'translate-y-0' : '-translate-y-full'"
      @mouseenter="handleHeaderMouseEnter"
      @mouseleave="handleHeaderMouseLeave"
    >
      <!-- 左侧：菜单和导航按钮 -->
      <div class="flex min-w-[120px] items-center gap-1">
        <button
          type="button"
          class="inline-flex size-10 items-center justify-center rounded-md text-muted transition-all hover:bg-hover hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
          title="页面列表"
          @click.stop="toggleSlider"
        >
          <Menu class="size-5" />
        </button>
        <div class="ml-2 flex items-center">
          <button
            type="button"
            class="inline-flex size-10 items-center justify-center rounded-md text-muted transition-all hover:bg-hover hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
            :disabled="tabs.length === 0 || currentIndex === 0"
            title="上一个 (←)"
            @click.stop="handlePrev"
          >
            <ChevronLeft class="size-4" />
          </button>
          <button
            type="button"
            class="inline-flex size-10 items-center justify-center rounded-md text-muted transition-all hover:bg-hover hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
            :disabled="tabs.length === 0 || currentIndex === tabs.length - 1"
            title="下一个 (→)"
            @click.stop="handleNext"
          >
            <ChevronRight class="size-4" />
          </button>
        </div>
      </div>

      <!-- 中间：文档标题 -->
      <div class="flex flex-1 items-center justify-center overflow-hidden px-4">
        <span class="truncate text-sm font-medium text-surface">
          {{ documentName }}
        </span>
      </div>

      <!-- 右侧：功能按钮 -->
      <div class="flex min-w-[120px] items-center justify-end gap-1">
        <div
          class="mr-2 flex size-8 items-center justify-center rounded-full bg-fill cursor-pointer"
        >
          <User class="size-6 text-muted" />
        </div>

        <!-- 轮播控制 -->
        <DropdownMenuRoot>
          <DropdownMenuTrigger as-child>
            <button
              type="button"
              class="inline-flex size-10 items-center justify-center rounded-md text-muted transition-all hover:bg-hover hover:text-primary"
              title="轮播控制"
              @click.stop
            >
              <Play v-if="!isCarouselPlaying" class="size-4" />
              <Pause v-else class="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent
              class="z-50 min-w-32 rounded-lg border border-border bg-panel p-1 shadow-xl"
              :side-offset="4"
            >
              <DropdownMenuItem
                class="flex cursor-pointer items-center rounded-md px-3 py-2 text-xs transition outline-none data-[highlighted]:bg-hover data-[highlighted]:text-surface"
                @select="handleCarouselCommand('toggle')"
              >
                {{ isCarouselPlaying ? "暂停轮播" : "开始轮播" }}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled
                class="flex cursor-default items-center rounded-md px-3 py-2 text-xs text-muted"
              >
                轮播间隔
              </DropdownMenuItem>
              <DropdownMenuItem
                v-for="interval in carouselIntervals"
                :key="interval.value"
                class="flex cursor-pointer items-center rounded-md px-3 py-2 text-xs transition outline-none data-[highlighted]:bg-hover data-[highlighted]:text-surface"
                :class="
                  carouselInterval === interval.value
                    ? 'bg-accent/10 text-surface'
                    : 'text-muted'
                "
                @select="handleCarouselCommand('interval-' + interval.value)"
              >
                {{ interval.label }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenuRoot>

        <!-- 缩放模式 -->
        <DropdownMenuRoot>
          <DropdownMenuTrigger as-child>
            <button
              type="button"
              class="inline-flex size-10 items-center justify-center rounded-md text-muted transition-all hover:bg-hover hover:text-primary"
              title="缩放模式"
              @click.stop
            >
              <SlidersHorizontal class="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent
              class="z-50 min-w-32 rounded-lg border border-border bg-panel p-1 shadow-xl"
              :side-offset="4"
            >
              <DropdownMenuItem
                v-for="item in scaleModeItems"
                :key="item.value"
                class="flex cursor-pointer items-center rounded-md px-3 py-2 text-xs transition outline-none data-[highlighted]:bg-hover data-[highlighted]:text-surface"
                :class="
                  scaleMode === item.value
                    ? 'bg-accent/10 text-surface'
                    : 'text-muted'
                "
                @select="setScaleMode(item.value)"
              >
                {{ item.label }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenuRoot>

        <!-- 全屏按钮 -->
        <button
          type="button"
          class="inline-flex size-10 items-center justify-center rounded-md text-muted transition-all hover:bg-hover hover:text-primary"
          title="全屏 (F)"
          @click.stop="toggleFullscreen"
        >
          <Expand v-if="!isFullscreen" class="size-4" />
          <Shrink v-else class="size-4" />
        </button>
      </div>
    </div>

    <!-- 顶部触发区域 -->
    <div
      v-if="!isSliderVisible"
      class="fixed left-0 right-0 top-0 z-[999] h-2.5"
      @mouseenter="showHeader"
    ></div>

    <!-- 主内容区域 -->
    <div class="flex h-full w-full flex-1">
      <!-- 自定义侧边栏 -->
      <div
        v-if="isSliderVisible"
        class="mt-[50px] flex w-[280px] flex-col bg-white shadow-lg z-[100]"
        @click.stop
      >
        <div
          class="flex items-center justify-between border-b border-border px-4 py-3"
        >
          <span class="text-sm font-medium text-surface">页面列表</span>
          <button
            type="button"
            class="inline-flex size-7 items-center justify-center rounded text-muted transition-all hover:bg-hover hover:text-primary"
            @click="toggleSlider"
          >
            <X class="size-4" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div
            v-for="tab in tabs"
            :key="tab.id"
            class="cursor-pointer border-b border-border/50 px-4 py-3 text-xs transition-all hover:bg-primary-light"
            :class="
              tab.id === currentTabId
                ? 'bg-primary-light text-primary font-medium'
                : 'text-muted'
            "
          >
            <span class="block">{{ tab.name }}</span>
          </div>
        </div>
      </div>

      <!-- 画布容器 -->
      <div
        ref="previewContainerRef"
        data-testid="preview-runtime-surface"
        class="flex min-h-0 flex-1 justify-center overflow-auto bg-hover text-center"
        @click.stop="handleCanvasClick"
      >
        <div
          class="shrink-0"
          :style="{
            width: `${canvasWidth * scaleX}px`,
            height: `${canvasHeight * scaleY}px`,
          }"
        >
          <div
            class="relative"
            :style="{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              backgroundColor: canvasBackground,
              transform: `scale(${scaleX}, ${scaleY})`,
              transformOrigin: '0 0',
            }"
          >
            <PreviewCanvas
              v-if="store"
              :store="store"
              class="absolute inset-0"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
