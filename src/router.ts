import { createRouter, createWebHistory } from "vue-router";

import EditorView from "./views/EditorView.vue";
import PreviewView from "@/views/PreviewView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: EditorView },
    { path: "/demo", component: EditorView, meta: { demo: true } },
    { path: "/share/:roomId", component: EditorView },
    { path: "/preview", component: PreviewView },
  ],
});

export default router;
