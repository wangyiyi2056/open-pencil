<template>
  <!-- 自定义对话框容器 -->
  <div
    v-if="visible"
    class="smart-fill-dialog-overlay"
    @mousedown="handleOverlayMouseDown"
  >
    <div
      ref="dialogRef"
      :class="dialogClass"
      :style="dialogStyle"
      @mousedown="handleDialogMouseDown"
    >
      <!-- 对话框头部 -->
      <div class="dialog-header" @mousedown="handleHeaderMouseDown">
        <div class="header-tabs">
          <div
            class="tab-item"
            :class="{ active: activeTab === 'text' }"
            @click="activeTab = 'text'"
          >
            文本填充
          </div>
          <div
            class="tab-item"
            :class="{ active: activeTab === 'image' }"
            @click="activeTab = 'image'"
          >
            图片填充
          </div>
        </div>
        <button type="button" class="close-btn" @click="handleClose">✕</button>
      </div>

      <!-- 内容区域添加滚动容器 -->
      <div class="dialog-content-wrapper">
        <!-- 文本填充内容 -->
        <div v-if="activeTab === 'text'" class="fill-content">
          <div class="keyword-section">
            <div class="section-header">
              <span class="section-title1">AI填充</span>
            </div>
            <div class="keyword-input-area">
              <div class="input-wrapper">
                <input
                  v-model="aiPrompt"
                  placeholder="输入文本关键词"
                  class="keyword-input"
                  @keyup.enter="handleAiFill"
                  :disabled="isAiLoading"
                />
                <button
                  type="button"
                  class="send-arrow-btn1"
                  :disabled="!aiPrompt.trim() || isAiLoading"
                  @click="handleAiFill"
                >
                  <ArrowRight class="size-4 text-white" />
                </button>
              </div>
            </div>
          </div>
          <!-- 预设填充 -->
          <div class="preset-section">
            <div class="preset-items">
              <div
                v-for="category in presetCategories"
                :key="category.id"
                class="preset-category"
              >
                <!-- 分类标题行 -->
                <div
                  class="preset-row"
                  :class="{ 'has-selection': hasSelectedOption(category.id) }"
                >
                  <div class="row-left" @click="fillWithCategory(category)">
                    <span class="category-icon">{{ category.icon }}</span>
                    <div class="row-content">
                      <span class="row-title">{{ category.title }}</span>
                      <!-- 显示选中的语言选项 -->
                      <div
                        v-if="hasSelectedOption(category.id)"
                        class="selected-language"
                      >
                        {{ getSelectedOptionText(category.id) }}
                      </div>
                    </div>
                  </div>
                  <div class="row-right">
                    <!-- 三个点的下拉按钮 -->
                    <DropdownMenuRoot>
                      <DropdownMenuTrigger as-child>
                        <button
                          type="button"
                          class="more-options-btn"
                          @click.stop
                        >
                          ⋯
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuContent
                          class="smart-fill-dropdown"
                          side="bottom"
                          align="start"
                          :side-offset="6"
                        >
                          <DropdownMenuItem
                            v-for="option in category.options"
                            :key="option.value"
                            class="smart-fill-dropdown-item"
                            :class="{
                              'is-selected': isOptionSelected(
                                category.id,
                                option,
                              ),
                            }"
                            @select="handleLanguageSelect(category, option)"
                          >
                            <div class="dropdown-option">
                              <span>{{ option.label }}</span>
                              <span
                                v-show="isOptionSelected(category.id, option)"
                                class="check-icon"
                              >
                                ✓
                              </span>
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenuPortal>
                    </DropdownMenuRoot>
                  </div>
                </div>

                <!-- 下拉选项 -->
                <div
                  v-show="expandedCategory === category.id"
                  class="preset-options"
                >
                  <div
                    v-for="option in category.options"
                    :key="option.value"
                    class="preset-option"
                    :class="{ selected: isOptionSelected(category.id, option) }"
                    @click="selectOption(category, option)"
                  >
                    <span class="option-label">{{ option.label }}</span>
                    <span
                      class="check-icon"
                      v-show="isOptionSelected(category.id, option)"
                    >
                      ✓
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 图片填充内容 -->
        <div v-if="activeTab === 'image'" class="fill-content">
          <!-- 关键词填充 -->
          <div class="keyword-section">
            <div class="section-header">
              <span class="section-title2">关键词填充</span>
            </div>
            <div class="keyword-input-area">
              <div class="input-wrapper">
                <input
                  v-model="imageKeyword"
                  placeholder="输入图片关键词"
                  class="keyword-input"
                  @keyup.enter="handleKeywordImageFill"
                  :disabled="isImageGenerating"
                />
                <button
                  type="button"
                  class="send-arrow-btn2"
                  :disabled="!imageKeyword.trim() || isImageGenerating"
                  @click="handleKeywordImageFill"
                >
                  <ArrowRight class="size-4 text-white" />
                </button>
              </div>
            </div>
          </div>

          <!-- 预设填充 -->
          <div class="image-preset-section">
            <div class="image-categories">
              <!-- 人物 -->
              <div
                class="image-row"
                @click="fillImageWithType('people', '人物')"
              >
                <div class="row-left">
                  <span class="category-icon">👤</span>
                  <span class="row-title">人物</span>
                </div>
                <div class="row-right">
                  <div class="category-preview-images">
                    <div
                      class="preview-image"
                      style="
                        background-image: url(&quot;https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face&quot;);
                        background-size: cover;
                        background-position: center;
                        border-radius: 50%;
                      "
                    ></div>
                    <div
                      class="preview-image"
                      style="
                        background-image: url(&quot;https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face&quot;);
                        background-size: cover;
                        background-position: center;
                        border-radius: 50%;
                      "
                    ></div>
                    <div
                      class="preview-image"
                      style="
                        background-image: url(&quot;https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face&quot;);
                        background-size: cover;
                        background-position: center;
                        border-radius: 50%;
                      "
                    ></div>
                  </div>
                  <je-icon
                    v-if="isImageGenerating"
                    name="ri-loader-4-line"
                    class="loading-icon"
                  />
                </div>
              </div>

              <!-- 动物 -->
              <div
                class="image-row"
                @click="fillImageWithType('animals', '动物')"
              >
                <div class="row-left">
                  <span class="category-icon">🐻</span>
                  <span class="row-title">动物</span>
                </div>
                <div class="row-right">
                  <div class="category-preview-images">
                    <div
                      class="preview-image"
                      style="
                        background-image: url(&quot;https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=100&h=100&fit=crop&quot;);
                        background-size: cover;
                        background-position: center;
                        border-radius: 8px;
                      "
                    ></div>
                    <div
                      class="preview-image"
                      style="
                        background-image: url(&quot;https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=100&h=100&fit=crop&quot;);
                        background-size: cover;
                        background-position: center;
                        border-radius: 8px;
                      "
                    ></div>
                    <div
                      class="preview-image"
                      style="
                        background-image: url(&quot;https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=100&h=100&fit=crop&quot;);
                        background-size: cover;
                        background-position: center;
                        border-radius: 8px;
                      "
                    ></div>
                  </div>
                  <je-icon
                    v-if="isImageGenerating"
                    name="ri-loader-4-line"
                    class="loading-icon"
                  />
                </div>
              </div>

              <!-- 科技 -->
              <div
                class="image-row"
                @click="fillImageWithType('technology', '科技')"
              >
                <div class="row-left">
                  <span class="category-icon">💻</span>
                  <span class="row-title">科技</span>
                </div>
                <div class="row-right">
                  <div class="category-preview-images">
                    <div
                      class="preview-image"
                      style="
                        background-image: url(&quot;https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=100&h=100&fit=crop&quot;);
                        background-size: cover;
                        background-position: center;
                        border-radius: 6px;
                      "
                    ></div>
                    <div
                      class="preview-image"
                      style="
                        background-image: url(&quot;https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop&quot;);
                        background-size: cover;
                        background-position: center;
                        border-radius: 6px;
                      "
                    ></div>
                    <div
                      class="preview-image"
                      style="
                        background-image: url(&quot;https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=100&h=100&fit=crop&quot;);
                        background-size: cover;
                        background-position: center;
                        border-radius: 6px;
                      "
                    ></div>
                  </div>
                  <je-icon
                    v-if="isImageGenerating"
                    name="ri-loader-4-line"
                    class="loading-icon"
                  />
                </div>
              </div>

              <!-- 风景 -->
              <div
                class="image-row"
                @click="fillImageWithType('nature', '风景')"
              >
                <div class="row-left">
                  <span class="category-icon">🏞️</span>
                  <span class="row-title">风景</span>
                </div>
                <div class="row-right">
                  <div class="category-preview-images">
                    <div
                      class="preview-image"
                      style="
                        background-image: url(&quot;https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop&quot;);
                        background-size: cover;
                        background-position: center;
                        border-radius: 8px;
                      "
                    ></div>
                    <div
                      class="preview-image"
                      style="
                        background-image: url(&quot;https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=100&h=100&fit=crop&quot;);
                        background-size: cover;
                        background-position: center;
                        border-radius: 8px;
                      "
                    ></div>
                    <div
                      class="preview-image"
                      style="
                        background-image: url(&quot;https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=100&h=100&fit=crop&quot;);
                        background-size: cover;
                        background-position: center;
                        border-radius: 8px;
                      "
                    ></div>
                  </div>
                  <je-icon
                    v-if="isImageGenerating"
                    name="ri-loader-4-line"
                    class="loading-icon"
                  />
                </div>
              </div>

              <!-- 美食 -->
              <div class="image-row" @click="fillImageWithType('food', '美食')">
                <div class="row-left">
                  <span class="category-icon">🍰</span>
                  <span class="row-title">美食</span>
                </div>
                <div class="row-right">
                  <div class="category-preview-images">
                    <div
                      class="preview-image"
                      style="
                        background-image: url(&quot;https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop&quot;);
                        background-size: cover;
                        background-position: center;
                        border-radius: 8px;
                      "
                    ></div>
                    <div
                      class="preview-image"
                      style="
                        background-image: url(&quot;https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=100&h=100&fit=crop&quot;);
                        background-size: cover;
                        background-position: center;
                        border-radius: 8px;
                      "
                    ></div>
                    <div
                      class="preview-image"
                      style="
                        background-image: url(&quot;https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=100&h=100&fit=crop&quot;);
                        background-size: cover;
                        background-position: center;
                        border-radius: 8px;
                      "
                    ></div>
                  </div>
                  <je-icon
                    v-if="isImageGenerating"
                    name="ri-loader-4-line"
                    class="loading-icon"
                  />
                </div>
              </div>

              <!-- 建筑 -->
              <div
                class="image-row"
                @click="fillImageWithType('architecture', '建筑')"
              >
                <div class="row-left">
                  <span class="category-icon">🏢</span>
                  <span class="row-title">建筑</span>
                </div>
                <div class="row-right">
                  <div class="category-preview-images">
                    <div
                      class="preview-image"
                      style="
                        background-image: url(&quot;https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=100&h=100&fit=crop&quot;);
                        background-size: cover;
                        background-position: center;
                        border-radius: 6px;
                      "
                    ></div>
                    <div
                      class="preview-image"
                      style="
                        background-image: url(&quot;https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop&quot;);
                        background-size: cover;
                        background-position: center;
                        border-radius: 6px;
                      "
                    ></div>
                    <div
                      class="preview-image"
                      style="
                        background-image: url(&quot;https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=100&h=100&fit=crop&quot;);
                        background-size: cover;
                        background-position: center;
                        border-radius: 6px;
                      "
                    ></div>
                  </div>
                  <je-icon
                    v-if="isImageGenerating"
                    name="ri-loader-4-line"
                    class="loading-icon"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 闭合 dialog-content-wrapper -->
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
  import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuRoot,
    DropdownMenuTrigger,
  } from "reka-ui";
  import ArrowRight from "~icons/lucide/arrow-right";
  import { toast } from "@/utils/toast";
  import { useEditor } from "@/hooks/editor/useEditor";
  import {
    generateRandomName,
    generateRandomContent,
  } from "@/utils/nameGenerator";
  import {
    generateImageForComponent,
    getAvailableImageUrl,
  } from "@/utils/imageGenerator";
  import { deepSeekService } from "@/services/deepseekService";
  import { huggingFaceService } from "@/services/huggingFaceService";
  import { pollinationsService } from "@/services/pollinationsService";
  import * as unsplashService from "@/services/unsplashService";
  import { generateNodeId } from "@/utils/utils";

  interface Props {
    modelValue: boolean;
  }

  interface Emits {
    (e: "update:modelValue", value: boolean): void;
  }

  interface PresetOption {
    label: string;
    value: string;
  }

  interface PresetCategory {
    id: string;
    icon: string;
    title: string;
    description: string;
    options: PresetOption[];
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  // 使用编辑器hooks
  const { selection, layer } = useEditor();

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
  });

  const activeTab = ref<"text" | "image">("text");
  const aiPrompt = ref("");
  const imageKeyword = ref("");
  const expandedCategory = ref<string | null>(null);
  const isAiLoading = ref(false); // AI填充加载状态
  const isImageGenerating = ref(false); // 图片生成加载状态

  // 对话框相关状态
  const dialogRef = ref<HTMLElement>();
  const isDragging = ref(false);
  const dragOffset = ref({ x: 0, y: 0 });
  const dialogPosition = ref({ x: 0, y: 0 });

  // 选中的选项
  const selectedOptions = ref<Map<string, PresetOption>>(new Map());

  // 预设填充数据
  const presetCategories = ref<PresetCategory[]>([
    {
      id: "name",
      icon: "👤",
      title: "人名",
      description: "中文",
      options: [
        { label: "中文", value: "chinese_name" },
        { label: "英文", value: "english_name" },
        { label: "日文", value: "japanese_name" },
        { label: "昵称", value: "nickname" },
      ],
    },
    {
      id: "city",
      icon: "🏙️",
      title: "城市",
      description: "中文",
      options: [
        { label: "中文", value: "city_chinese" },
        { label: "英文", value: "city_english" },
        { label: "日文", value: "city_japanese" },
      ],
    },
    {
      id: "company",
      icon: "🏢",
      title: "公司",
      description: "中文",
      options: [
        { label: "中文", value: "company_chinese" },
        { label: "英文", value: "company_english" },
      ],
    },
    {
      id: "product",
      icon: "📦",
      title: "产品",
      description: "中文",
      options: [
        { label: "中文", value: "product_chinese" },
        { label: "英文", value: "product_english" },
      ],
    },
    {
      id: "color",
      icon: "🎨",
      title: "颜色",
      description: "中文",
      options: [
        { label: "中文", value: "color_chinese" },
        { label: "英文", value: "color_english" },
      ],
    },
    {
      id: "number",
      icon: "🔢",
      title: "数字",
      description: "1-100",
      options: [
        { label: "1-100", value: "number_1_100" },
        { label: "1-1000", value: "number_1_1000" },
        { label: "年份", value: "number_year" },
      ],
    },
    {
      id: "date",
      icon: "📅",
      title: "日期",
      description: "2020-2024",
      options: [
        { label: "2020-2024", value: "date_recent" },
        { label: "2010-2020", value: "date_past" },
        { label: "2024-2030", value: "date_future" },
      ],
    },
    {
      id: "contact",
      icon: "📞",
      title: "联系方式",
      description: "邮箱/电话",
      options: [
        { label: "邮箱", value: "email" },
        { label: "电话", value: "phone" },
      ],
    },
  ]);

  const handleClose = () => {
    visible.value = false;
  };

  // 添加拖拽状态的类名
  const dialogClass = computed(() => ({
    "smart-fill-dialog": true,
    dragging: isDragging.value,
  }));

  // 对话框样式计算属性
  const dialogStyle = computed(() => ({
    position: "fixed",
    left: `${dialogPosition.value.x}px`,
    top: `${dialogPosition.value.y}px`,
    zIndex: 9999,
    width: "320px",
  }));

  // 拖拽相关方法
  const handleOverlayMouseDown = (e: MouseEvent) => {
    // 点击遮罩层时不关闭对话框
    e.stopPropagation();
  };

  const handleDialogMouseDown = (e: MouseEvent) => {
    // 阻止事件冒泡到遮罩层
    e.stopPropagation();
  };

  const handleHeaderMouseDown = (e: MouseEvent) => {
    // 只有点击头部才能拖拽
    if (e.target && (e.target as HTMLElement).closest(".close-btn")) {
      return; // 点击关闭按钮时不启动拖拽
    }

    isDragging.value = true;
    const rect = dialogRef.value?.getBoundingClientRect();
    if (rect) {
      dragOffset.value = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return;

    dialogPosition.value = {
      x: e.clientX - dragOffset.value.x,
      y: e.clientY - dragOffset.value.y,
    };
  };

  const handleMouseUp = () => {
    isDragging.value = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // 计算对话框位置
  const calculateDialogPosition = () => {
    const propertiesContainer = document.querySelector(".properties-container");
    const topToolbar = document.querySelector(".top-toolbar");
    if (!propertiesContainer || !topToolbar) {
      return { left: "50%", top: "100px", transform: "translateX(-50%)" };
    }

    // 获取视窗宽度和属性面板宽度
    const viewportWidth = window.innerWidth;
    const propertiesRect = propertiesContainer.getBoundingClientRect();
    const topToolbarRect = topToolbar.getBoundingClientRect();

    // 对话框宽度（与CSS中定义的一致）
    const dialogWidth = 320;

    // 计算对话框的左侧位置
    let leftPosition: number;

    if (propertiesRect.left > dialogWidth + 20) {
      // 如果属性面板左侧有足够空间，放在左侧，让对话框右边缘与属性面板左边缘重合
      leftPosition = propertiesRect.left - dialogWidth;
    } else if (viewportWidth - propertiesRect.right > dialogWidth + 20) {
      // 如果属性面板右侧有足够空间，放在右侧
      leftPosition = propertiesRect.right + 20;
    } else {
      // 否则居中显示
      leftPosition = (viewportWidth - dialogWidth) / 2;
    }

    // 计算对话框的顶部位置
    const topPosition = topToolbarRect.bottom + 20;

    const result = {
      left: `${leftPosition}px`,
      top: `${topPosition}px`,
      transform: "none",
    };

    return result;
  };

  const toggleCategory = (categoryId: string) => {
    expandedCategory.value =
      expandedCategory.value === categoryId ? null : categoryId;
  };

  // 创建新的文本组件
  const createTextComponent = (content: string) => {
    const textConfig = {
      maintype: "common",
      subclass: "basic",
      name: "文本框",
      icon: "icon-text",
      img: "text.svg",
      width: 100,
      height: 50,
      component: "je-text",
      equalProportion: false,
      visible: true,
      type: "single", // ✅ 图层类型
      componentType: "text", // ✅ 业务类型
      data: {
        value: content,
        label: "文本框",
        dataFormatter: "",
        dataHeader: "",
        dataQuery: "",
      },
      style: {
        color: "rgb(16, 16, 16)",
        overflow: "hidden",
        fontFamily: "PingFangSC",
        fontSize: 14,
        fontWeight: "normal",
        fontStyle: "normal",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        letterSpacing: 0,
        lineHeight: 20,
        padding: 0,
        textDecoration: "none",
        borderRadius: 0,
        display: "flex",
        flexDirection: "column",
        textShadow: "none",
        position: "absolute",
        left: 700,
        top: 200,
      },
      eventScript: {
        init: {
          enabled: false,
          scriptCode: "",
          compileCode: "",
          scriptCodeMarkers: [],
          show: true,
        },
        destroy: {
          enabled: false,
          scriptCode: "",
          compileCode: "",
          scriptCodeMarkers: [],
          show: true,
        },
      },
      id: generateNodeId(),
    };

    layer.addLayerTree([textConfig]);
    layer.setComponents(layer.layerTree.value);
    return textConfig.id;
  };

  // 创建新的图片组件
  const createImageComponent = (imageUrl: string) => {
    try {
      // 生成随机位置，避免多个组件重叠
      const randomLeft = 100 + Math.floor(Math.random() * 600); // 100-700之间
      const randomTop = 100 + Math.floor(Math.random() * 400); // 100-500之间

      const imageConfig = {
        maintype: "common",
        subclass: "basic",
        name: "图片",
        icon: "icon-img",
        img: "img.svg",
        component: "je-img",
        equalProportion: false,
        type: "single", // ✅ 图层类型
        componentType: "img", // ✅ 业务类型
        data: {
          value: imageUrl,
          label: "",
          defaultValue: "",
          dataFormatter: "",
          dataHeader: "",
          dataQuery: "",
        },
        style: {
          width: 200,
          height: 100,
          fontSize: 26,
          fontWeight: "normal",
          color: "#ffffff",
          display: "block",
          position: "absolute",
          left: randomLeft,
          top: randomTop,
        },
        eventScript: {
          init: {
            enabled: false,
            scriptCode: "",
            compileCode: "",
            scriptCodeMarkers: [],
            show: true,
          },
          destroy: {
            enabled: false,
            scriptCode: "",
            compileCode: "",
            scriptCodeMarkers: [],
            show: true,
          },
        },
        id: generateNodeId(),
      };

      // 检查layer和layerTree是否可用
      if (!layer || !layer.addLayerTree || !layer.setComponents) {
        throw new Error("图层管理器未初始化");
      }

      layer.addLayerTree([imageConfig]);

      // 尝试设置组件，如果layerTree未初始化则跳过
      try {
        if (layer.layerTree && layer.layerTree.value) {
          layer.setComponents(layer.layerTree.value);
        }
      } catch (setError) {
        console.warn("设置组件时出现警告，但组件已创建:", setError);
      }

      return imageConfig.id;
    } catch (error) {
      console.error("创建图片组件时发生错误:", error);
      throw error;
    }
  };

  const fillWithCategory = (category: PresetCategory) => {
    let selectedIds: string[] = [];
    let selectedLayer: any = null;

    // 获取当前选中的选项，如果没有选中则使用默认选项
    const selectedOption = selectedOptions.value.get(category.id);
    const optionToFill = selectedOption || category.options[0];

    // 根据选项类型生成随机内容
    let fillContent = "";

    if (category.id === "name") {
      // 人名填充
      switch (optionToFill.value) {
        case "chinese_name":
          fillContent = generateRandomName("chinese_name");
          break;
        case "english_name":
          fillContent = generateRandomName("english_name");
          break;
        case "japanese_name":
          fillContent = generateRandomName("japanese_name");
          break;
        case "nickname":
          fillContent = generateRandomName("nickname");
          break;
        default:
          fillContent = generateRandomName("chinese_name");
      }
    } else if (category.id === "city") {
      // 城市填充
      switch (optionToFill.value) {
        case "city_chinese":
          fillContent = generateRandomContent("city", "chinese");
          break;
        case "city_english":
          fillContent = generateRandomContent("city", "english");
          break;
        case "city_japanese":
          fillContent = generateRandomContent("city", "japanese");
          break;
        default:
          fillContent = generateRandomContent("city", "chinese");
      }
    } else if (category.id === "company") {
      // 公司填充
      switch (optionToFill.value) {
        case "company_chinese":
          fillContent = generateRandomContent("company", "chinese");
          break;
        case "company_english":
          fillContent = generateRandomContent("company", "english");
          break;
        default:
          fillContent = generateRandomContent("company", "chinese");
      }
    } else if (category.id === "product") {
      // 产品填充
      switch (optionToFill.value) {
        case "product_chinese":
          fillContent = generateRandomContent("product", "chinese");
          break;
        case "product_english":
          fillContent = generateRandomContent("product", "english");
          break;
        default:
          fillContent = generateRandomContent("product", "chinese");
      }
    } else if (category.id === "color") {
      // 颜色填充
      switch (optionToFill.value) {
        case "color_chinese":
          fillContent = generateRandomContent("color", "chinese");
          break;
        case "color_english":
          fillContent = generateRandomContent("color", "english");
          break;
        default:
          fillContent = generateRandomContent("color", "chinese");
      }
    } else if (category.id === "number") {
      // 数字填充
      switch (optionToFill.value) {
        case "number_1_100":
          fillContent = generateRandomContent("number");
          break;
        case "number_1_1000":
          fillContent = Math.floor(Math.random() * 1000 + 1).toString();
          break;
        case "number_year":
          fillContent = (
            new Date().getFullYear() - Math.floor(Math.random() * 50)
          ).toString();
          break;
        default:
          fillContent = generateRandomContent("number");
      }
    } else if (category.id === "date") {
      // 日期填充
      switch (optionToFill.value) {
        case "date_recent":
          fillContent = generateRandomContent("date");
          break;
        case "date_past":
          const pastStart = new Date(2010, 0, 1);
          const pastEnd = new Date(2020, 11, 31);
          const pastTime =
            pastStart.getTime() +
            Math.random() * (pastEnd.getTime() - pastStart.getTime());
          fillContent = new Date(pastTime).toLocaleDateString("zh-CN");
          break;
        case "date_future":
          const futureStart = new Date(2024, 0, 1);
          const futureEnd = new Date(2030, 11, 31);
          const futureTime =
            futureStart.getTime() +
            Math.random() * (futureEnd.getTime() - futureStart.getTime());
          fillContent = new Date(futureTime).toLocaleDateString("zh-CN");
          break;
        default:
          fillContent = generateRandomContent("date");
      }
    } else if (category.id === "contact") {
      // 联系方式填充
      switch (optionToFill.value) {
        case "email":
          fillContent = generateRandomContent("email");
          break;
        case "phone":
          fillContent = generateRandomContent("phone");
          break;
        default:
          fillContent = generateRandomContent("email");
      }
    } else {
      // 其他类型的填充
      fillContent = `${category.title}示例内容`;
    }

    // 检查是否有选中的元素

    if (!selection.hasSelection.value) {
      // 没有选中元素时，根据填充类型创建新组件
      if (category.id === "image") {
        // 创建图片组件
        const newComponentId = createImageComponent("");
        selectedIds = [newComponentId];
        selectedLayer = layer.getNode(newComponentId);
        toast.show("已创建新的图片组件");
      } else {
        // 创建文本组件，直接使用生成的内容
        const newComponentId = createTextComponent(fillContent);
        selectedIds = [newComponentId];
        selectedLayer = layer.getNode(newComponentId);
        toast.show(`已创建新的文本框组件并填充: ${fillContent}`);
        // 由于创建时已经填充了内容，直接返回
        return;
      }
    } else {
      // 有选中元素时，使用原有逻辑
      selectedIds = selection.selectedIds.value;
      if (selectedIds.length !== 1) {
        toast.show("请选择单个元素", "warning");
        return;
      }

      selectedLayer = layer.getNode(selectedIds[0]);

      if (!selectedLayer) {
        toast.show("未找到选中的元素", "error");
        return;
      }

      // 根据填充类型检查组件类型
      if (category.id === "image") {
        // 图片填充需要图片组件
        if (selectedLayer.component !== "je-img") {
          toast.show("请选择图片组件进行填充", "warning");
          return;
        }
      } else {
        // 其他填充需要文本组件
        if (selectedLayer.component !== "je-text") {
          toast.show("请选择文本框元素进行填充", "warning");
          return;
        }
      }
    }

    // 更新图层内容
    // 修复：更新整个节点对象以确保响应式更新
    const updatedNode = {
      ...selectedLayer,
      data: {
        ...selectedLayer.data,
        value: fillContent,
      },
    };

    layer.updateNode(selectedIds[0], updatedNode);

    toast.show(`已填充: ${fillContent}`);

    // 填充后不关闭对话框，方便连续填充
    // visible.value = false
  };

  const selectOption = (category: PresetCategory, option: PresetOption) => {
    // 更新选中状态
    selectedOptions.value.set(category.id, option);

    // 收起下拉菜单
    expandedCategory.value = null;

    // 这里可以添加具体的填充逻辑
    // 比如将选项的值填充到当前选中的元素中
  };

  // 检查选项是否被选中
  const isOptionSelected = (categoryId: string, option: PresetOption) => {
    const selectedOption = selectedOptions.value.get(categoryId);
    return selectedOption?.value === option.value;
  };

  // 获取分类的选中选项显示文本
  const getSelectedOptionText = (categoryId: string) => {
    const selectedOption = selectedOptions.value.get(categoryId);
    return selectedOption ? selectedOption.label : "";
  };

  // 检查分类是否有选中的选项
  const hasSelectedOption = (categoryId: string) => {
    return selectedOptions.value.has(categoryId);
  };

  // 处理语言选择
  const handleLanguageSelect = (
    category: PresetCategory,
    option: PresetOption,
  ) => {
    // 更新选中状态
    selectedOptions.value.set(category.id, option);

    toast.show(`已选择${category.title}: ${option.label}`);
  };

  // 图片填充功能 - 预设类别使用Unsplash
  // 图片类型填充功能
  const fillImageWithType = async (imageType: string, typeName: string) => {
    let selectedIds: string[] = [];
    let selectedLayer: any = null;
    let isNewComponent = false;

    // 检查是否有选中的元素
    if (!selection.hasSelection.value) {
      isNewComponent = true;
      toast.show("正在创建新的图片组件并填充内容...");
    } else {
      // 有选中元素时，使用原有逻辑
      selectedIds = selection.selectedIds.value;
      if (selectedIds.length !== 1) {
        toast.show("请选择单个图片组件", "warning");
        return;
      }

      selectedLayer = layer.getNode(selectedIds[0]);
      if (!selectedLayer) {
        toast.show("未找到选中的元素", "error");
        return;
      }

      // 检查是否为图片组件
      if (selectedLayer.component !== "je-img") {
        toast.show("请选择图片组件进行填充", "warning");
        return;
      }
    }

    isImageGenerating.value = true;

    try {
      // 先获取图片URL
      const imageUrl = await unsplashService.getAvailablePhotoUrl(
        imageType,
        200, // 默认宽度
        100, // 默认高度
      );

      // 如果是新组件，现在创建并填充
      if (isNewComponent) {
        try {
          const newComponentId = createImageComponent(imageUrl);
          selectedIds = [newComponentId];
          toast.show(`已创建新的图片组件并填充${typeName}图片`);
        } catch (createError) {
          console.error("创建图片组件失败:", createError);
          toast.show(
            `创建图片组件失败: ${createError.message || "未知错误"}`,
            "error",
          );
          return;
        }
      } else {
        // 更新现有组件的内容
        layer.updateNode(selectedIds[0], {
          data: {
            ...selectedLayer.data,
            value: imageUrl,
          },
        });
        toast.show(`已填充${typeName}图片`);
      }
    } catch (error) {
      console.error("图片填充失败:", error);
      toast.show(`图片填充失败: ${error.message || "请重试"}`, "error");
    } finally {
      isImageGenerating.value = false;
    }
  };

  // AI填充功能
  const handleAiFill = async () => {
    if (!aiPrompt.value.trim()) {
      toast.show("请输入文本描述", "warning");
      return;
    }

    let selectedIds: string[] = [];
    let selectedLayer: any = null;

    // 检查是否有选中的元素
    if (!selection.hasSelection.value) {
      // 没有选中元素时，创建新的文本组件
      const newComponentId = createTextComponent("");
      selectedIds = [newComponentId];
      selectedLayer = layer.getNode(newComponentId);
      toast.show("已创建新的文本框组件");
    } else {
      // 有选中元素时，使用原有逻辑
      selectedIds = selection.selectedIds.value;
      if (selectedIds.length !== 1) {
        toast.show("请选择单个文本元素", "warning");
        return;
      }

      selectedLayer = layer.getNode(selectedIds[0]);
      if (!selectedLayer) {
        toast.show("未找到选中的元素", "error");
        return;
      }

      // 检查是否为文本组件
      if (selectedLayer.component !== "je-text") {
        toast.show("请选择文本组件进行AI填充", "warning");
        return;
      }
    }

    isAiLoading.value = true;

    try {
      // 调用DeepSeek API生成文本
      const generatedText = await deepSeekService.generateText(
        aiPrompt.value.trim(),
      );

      // 更新文本组件的内容
      layer.updateNode(selectedIds[0], {
        data: {
          ...selectedLayer.data,
          value: generatedText,
        },
      });

      toast.show("AI填充成功");

      // 清空输入框
      aiPrompt.value = "";
    } catch (error) {
      console.error("AI填充失败:", error);
      toast.show("AI填充失败，请检查网络连接或稍后重试", "error");
    } finally {
      isAiLoading.value = false;
    }
  };

  // 关键词图片填充功能
  const handleKeywordImageFill = async () => {
    if (!imageKeyword.value.trim()) {
      toast.show("请输入图片关键词", "warning");
      return;
    }

    let selectedIds: string[] = [];
    let selectedLayer: any = null;
    let isNewComponent = false;

    // 检查是否有选中的元素
    if (!selection.hasSelection.value) {
      isNewComponent = true;
      toast.show("正在创建新的图片组件并生成AI图片...");
    } else {
      // 有选中元素时，使用原有逻辑
      selectedIds = selection.selectedIds.value;
      if (selectedIds.length !== 1) {
        toast.show("请选择单个图片组件", "warning");
        return;
      }

      selectedLayer = layer.getNode(selectedIds[0]);
      if (!selectedLayer) {
        toast.show("未找到选中的元素", "error");
        return;
      }

      // 检查是否为图片组件
      if (selectedLayer.component !== "je-img") {
        toast.show("请选择图片组件进行填充", "warning");
        return;
      }
    }

    isImageGenerating.value = true;

    try {
      // 获取组件尺寸，如果是新组件使用默认尺寸
      const width = selectedLayer?.width || 512;
      const height = selectedLayer?.height || 512;

      // 使用 Pollinations AI API 生成图片
      const imageUrl = await pollinationsService.generateImage(
        imageKeyword.value.trim(),
        {
          width,
          height,
          nologo: true,
          enhance: true,
        },
      );

      // 如果是新组件，现在创建并填充
      if (isNewComponent) {
        try {
          const newComponentId = createImageComponent(imageUrl);
          selectedIds = [newComponentId];
          toast.show("已创建新的图片组件并生成AI图片");
        } catch (createError) {
          console.error("创建图片组件失败:", createError);
          toast.show(
            `创建图片组件失败: ${createError.message || "未知错误"}`,
            "error",
          );
          return;
        }
      } else {
        // 更新现有组件的数据
        layer.updateNode(selectedIds[0], {
          data: {
            ...selectedLayer.data,
            value: imageUrl,
          },
        });
        toast.show("AI图片生成成功");
      }

      // 清空输入框
      imageKeyword.value = "";
    } catch (error) {
      console.error("AI图片生成失败:", error);

      // 根据错误类型显示不同的提示信息
      let errorMessage = "AI图片生成失败，请稍后重试";

      if (error instanceof Error) {
        if (error.message.includes("API密钥")) {
          errorMessage = "API密钥无效，请检查配置";
        } else if (error.message.includes("请求过于频繁")) {
          errorMessage = "请求过于频繁，请稍后再试";
        } else if (error.message.includes("模型正在加载")) {
          errorMessage = "模型正在加载中，请稍后再试";
        } else if (error.message.includes("网络")) {
          errorMessage = "网络连接失败，请检查网络连接";
        }
      }

      toast.show(errorMessage, "error");
    } finally {
      isImageGenerating.value = false;
    }
  };

  // 监听对话框显示状态，设置初始位置
  watch(
    () => visible.value,
    (newVal) => {
      if (newVal) {
        nextTick(() => {
          const position = calculateDialogPosition();
          dialogPosition.value = {
            x: parseInt(position.left.replace("px", "")),
            y: parseInt(position.top.replace("px", "")),
          };
        });
      }
    },
  );

  // 清理事件监听器
  onUnmounted(() => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  });
</script>

<style scoped>
  // 对话框遮罩层
  .smart-fill-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 999;
    pointer-events: none; // 让遮罩层不阻止底层交互
  }

  // 自定义对话框样式
  .smart-fill-dialog {
    border-radius: 8px;
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.06),
      0 2px 4px rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.04);
    backdrop-filter: blur(10px);
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.95) 0%,
      rgba(255, 255, 255, 0.9) 100%
    );
    pointer-events: auto; // 恢复对话框的交互
    cursor: default;

    // 拖拽时的样式
    &.dragging {
      user-select: none;

      .dialog-header {
        cursor: grabbing;
      }
    }
  }

  // 对话框头部样式
  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 12px 0;
    background: transparent;
    cursor: grab;
    user-select: none;

    .header-tabs {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 8px;
      background: transparent;
      border-radius: 0;
      padding: 0;
      white-space: nowrap;

      .tab-item {
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 400;
        color: #999;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s ease;
        position: relative;
        background: transparent;
        text-align: center;
        white-space: nowrap;
        flex-shrink: 0;

        &.active {
          color: #333;
          background: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          font-weight: 500;
        }

        &:hover:not(.active) {
          color: #666;
          background: rgba(0, 0, 0, 0.02);
        }
      }
    }

    .close-btn {
      width: 24px;
      height: 24px;
      color: #999;
      font-size: 16px;
      border-radius: 8px;
      transition: all 0.2s ease;
      cursor: pointer;
      &:hover {
        color: #666;
        background: rgba(0, 0, 0, 0.04);
      }
    }
  }

  // 对话框内容区域
  .dialog-content-wrapper {
    padding: 0;
    max-height: 480px;
    overflow-y: auto;
    position: relative; // 为下拉菜单提供定位上下文

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #ddd;
      border-radius: 2px;
    }
  }

  .fill-content {
    padding: 12px;
    animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  // 关键词填充区域
  .keyword-section {
    margin-bottom: 12px;

    .section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 12px;

      .section-title1 {
        font-size: 14px;
        font-weight: 600;
        color: #1a1a1a;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .section-title2 {
        font-size: 14px;
        font-weight: 600;
        color: #1a1a1a;
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }

    .keyword-input-area {
      display: flex;
      gap: 0;
      align-items: stretch;

      .input-wrapper {
        flex: 1;
        position: relative;
        display: flex;
        align-items: center;
        background: #fff;
        border: 1px solid #8b5cf6;
        border-radius: 6px;
        overflow: hidden;
        transition: all 0.2s ease;
        height: 32px;

        &:hover {
          border-color: #a78bfa;
        }

        &:focus-within {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
        }

        .keyword-input {
          flex: 1;
          border: none;
          box-shadow: none;
          background: transparent;
          padding: 0 40px 0 12px;
          height: 30px;
          font-size: 14px;
          color: #333;
          font-weight: 400;
          line-height: 30px;

          &::placeholder {
            color: #bfbfbf;
          }
        }

        .send-arrow-btn1,
        .send-arrow-btn2 {
          position: absolute;
          right: 4px;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #fff;

          &:hover:not(:disabled) {
            background: linear-gradient(135deg, #93c5fd 0%, #1456f0 100%);
          }

          &:disabled {
            background: #d9d9d9;
            cursor: not-allowed;
          }
        }
        .send-arrow-btn2 {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
      }
    }
  }

  // 预设填充区域
  .preset-section {
    .preset-items {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .preset-category {
      border-radius: 0;
      background: transparent;
      border: none;
      transition: all 0.2s ease;

      &:hover {
        border-color: transparent;
      }
    }

    .preset-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      margin: 0 -14px;
      border-bottom: 1px solid #f5f5f5;
      transition: all 0.2s ease;
      cursor: pointer;
      border-radius: 4px;
      &:hover {
        background-color: #f5f5f5;
      }

      &:last-child {
        border-bottom: none;
      }

      &.has-selection {
        background: transparent;

        .row-desc,
        .row-title {
          color: #333;
          font-weight: 500;
        }
      }

      .row-left {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        transition: all 0.2s ease;

        .row-icon,
        .category-icon {
          color: #999;
          font-size: 16px;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .row-content {
          display: flex;
          flex-direction: column;
          gap: 1px;
          flex: 1;
        }

        .row-title {
          font-size: 13px;
          font-weight: 500;
          color: #333;
          line-height: 1.3;
        }

        .selected-language {
          font-size: 11px;
          color: #aaa;
          font-weight: 400;
          background: transparent;
          padding: 0;
          border-radius: 0;
          display: inline-block;
        }
      }

      .row-right {
        display: flex;
        align-items: center;
        gap: 8px;

        .more-options-btn {
          padding: 3px 6px;
          color: #bbb;
          font-size: 14px;
          border: none;
          background: transparent;
          border-radius: 3px;
          transition: all 0.2s ease;

          &:hover {
            background: rgba(0, 0, 0, 0.03);
            color: #999;
          }

          &:focus {
            outline: none;
            box-shadow: none;
          }
        }

        .row-desc {
          font-size: 11px;
          color: #aaa;
          font-weight: 400;
        }

        .expand-icon {
          color: #ddd;
          font-size: 11px;
          transition: transform 0.2s ease;

          &.expanded {
            transform: rotate(180deg);
          }
        }
      }
    }

    .preset-options {
      overflow: hidden;
      background: #fafafa;
      border-top: 1px solid #f0f0f0;
      padding: 8px 0;
      animation: slideDown 0.2s ease-out;

      .preset-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 16px;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
          background-color: #f0f0f0;
        }

        &.selected {
          background-color: #e6f7ff;
          color: #1890ff;
        }

        .option-label {
          font-size: 12px;
          color: #666;
        }

        &.selected .option-label {
          color: #1890ff;
          font-weight: 500;
        }

        .check-icon {
          color: #1890ff;
          font-size: 14px;
        }
      }
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      max-height: 0;
    }
    to {
      opacity: 1;
      max-height: 200px;
    }
  }

  // 图片预设区域
  .image-preset-section {
    .image-categories {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .image-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      margin: 0 -14px;
      border-bottom: 1px solid #f5f5f5;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background-color: #f5f5f5;
      }

      &:last-child {
        border-bottom: none;
      }

      .row-left {
        display: flex;
        align-items: center;
        gap: 10px;

        .category-icon {
          font-size: 16px;
        }

        .row-title {
          font-size: 13px;
          font-weight: 500;
          color: #333;
        }
      }

      .row-right {
        display: flex;
        align-items: center;
        gap: 8px;

        .category-preview-images {
          display: flex;
          gap: 4px;

          .preview-image {
            width: 20px;
            height: 20px;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
              transform: scale(1.1);
            }
          }
        }

        .loading-icon {
          color: #666;
          font-size: 14px;
          animation: spin 1s linear infinite;
        }
      }
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .smart-fill-dropdown {
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border: none;
    padding: 8px 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    z-index: 10000 !important; // 确保下拉菜单显示在最上层
    position: absolute !important; // 使用绝对定位
    max-height: 120px; // 进一步减小最大高度
    overflow-y: auto; // 添加滚动条
    min-width: 100px; // 减小最小宽度
    max-width: 180px; // 减小最大宽度

    // 禁用滚轮事件传播
    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #ddd;
      border-radius: 2px;
    }

  .dropdown-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    .check-icon {
      color: #1890ff;
      font-size: 12px;
    }
  }

  .smart-fill-dropdown-item {
    margin: 2px 8px;
    border-radius: 8px;
    padding: 12px 20px;
    font-size: 13px;
    color: #666;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    outline: none;

    &:hover,
    &[data-highlighted] {
      background: linear-gradient(
        135deg,
        rgba(102, 126, 234, 0.1) 0%,
        rgba(118, 75, 162, 0.1) 100%
      );
      color: #667eea;
      transform: translateX(4px);
    }

    &.is-selected {
      background-color: #e6f7ff;
      color: #1890ff;
    }
  }

  // 全局动画效果
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  // 应用动画到各个组件
  .dialog-header {
    animation: slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .preset-category {
    animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);

    &:nth-child(1) {
      animation-delay: 0.1s;
    }
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation-delay: 0.3s;
    }
    &:nth-child(4) {
      animation-delay: 0.4s;
    }
    &:nth-child(5) {
      animation-delay: 0.5s;
    }
    &:nth-child(6) {
      animation-delay: 0.6s;
    }
    &:nth-child(7) {
      animation-delay: 0.7s;
    }
  }

  // 加载状态动画
  .loading-icon {
    animation: pulse 1.5s infinite;
  }

  // 滚动容器样式
  .dialog-content-wrapper {
    max-height: 400px;
    overflow-y: auto;
    overflow-x: hidden;

    // 自定义滚动条样式
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f5f5f5;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
      transition: background 0.2s ease;

      &:hover {
        background: #a8a8a8;
      }
    }
  }
</style>
