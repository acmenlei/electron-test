import { createApp } from "vue";

import router from "@/router";
import "./style.css";
import App from "./App.vue";
import "./samples/node-api";

createApp(App)
  .use(router)
  .mount("#app")
  .$nextTick(() => {
    postMessage({ payload: "removeLoading" }, "*");
  });
