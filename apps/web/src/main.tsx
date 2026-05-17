import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { Toaster } from "./components/ui/toaster.js";
import { queryClient } from "./lib/query-client.js";
import { router } from "./router.js";
import "./styles.css";

const root = document.getElementById("root");

if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
    <Toaster />
  </QueryClientProvider>
);
