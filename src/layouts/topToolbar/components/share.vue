<script setup lang="ts">
  import { computed, reactive, watch } from "vue";
  import { useRouter } from "vue-router";
  import Check from "~icons/lucide/check";
  import Copy from "~icons/lucide/copy";
  import ExternalLink from "~icons/lucide/external-link";
  import Globe from "~icons/lucide/globe";
  import Lock from "~icons/lucide/lock";

  import { toast } from "@/utils/toast";
  import TopToolbarDialog from "./TopToolbarDialog.vue";

  const visible = defineModel<boolean>({ default: false });

  const router = useRouter();
  // const { currentProject } = useEditor();

  const publishOptions = [
    { label: "已发布", value: 1 },
    { label: "未发布", value: 0 },
  ] as const;

  const permissionOptions = [
    { label: "需要密码", value: true },
    { label: "公开访问", value: false },
  ] as const;

  const form = reactive({
    title: "",
    status: 1,
    enablePermission: false,
    href: "",
    password: "",
  });

  const mockVersions = computed(() => {
    // const projectName = currentProject.value?.name ?? "当前项目";
    return [
      {
        id: "v3",
        version: "3.0",
        createTime: "今天 15:40",
        description: `的最近版本快照`,
        current: true,
      },
      {
        id: "v2",
        version: "2.4",
        createTime: "昨天 19:12",
        description: "样式联调前的稳定版本",
        current: false,
      },
      {
        id: "v1",
        version: "1.8",
        createTime: "03-18 10:26",
        description: "早期结构验证版本",
        current: false,
      },
    ];
  });

  watch(visible, (value) => {
    if (!value) return;

    // const projectId = String(currentProject.value?.id ?? "local-room");
    // const projectName = currentProject.value?.name ?? "未命名项目";
    const routeUrl = router.resolve({
      path: `/share/local-room`,
    });

    // form.title = projectName;
    form.status = 1;
    form.enablePermission = false;
    form.password = "";
    form.href = `${window.location.origin}${routeUrl.href}`;
  });

  function segmentClass(active: boolean) {
    return [
      "inline-flex min-h-9 items-center justify-center rounded-lg border px-3 text-xs font-medium transition-colors",
      active
        ? "border-accent bg-accent/12 text-surface"
        : "border-border bg-input text-muted hover:bg-hover hover:text-surface",
    ];
  }

  function handleView() {
    if (!form.href) return;
    window.open(form.href, "_blank");
  }

  async function handleCopy() {
    if (!form.href) return;
    try {
      await navigator.clipboard.writeText(form.href);
      toast.show("链接已复制到剪贴板");
    } catch {
      toast.show("复制失败", "error");
    }
  }

  function selectVersion(versionId: string) {
    const version = mockVersions.value.find((item) => item.id === versionId);
    if (!version) return;
    toast.show(`当前为样式演示，已切换到 v${version.version}`);
  }

  function handleSubmit() {
    toast.show("当前仅重构弹窗结构，发布保存已改为本地演示");
    visible.value = false;
  }
</script>

<template>
  <TopToolbarDialog
    v-model="visible"
    title="发布设置"
    width-class="w-[min(92vw,980px)]"
  >
    <div class="flex flex-col gap-5 p-5">
      <div
        class="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]"
      >
        <section class="rounded-xl border border-border bg-canvas/40 p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="text-sm font-semibold text-surface">发布面板</h3>
              <p class="mt-1 text-xs leading-5 text-muted">
                这轮先统一到新框架结构，保存动作保留为本地 mock。
              </p>
            </div>
            <span
              class="inline-flex min-h-7 items-center rounded-full border border-border bg-input px-2.5 text-[11px] text-muted"
            >
              样式演示
            </span>
          </div>

          <div class="mt-5 grid gap-5">
            <label class="grid gap-2">
              <span class="text-xs font-medium text-muted">视图名称</span>
              <input
                v-model="form.title"
                class="h-10 rounded-lg border border-border bg-input px-3 text-sm text-surface transition outline-none placeholder:text-muted focus:border-accent"
                placeholder="输入当前发布名称"
                type="text"
              />
            </label>

            <div class="grid gap-2">
              <span class="text-xs font-medium text-muted">发布状态</span>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="item in publishOptions"
                  :key="item.value"
                  :class="segmentClass(form.status === item.value)"
                  type="button"
                  @click="form.status = item.value"
                >
                  {{ item.label }}
                </button>
              </div>
            </div>

            <template v-if="form.status">
              <div class="rounded-xl border border-border bg-input/70 p-4">
                <div
                  class="flex items-center gap-2 text-xs font-medium text-surface"
                >
                  <Globe class="size-4 text-muted" />
                  <span>公开访问链接</span>
                </div>
                <p class="mt-1 text-xs leading-5 text-muted">
                  当前使用本地可访问的 `share` 路由作为演示链接。
                </p>

                <textarea
                  v-model="form.href"
                  class="mt-3 min-h-24 w-full rounded-lg border border-border bg-panel px-3 py-2 text-xs leading-5 text-surface outline-none"
                  readonly
                  rows="3"
                />

                <div class="mt-3 flex flex-wrap gap-2">
                  <button
                    class="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-panel px-3 text-xs font-medium text-surface transition hover:bg-hover"
                    type="button"
                    @click="handleView"
                  >
                    <ExternalLink class="size-4" />
                    <span>查看链接</span>
                  </button>
                  <button
                    class="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-panel px-3 text-xs font-medium text-surface transition hover:bg-hover"
                    type="button"
                    @click="handleCopy"
                  >
                    <Copy class="size-4" />
                    <span>复制链接</span>
                  </button>
                </div>
              </div>

              <div class="grid gap-2">
                <span class="text-xs font-medium text-muted">访问权限</span>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    v-for="item in permissionOptions"
                    :key="String(item.value)"
                    :class="segmentClass(form.enablePermission === item.value)"
                    type="button"
                    @click="form.enablePermission = item.value"
                  >
                    {{ item.label }}
                  </button>
                </div>
              </div>

              <label v-if="form.enablePermission" class="grid gap-2">
                <span
                  class="inline-flex items-center gap-2 text-xs font-medium text-muted"
                >
                  <Lock class="size-4" />
                  <span>访问密码</span>
                </span>
                <input
                  v-model="form.password"
                  class="h-10 rounded-lg border border-border bg-input px-3 text-sm text-surface transition outline-none placeholder:text-muted focus:border-accent"
                  placeholder="输入访问密码"
                  type="password"
                />
              </label>
            </template>
          </div>
        </section>

        <section class="rounded-xl border border-border bg-canvas/40 p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="text-sm font-semibold text-surface">版本记录</h3>
              <p class="mt-1 text-xs leading-5 text-muted">
                旧版注入式版本面板先收敛成纯展示壳，后续再接真实版本源。
              </p>
            </div>
            <span
              class="inline-flex min-h-7 items-center rounded-full border border-border bg-input px-2.5 text-[11px] text-muted"
            >
              Mock
            </span>
          </div>

          <div class="mt-4 grid gap-3">
            <button
              v-for="item in mockVersions"
              :key="item.id"
              type="button"
              class="rounded-xl border p-4 text-left transition"
              :class="
                item.current
                  ? 'border-accent bg-accent/10'
                  : 'border-border bg-input/60 hover:bg-hover'
              "
              @click="selectVersion(item.id)"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex min-h-7 items-center rounded-full border border-border bg-panel px-2.5 text-[11px] font-semibold text-surface"
                  >
                    v{{ item.version }}
                  </span>
                  <span class="text-xs text-muted">{{ item.createTime }}</span>
                </div>
                <span
                  v-if="item.current"
                  class="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300"
                >
                  <Check class="size-3.5" />
                  <span>当前版本</span>
                </span>
              </div>
              <p class="mt-3 text-xs leading-5 text-muted">
                {{ item.description }}
              </p>
            </button>
          </div>
        </section>
      </div>

      <div
        class="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p class="text-xs leading-5 text-muted">
          当前弹窗只还原新的视觉结构，真实发布与版本管理后续再接回。
        </p>
        <div class="flex flex-wrap items-center justify-end gap-2">
          <button
            class="inline-flex min-h-9 items-center justify-center rounded-lg border border-border bg-input px-4 text-sm font-medium text-surface transition hover:bg-hover"
            type="button"
            @click="visible = false"
          >
            取消
          </button>
          <button
            class="inline-flex min-h-9 items-center justify-center rounded-lg border border-accent bg-accent px-4 text-sm font-medium text-white transition hover:opacity-90"
            type="button"
            @click="handleSubmit"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  </TopToolbarDialog>
</template>
