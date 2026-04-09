import { createHead } from "@unhead/vue/client";
import { createApp } from "vue";

import { IS_TAURI } from "@/constants";
import { preloadFonts } from "@/engine/fonts";

import App from "./App.vue";
import router from "./router";

import Tres from "@tresjs/core";
import "@/styles/app.css";

preloadFonts();
const head = createHead();
createApp(App).use(Tres).use(router).use(head).mount("#app");
if (!IS_TAURI) {
  void import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}
