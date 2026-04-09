<template>
  <div class="version">
    <div class="version-title text-title">版本列表</div>
    <ul v-if="list.length > 0">
      <li
        v-for="item in list"
        :key="item.id"
        class="menu-item"
        :class="{ 'is-active': item.id === activeVersionId }"
        @click="handleSelect(item)"
      >
        <span class="menu-name">v{{ item.version }}</span>
        <div v-if="item.createTime" class="version-datetime">
          {{ item.createTime }}
        </div>
        <button
          class="action-btn action-btn--view"
          type="button"
          @click.stop="handleView(item)"
        >
          查看
        </button>
        <button
          class="action-btn action-btn--import"
          type="button"
          @click.stop="handleImport(item)"
        >
          导入
        </button>
      </li>
    </ul>
    <div v-else class="empty-state">
      <svg-icon icon-class="empty" />
      <span>暂无数据</span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, inject, onMounted, ref } from "vue";
  import { useRouter } from "vue-router";

  import { updateObj } from "@/api/visual";
  import { addObj, getList, getObj } from "@/api/version";
  import { toast } from "@/utils/toast";

  interface VersionItem {
    id: string | number;
    version: string | number;
    createTime?: string;
  }

  interface LegacyContain {
    id?: string | number;
    visual?: {
      id?: string | number;
      version?: string | number;
    };
    config?: unknown;
    nav?: unknown;
  }

  const contain = inject<LegacyContain | null>("contain", null);
  const parent = inject<Record<string, unknown> | null>("parent", null);
  const router = useRouter();

  const list = ref<VersionItem[]>([]);
  const activeVersionId = computed(() => contain?.visual?.version ?? null);

  onMounted(() => {
    void refreshList();
  });

  async function refreshList() {
    if (!contain?.id) return;
    const response = await getList({
      currentPage: 1,
      pageSize: 99999,
      visualId: contain.id,
    });
    list.value = response.data.data.list ?? [];
  }

  async function handleSelect(item: VersionItem) {
    if (!contain?.visual?.id) return;
    if (!window.confirm(`是否选中当前【v${item.version}】版本?`)) return;

    contain.visual.version = item.id;
    await updateObj({
      id: contain.visual.id,
      version: item.id,
    });
    toast.show(`【v${item.version}】版本发布成功`);
  }

  function handleView(item: VersionItem) {
    if (!contain?.id) return;
    const routeUrl = router.resolve({
      path: `/view/${contain.id}`,
      query: { v: item.id },
    });
    window.open(routeUrl.href, "_blank");
  }

  async function handleImport(item: VersionItem) {
    if (!window.confirm(`是加载当前【v${item.version}】版本?`)) return;

    const response = await getObj(item.id);
    const data = JSON.parse(response.data.data.data);
    if (contain) {
      contain.config = data.detail;
      contain.nav = data.component;
    }
    if (parent && "box" in parent) {
      parent.box = false;
    }
    toast.show(`【v${item.version}】版本导入成功`);
  }

  async function handleAdd() {
    if (!contain?.id) return;
    const content = {
      detail: contain.config,
      component: contain.nav,
    };
    await addObj({
      version: list.value.length + 1,
      visualId: contain.id,
      data: JSON.stringify(content),
    });
    toast.show("版本发布成功");
    await refreshList();
  }

  defineExpose({ handleAdd });
</script>

<style scoped>
  .version {
    flex: 1;
    padding: 8px 0 0 12px;
    min-height: 300px;
    overflow-y: auto;
    border-left: 1px solid var(--color-border-editor);
  }

  .version-title {
    margin-bottom: 10px;
  }

  .version-datetime {
    display: inline-block;
    flex: 1;
    margin: 0 10px;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .menu-item {
    display: flex;
    align-items: center;
    padding: 5px 10px;
    list-style: none;
    margin-bottom: 10px;
    cursor: pointer;
    border-radius: 6px;

    &.is-active {
      border: 1px solid var(--color-background-groups);
      background-color: var(--color-background-views-hover);
    }
  }

  .menu-name {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    border-radius: 999px;
    background: var(--color-gray-100);
    padding: 2px 8px;
    font-size: 12px;
    color: var(--color);
  }

  .action-btn {
    border: 0;
    border-radius: 6px;
    padding: 6px 8px;
    font-size: 12px;
    color: white;
  }

  .action-btn--view {
    background: #2563eb;
  }

  .action-btn--import {
    margin-left: 6px;
    background: #16a34a;
  }

  .empty-state {
    display: flex;
    min-height: 180px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--color-gray-500);
    font-size: 13px;
  }
</style>
