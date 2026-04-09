<template>
  <div class="top-toolbar">
    <div class="flex w-full items-center justify-between px-2 py-1">
      <div class="flex items-center gap-1">
        <template v-for="item in leftToolbarItems" :key="item.key">
          <div
            v-if="item.type === 'divider'"
            class="divider-vertical bg-gray-300"
          ></div>
          <div v-else-if="item.type === 'select'" class="head-btn !w-[70px]">
            <AppSelect
              v-if="item.selectValue && item.options"
              v-model="item.selectValue.value"
              :options="item.options"
              placeholder=" "
            />
          </div>
          <button
            v-else
            type="button"
            class="head-btn"
            :class="{ disabled: item.disabled?.() }"
            :data-testid="item.testId"
            :title="item.label"
            :disabled="item.disabled?.()"
            @click="item.onClick?.()"
          >
            <component :is="item.icon" class="size-[18px]" />
          </button>
        </template>
      </div>

      <div class="flex items-center gap-1">
        <button
          v-for="item in rightToolbarItems"
          :key="item.key"
          type="button"
          class="head-btn"
          :data-testid="item.testId"
          :title="item.label"
          @click="item.onClick"
        >
          <component :is="item.icon" class="size-[18px]" />
        </button>
        <div class="divider-vertical bg-gray-300"></div>
        <button
          type="button"
          class="head-btn"
          title="发布"
          @click="handleShare"
        >
          <Send class="size-[18px]" />
        </button>
        <button
          type="button"
          class="head-btn"
          title="设置"
          @click="handleSetting"
        >
          <Settings class="size-[18px]" />
        </button>
      </div>
    </div>
    <Preview v-model="showPreview" />
    <ExportOrImport v-model="showExport" />
    <Share v-model="showShare" />
    <Setting v-model="showSetting" />
    <!-- <SmartFillDialog v-model="showSmartFill" /> -->
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, type Component, type WritableComputedRef } from "vue";
  import AlignCenterHorizontal from "~icons/lucide/align-center-horizontal";
  import AlignCenterVertical from "~icons/lucide/align-center-vertical";
  import AlignEndHorizontal from "~icons/lucide/align-end-horizontal";
  import AlignEndVertical from "~icons/lucide/align-end-vertical";
  import AlignStartHorizontal from "~icons/lucide/align-start-horizontal";
  import AlignStartVertical from "~icons/lucide/align-start-vertical";
  import Bot from "~icons/lucide/bot";
  import ChevronsDown from "~icons/lucide/chevrons-down";
  import ChevronsUp from "~icons/lucide/chevrons-up";
  import Copy from "~icons/lucide/copy";
  import Download from "~icons/lucide/download";
  import ExternalLink from "~icons/lucide/external-link";
  import FlipHorizontal2 from "~icons/lucide/flip-horizontal-2";
  import FlipVertical2 from "~icons/lucide/flip-vertical-2";
  import Grid3x3 from "~icons/lucide/grid-3x3";
  import Group from "~icons/lucide/group";
  import Keyboard from "~icons/lucide/keyboard";
  import Layers from "~icons/lucide/layers";
  import Maximize from "~icons/lucide/maximize";
  import Monitor from "~icons/lucide/monitor";
  import Redo from "~icons/lucide/redo";
  import RotateCcw from "~icons/lucide/rotate-ccw";
  import RotateCw from "~icons/lucide/rotate-cw";
  import Save from "~icons/lucide/save";
  import Send from "~icons/lucide/send";
  import SeparatorHorizontal from "~icons/lucide/separator-horizontal";
  import SeparatorVertical from "~icons/lucide/separator-vertical";
  import Settings from "~icons/lucide/settings";
  import StretchHorizontal from "~icons/lucide/stretch-horizontal";
  import StretchVertical from "~icons/lucide/stretch-vertical";
  import Trash from "~icons/lucide/trash";
  import Undo from "~icons/lucide/undo";
  import Ungroup from "~icons/lucide/ungroup";
  import Wand2 from "~icons/lucide/wand-2";
  import ZoomIn from "~icons/lucide/zoom-in";
  import ZoomOut from "~icons/lucide/zoom-out";

  import AppSelect from "@/components/AppSelect.vue";
  import { toast } from "@/utils/toast";
  import { useEditorStore } from "@/stores/editor";
  import ExportOrImport from "./components/exportOrImport.vue";
  import Preview from "./components/preview.vue";
  import Share from "./components/share.vue";
  import Setting from "./components/setting.vue";
  // import SmartFillDialog from "./components/SmartFillDialog.vue";

  const store = useEditorStore();

  type ToolbarItem =
    | { key: string; type: "divider" }
    | {
        key: string;
        type: "button";
        label: string;
        icon: Component;
        onClick?: () => void;
        disabled?: () => boolean;
        testId?: string;
      }
    | {
        key: string;
        type: "select";
        options: { value: string; label: string }[];
        selectValue:
          | WritableComputedRef<string>
          | ReturnType<typeof ref<string>>;
      };

  const showPreview = ref(false);
  const showSetting = ref(false);
  const showShortcutKey = ref(false);
  const showShare = ref(false);
  const showExport = ref(false);
  const showSmartFill = ref(false);
  const showAIAssistant = ref(false);

  const gridSnapValue = ref("5");
  const gridOptions = [
    { value: "5", label: "5" },
    { value: "10", label: "10" },
  ];

  const zoomOptions = [
    { value: "50", label: "50%" },
    { value: "100", label: "100%" },
    { value: "200", label: "200%" },
  ];

  const zoomValue = computed({
    get: () => `${Math.round(store.state.zoom * 100)}`,
    set: (value: string) => {
      const nextZoom = Number(value);
      if (!Number.isNaN(nextZoom)) {
        store.state.zoom = nextZoom / 100;
        store.requestRepaint();
      }
    },
  });

  const leftToolbarItems = computed<ToolbarItem[]>(() => [
    {
      key: "save",
      type: "button",
      label: "保存",
      icon: Save,
      onClick: () => store.saveFigFile(),
    },
    {
      key: "undo",
      type: "button",
      label: "撤销",
      icon: Undo,
      onClick: () => store.undoAction(),
    },
    {
      key: "redo",
      type: "button",
      label: "重做",
      icon: Redo,
      onClick: () => store.redoAction(),
    },
    { key: "divider-0", type: "divider" },
    {
      key: "copy",
      type: "button",
      label: "复制",
      icon: Copy,
      onClick: () => {
        const transfer = new DataTransfer();
        store.writeCopyData(transfer);
        navigator.clipboard.writeText(transfer.getData("text/plain"));
        toast.show("已复制", "success");
      },
    },
    {
      key: "duplicate",
      type: "button",
      label: "复制选中",
      icon: Layers,
      onClick: () => store.duplicateSelected(),
    },
    {
      key: "delete",
      type: "button",
      label: "删除",
      icon: Trash,
      onClick: () => store.deleteSelected(),
    },
    { key: "divider-1", type: "divider" },
    {
      key: "align-left",
      type: "button",
      label: "左对齐",
      icon: AlignStartVertical,
      onClick: () => toast.show("左对齐暂未实现", "warning"),
    },
    {
      key: "align-right",
      type: "button",
      label: "右对齐",
      icon: AlignEndVertical,
      onClick: () => toast.show("右对齐暂未实现", "warning"),
    },
    {
      key: "align-top",
      type: "button",
      label: "上对齐",
      icon: AlignStartHorizontal,
      onClick: () => toast.show("上对齐暂未实现", "warning"),
    },
    {
      key: "align-bottom",
      type: "button",
      label: "下对齐",
      icon: AlignEndHorizontal,
      onClick: () => toast.show("下对齐暂未实现", "warning"),
    },
    {
      key: "align-middle",
      type: "button",
      label: "垂直居中",
      icon: AlignCenterHorizontal,
      onClick: () => toast.show("垂直居中暂未实现", "warning"),
    },
    {
      key: "align-center",
      type: "button",
      label: "水平居中",
      icon: AlignCenterVertical,
      onClick: () => toast.show("水平居中暂未实现", "warning"),
    },
    {
      key: "space-vertical",
      type: "button",
      label: "垂直分布",
      icon: SeparatorVertical,
      onClick: () => toast.show("垂直分布暂未实现", "warning"),
    },
    {
      key: "space-horizontal",
      type: "button",
      label: "水平分布",
      icon: SeparatorHorizontal,
      onClick: () => toast.show("水平分布暂未实现", "warning"),
    },
    { key: "divider-2", type: "divider" },
    {
      key: "to-front",
      type: "button",
      label: "置顶",
      icon: ChevronsUp,
      onClick: () => store.bringToFront(),
    },
    {
      key: "to-back",
      type: "button",
      label: "置底",
      icon: ChevronsDown,
      onClick: () => store.sendToBack(),
    },
    {
      key: "group",
      type: "button",
      label: "组合",
      icon: Group,
      onClick: () => store.groupSelected(),
    },
    {
      key: "ungroup",
      type: "button",
      label: "取消组合",
      icon: Ungroup,
      onClick: () => store.ungroupSelected(),
    },
    { key: "divider-3", type: "divider" },
    {
      key: "rotate-cw",
      type: "button",
      label: "顺时针旋转",
      icon: RotateCw,
      onClick: () => toast.show("顺时针旋转暂未实现", "warning"),
    },
    {
      key: "rotate-ccw",
      type: "button",
      label: "逆时针旋转",
      icon: RotateCcw,
      onClick: () => toast.show("逆时针旋转暂未实现", "warning"),
    },
    {
      key: "flip-x",
      type: "button",
      label: "水平翻转",
      icon: FlipHorizontal2,
      onClick: () => toast.show("水平翻转暂未实现", "warning"),
    },
    {
      key: "flip-y",
      type: "button",
      label: "垂直翻转",
      icon: FlipVertical2,
      onClick: () => toast.show("垂直翻转暂未实现", "warning"),
    },
    { key: "divider-4", type: "divider" },
    {
      key: "grid",
      type: "button",
      label: "网格",
      icon: Grid3x3,
      onClick: () => toast.show("网格暂未实现", "warning"),
    },
    {
      key: "grid-select",
      type: "select",
      options: gridOptions,
      selectValue: gridSnapValue,
    },
    {
      key: "ruler-x",
      type: "button",
      label: "水平标尺",
      icon: StretchHorizontal,
      onClick: () => toast.show("水平标尺暂未实现", "warning"),
    },
    {
      key: "ruler-y",
      type: "button",
      label: "垂直标尺",
      icon: StretchVertical,
      onClick: () => toast.show("垂直标尺暂未实现", "warning"),
    },
    { key: "divider-5", type: "divider" },
    {
      key: "zoom-out",
      type: "button",
      label: "缩小",
      icon: ZoomOut,
      onClick: () =>
        store.applyZoom(100, window.innerWidth / 2, window.innerHeight / 2),
    },
    {
      key: "zoom-select",
      type: "select",
      options: zoomOptions,
      selectValue: zoomValue,
    },
    {
      key: "zoom-in",
      type: "button",
      label: "放大",
      icon: ZoomIn,
      onClick: () =>
        store.applyZoom(-100, window.innerWidth / 2, window.innerHeight / 2),
    },
    {
      key: "zoom-reset",
      type: "button",
      label: "原始大小",
      icon: Maximize,
      onClick: () => store.zoomTo100(),
    },
    { key: "divider-6", type: "divider" },
    {
      key: "shortcuts",
      type: "button",
      label: "快捷键",
      icon: Keyboard,
      onClick: () => (showShortcutKey.value = true),
    },
    {
      key: "smart-fill",
      type: "button",
      label: "智能填充",
      icon: Wand2,
      onClick: () => (showSmartFill.value = true),
    },
    {
      key: "ai",
      type: "button",
      label: "AI 助手",
      icon: Bot,
      onClick: () => (showAIAssistant.value = true),
    },
  ]);

  const rightToolbarItems = computed<ToolbarItem[]>(() => [
    {
      key: "preview",
      type: "button",
      label: "预览",
      icon: Monitor,
      onClick: () => (showPreview.value = true),
      testId: "toolbar-preview",
    },
    {
      key: "new-window-preview",
      type: "button",
      label: "新窗口预览",
      icon: ExternalLink,
      onClick: handleNewWindowPreview,
      testId: "toolbar-new-window-preview",
    },
    {
      key: "export",
      type: "button",
      label: "导入导出",
      icon: Download,
      onClick: () => (showExport.value = true),
      testId: "toolbar-export",
    },
  ]);

  function handleShare() {
    showShare.value = true;
  }

  function handleSetting() {
    showSetting.value = true;
  }

  function handleNewWindowPreview() {
    window.open("/preview", "_blank");
  }
</script>

<style scoped>
  .head-btn {
    display: flex;
    cursor: pointer;
    justify-content: center;
    align-items: center;
    width: 28px;
    height: 28px;
    transition: 0.2s;
    border-radius: 6px;
    user-select: none;
    outline: none;
    color: var(--color-muted);
    background: transparent;

    svg {
      outline: none;
      pointer-events: none;
    }

    &:hover:not(.disabled) {
      background-color: var(--color-hover);

      svg {
        color: var(--color-surface);
      }
    }

    &.disabled {
      cursor: not-allowed;
      opacity: 0.4;
    }
  }

  .divider-vertical {
    margin: 0 6px;
    display: inline-block;
    height: 1.25em;
    width: 1px;
    vertical-align: middle;
    position: relative;
    top: 0;
    padding: 0;
    list-style: none;
    font-size: 14px;
    line-height: 1.5;
    background-color: var(--color-border);
  }
</style>
