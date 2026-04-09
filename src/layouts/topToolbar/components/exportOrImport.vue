<script setup lang="ts">
  import { computed, ref, watch } from "vue";
  import Copy from "~icons/lucide/copy";
  import Download from "~icons/lucide/download";
  import Image from "~icons/lucide/image";
  import Link2 from "~icons/lucide/link-2";
  import Package from "~icons/lucide/package";
  import Upload from "~icons/lucide/upload";

  import { toast } from "@/utils/toast";
  import { useEditorStore } from "@/stores/editor";
  import TopToolbarDialog from "./TopToolbarDialog.vue";

  type ActionType =
    | "export"
    | "import"
    | "exportImage"
    | "exportZip"
    | "exportLink";
  type ExportScope = "page" | "folder" | "project";
  type ImageType = "png" | "jpg" | "webp";
  type ImageSizeType = "canvas" | "custom";

  const visible = defineModel<boolean>({ default: false });

  const store = useEditorStore();

  const actionGroups = [
    { name: "导出配置", value: "export" as const, icon: Download },
    { name: "导入配置", value: "import" as const, icon: Upload },
    { name: "导出图片", value: "exportImage" as const, icon: Image },
    { name: "导出 ZIP", value: "exportZip" as const, icon: Package },
    { name: "分享链接", value: "exportLink" as const, icon: Link2 },
  ];

  const exportScopeOptions = [
    { value: "page" as const, label: "当前页面" },
    { value: "folder" as const, label: "当前目录" },
    { value: "project" as const, label: "整个项目" },
  ];

  const imageTypeOptions = [
    { value: "png" as const, label: "PNG" },
    { value: "jpg" as const, label: "JPG" },
    { value: "webp" as const, label: "WebP" },
  ];

  const imageQualityOptions = [
    { value: 0.5, label: "低质量" },
    { value: 0.8, label: "标准质量" },
    { value: 1, label: "高质量" },
  ];

  const imageSizeOptions = [
    { value: "canvas" as const, label: "画布尺寸" },
    { value: "custom" as const, label: "自定义尺寸" },
  ];

  const activeAction = ref<ActionType>("export");
  const exportData = ref("");
  const importData = ref<unknown | null>(null);
  const importDataString = ref("");
  const selectedFileName = ref("");
  const imageName = ref("project-preview");
  const imageType = ref<ImageType>("png");
  const imageQuality = ref(1);
  const imageSizeType = ref<ImageSizeType>("canvas");
  const customWidth = ref(1920);
  const customHeight = ref(1080);
  const shareLink = ref("");
  const exportScope = ref<ExportScope>("page");

  const importSummary = computed(() => {
    if (!selectedFileName.value) return "尚未选择文件";
    if (!importDataString.value) return "文件已选择，等待解析";
    if (
      importData.value &&
      typeof importData.value === "object" &&
      "type" in importData.value
    ) {
      return `已识别为 ${String((importData.value as { type?: string }).type)} 数据`;
    }
    return "已读取文件内容";
  });

  watch(visible, (value) => {
    if (!value) return;
    openDialog();
  });

  watch(exportScope, () => {
    if (!visible.value) return;
    void updateExportData();
  });

  function buttonClass(active: boolean) {
    return [
      "flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
      active
        ? "border-accent bg-accent/12 text-surface"
        : "border-border bg-input text-muted hover:bg-hover hover:text-surface",
    ];
  }

  function pillClass(active: boolean) {
    return [
      "inline-flex min-h-9 cursor-pointer items-center justify-center rounded-full border px-3 text-xs font-medium transition-colors",
      active
        ? "border-accent bg-accent/12 text-surface"
        : "border-border bg-input text-muted hover:bg-hover hover:text-surface",
    ];
  }

  function buildFolderExport(pageData: unknown) {
    return {
      type: "folder",
      version: "mock-1.0",
      folderInfo: {
        id: store.state.currentPageId ?? "local-folder",
        name: `${store.state.documentName ?? "当前项目"} 文件夹`,
      },
      pages: [pageData],
      exportTime: new Date().toISOString(),
    };
  }

  function buildProjectExport(pageData: unknown) {
    return {
      type: "project",
      version: "mock-1.0",
      projectInfo: {
        id: store.state.currentPageId ?? "local-project",
        name: store.state.documentName ?? "当前项目",
      },
      folders: [buildFolderExport(pageData)],
      exportTime: new Date().toISOString(),
    };
  }

  function openDialog() {
    imageName.value = store.state.documentName
      ? `${store.state.documentName}-preview`
      : "project-preview";
    shareLink.value = `${window.location.origin}/share/${String(store.state.currentPageId ?? "local-room")}`;
    selectedFileName.value = "";
    importData.value = null;
    importDataString.value = "";
    void updateExportData();
  }

  async function updateExportData() {
    try {
      const pageData = {
        type: "page",
        id: store.state.currentPageId,
        name: store.state.documentName,
      };
      let data: unknown = pageData;

      if (exportScope.value === "folder") {
        data = buildFolderExport(pageData);
      } else if (exportScope.value === "project") {
        data = buildProjectExport(pageData);
      }

      exportData.value = JSON.stringify(data, null, 2);
    } catch (error) {
      console.error("生成导出数据失败:", error);
      toast.show("生成导出数据失败", "error");
      exportData.value = "";
    }
  }

  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    selectedFileName.value = file.name;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = String(loadEvent.target?.result ?? "");
      try {
        importData.value = JSON.parse(result);
        importDataString.value = JSON.stringify(importData.value, null, 2);
        toast.show("文件解析完成");
      } catch {
        importData.value = null;
        importDataString.value = result;
        toast.show("未识别为 JSON，已按纯文本展示", "warning");
      }
    };
    reader.readAsText(file);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareLink.value);
      toast.show("链接已复制到剪贴板");
    } catch {
      toast.show("复制失败", "error");
    }
  }

  function confirmAction() {
    switch (activeAction.value) {
      case "export":
        toast.show("当前仅展示本地导出结构，暂不执行真实下载");
        break;
      case "import":
        if (!importDataString.value) {
          toast.show("请先选择要预览的文件", "warning");
          return;
        }
        toast.show("当前仅展示导入预览，暂不写回编辑器");
        break;
      case "exportImage":
        toast.show(
          `当前仅演示图片参数：${imageType.value.toUpperCase()} / ${imageSizeType.value === "custom" ? `${customWidth.value}×${customHeight.value}` : "画布尺寸"}`,
        );
        break;
      case "exportZip":
        toast.show("ZIP 导出已先降级为占位操作", "warning");
        break;
      case "exportLink":
        void copyLink();
        break;
    }
  }
</script>

<template>
  <TopToolbarDialog
    v-model="visible"
    title="导入 / 导出"
    width-class="w-[min(94vw,1100px)]"
  >
    <div class="flex h-[78vh] min-h-0 flex-col">
      <div class="grid min-h-0 flex-1 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside
          class="border-b border-border bg-canvas/40 p-4 lg:border-r lg:border-b-0"
        >
          <div class="mb-3">
            <div class="text-sm font-semibold text-surface">操作中心</div>
            <p class="mt-1 text-xs leading-5 text-muted">
              先保留结构和本地交互，旧服务端链路已临时降级。
            </p>
          </div>

          <div class="grid gap-2">
            <button
              v-for="group in actionGroups"
              :key="group.value"
              type="button"
              :class="buttonClass(activeAction === group.value)"
              @click="activeAction = group.value"
            >
              <component :is="group.icon" class="size-4" />
              <span>{{ group.name }}</span>
            </button>
          </div>
        </aside>

        <section class="min-h-0 overflow-auto p-5">
          <div v-if="activeAction === 'export'" class="grid gap-5">
            <div>
              <h3 class="text-sm font-semibold text-surface">导出配置</h3>
              <p class="mt-1 text-xs leading-5 text-muted">
                当前页导出使用真实本地数据，目录和项目导出先展示 mock 包装结构。
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                v-for="scope in exportScopeOptions"
                :key="scope.value"
                type="button"
                :class="pillClass(exportScope === scope.value)"
                @click="exportScope = scope.value"
              >
                {{ scope.label }}
              </button>
            </div>

            <div class="rounded-xl border border-border bg-input/60 p-4">
              <div class="mb-3 flex items-center justify-between gap-3">
                <div class="text-xs font-medium text-surface">
                  导出预览 JSON
                </div>
                <span class="text-[11px] text-muted">{{ exportScope }}</span>
              </div>
              <textarea
                :value="exportData"
                class="min-h-[420px] w-full rounded-lg border border-border bg-panel px-3 py-3 font-mono text-xs leading-5 text-surface outline-none"
                readonly
              />
            </div>
          </div>

          <div v-else-if="activeAction === 'import'" class="grid gap-5">
            <div>
              <h3 class="text-sm font-semibold text-surface">导入配置</h3>
              <p class="mt-1 text-xs leading-5 text-muted">
                这轮先保留文件选择和内容预览，不接真实导入写回。
              </p>
            </div>

            <label
              class="grid cursor-pointer gap-3 rounded-xl border border-dashed border-border bg-canvas/40 p-5 text-center transition hover:border-accent"
            >
              <input
                accept=".json,.project,.txt"
                class="hidden"
                type="file"
                @change="handleFileChange"
              />
              <Upload class="mx-auto size-6 text-muted" />
              <div class="text-sm font-medium text-surface">选择本地文件</div>
              <div class="text-xs leading-5 text-muted">
                支持 JSON、project 或纯文本文件，读取后会展示内容预览。
              </div>
              <div
                class="inline-flex min-h-9 items-center justify-center rounded-lg border border-border bg-input px-3 text-xs text-surface"
              >
                {{ selectedFileName || "点击上传文件" }}
              </div>
            </label>

            <div class="rounded-xl border border-border bg-input/60 p-4">
              <div class="mb-2 text-xs font-medium text-surface">导入摘要</div>
              <p class="text-xs leading-5 text-muted">{{ importSummary }}</p>

              <textarea
                :value="importDataString"
                class="mt-3 min-h-[320px] w-full rounded-lg border border-border bg-panel px-3 py-3 font-mono text-xs leading-5 text-surface outline-none"
                placeholder="选择文件后，这里会显示内容预览"
                readonly
              />
            </div>
          </div>

          <div v-else-if="activeAction === 'exportImage'" class="grid gap-5">
            <div>
              <h3 class="text-sm font-semibold text-surface">导出图片</h3>
              <p class="mt-1 text-xs leading-5 text-muted">
                图片实际导出链路先降级，保留参数面板和交互布局。
              </p>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <label class="grid gap-2">
                <span class="text-xs font-medium text-muted">图片名称</span>
                <input
                  v-model="imageName"
                  class="h-10 rounded-lg border border-border bg-input px-3 text-sm text-surface transition outline-none placeholder:text-muted focus:border-accent"
                  placeholder="输入导出文件名"
                  type="text"
                />
              </label>

              <div class="grid gap-2">
                <span class="text-xs font-medium text-muted">图片格式</span>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="typeItem in imageTypeOptions"
                    :key="typeItem.value"
                    type="button"
                    :class="pillClass(imageType === typeItem.value)"
                    @click="imageType = typeItem.value"
                  >
                    {{ typeItem.label }}
                  </button>
                </div>
              </div>

              <div class="grid gap-2 md:col-span-2">
                <span class="text-xs font-medium text-muted">图片质量</span>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="qualityItem in imageQualityOptions"
                    :key="qualityItem.value"
                    type="button"
                    :class="pillClass(imageQuality === qualityItem.value)"
                    @click="imageQuality = qualityItem.value"
                  >
                    {{ qualityItem.label }}
                  </button>
                </div>
              </div>

              <div class="grid gap-2 md:col-span-2">
                <span class="text-xs font-medium text-muted">输出尺寸</span>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="sizeItem in imageSizeOptions"
                    :key="sizeItem.value"
                    type="button"
                    :class="pillClass(imageSizeType === sizeItem.value)"
                    @click="imageSizeType = sizeItem.value"
                  >
                    {{ sizeItem.label }}
                  </button>
                </div>
              </div>

              <template v-if="imageSizeType === 'custom'">
                <label class="grid gap-2">
                  <span class="text-xs font-medium text-muted">宽度</span>
                  <input
                    v-model.number="customWidth"
                    class="h-10 rounded-lg border border-border bg-input px-3 text-sm text-surface transition outline-none placeholder:text-muted focus:border-accent"
                    max="10000"
                    min="100"
                    step="10"
                    type="number"
                  />
                </label>
                <label class="grid gap-2">
                  <span class="text-xs font-medium text-muted">高度</span>
                  <input
                    v-model.number="customHeight"
                    class="h-10 rounded-lg border border-border bg-input px-3 text-sm text-surface transition outline-none placeholder:text-muted focus:border-accent"
                    max="10000"
                    min="100"
                    step="10"
                    type="number"
                  />
                </label>
              </template>
            </div>
          </div>

          <div v-else-if="activeAction === 'exportZip'" class="grid gap-5">
            <div>
              <h3 class="text-sm font-semibold text-surface">导出 ZIP</h3>
              <p class="mt-1 text-xs leading-5 text-muted">
                旧后端下载链路已经移除，这里先保留视觉说明和操作入口。
              </p>
            </div>

            <div
              class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100"
            >
              ZIP
              导出已先降级为占位能力。后续如果你接回新的请求层或本地打包链路，这里可以直接复用当前弹窗结构。
            </div>
          </div>

          <div v-else class="grid gap-5">
            <div>
              <h3 class="text-sm font-semibold text-surface">分享链接</h3>
              <p class="mt-1 text-xs leading-5 text-muted">
                当前使用本地现有 `share` 路由生成链接，可直接复制。
              </p>
            </div>

            <div class="rounded-xl border border-border bg-input/60 p-4">
              <div class="mb-2 text-xs font-medium text-surface">访问地址</div>
              <div class="flex flex-col gap-3 md:flex-row">
                <input
                  v-model="shareLink"
                  class="h-10 min-w-0 flex-1 rounded-lg border border-border bg-panel px-3 text-sm text-surface outline-none"
                  readonly
                  type="text"
                />
                <button
                  class="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-panel px-4 text-sm font-medium text-surface transition hover:bg-hover"
                  type="button"
                  @click="copyLink"
                >
                  <Copy class="size-4" />
                  <span>复制链接</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div
        class="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p class="text-xs leading-5 text-muted">
          当前弹窗只重构到新框架结构，真实导入导出链路后续再接入。
        </p>
        <div class="flex flex-wrap items-center justify-end gap-2">
          <button
            class="inline-flex min-h-9 items-center justify-center rounded-lg border border-border bg-input px-4 text-sm font-medium text-surface transition hover:bg-hover"
            type="button"
            @click="visible = false"
          >
            关闭
          </button>
          <button
            class="inline-flex min-h-9 items-center justify-center rounded-lg border border-accent bg-accent px-4 text-sm font-medium text-white transition hover:opacity-90"
            type="button"
            @click="confirmAction"
          >
            确认操作
          </button>
        </div>
      </div>
    </div>
  </TopToolbarDialog>
</template>
