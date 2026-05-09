const {
  countPendingOrders,
  createSupabaseAdminClient,
  getNextPendingOrder,
  getOrderItems,
  markOrderFailed,
  markOrderPrinted,
  resetFailedOrders,
} = require("./supabase.cjs");
const { printOrderInvoice, printTestInvoice } = require("./printer.cjs");

function createWatcher({ BrowserWindow, getSettings, onStateChange }) {
  const state = {
    connected: false,
    running: false,
    busy: false,
    pendingCount: 0,
    lastPrintedOrderCode: "",
    lastPrintedAt: "",
    lastError: "",
  };

  let timer = null;
  let processing = false;

  function emit() {
    onStateChange({ ...state });
  }

  async function refreshPendingCount(client) {
    state.pendingCount = await countPendingOrders(client);
  }

  async function processNextJob() {
    if (!state.running || processing) {
      return;
    }

    processing = true;
    state.busy = true;
    emit();
    let currentOrder = null;

    try {
      const settings = getSettings();
      const client = createSupabaseAdminClient(settings);
      await refreshPendingCount(client);
      const order = await getNextPendingOrder(client);
      currentOrder = order;

      state.connected = true;
      state.lastError = "";

      if (!order) {
        state.busy = false;
        emit();
        return;
      }

      const items = await getOrderItems(client, order.id);
      await printOrderInvoice(BrowserWindow, {
        order,
        items,
        settings,
      });

      const printedAt = await markOrderPrinted(client, order.id);
      state.lastPrintedOrderCode = order.order_code;
      state.lastPrintedAt = printedAt;
      await refreshPendingCount(client);
    } catch (error) {
      state.lastError = error instanceof Error ? error.message : "تعذر تنفيذ الطباعة.";

      try {
        const settings = getSettings();
        const client = createSupabaseAdminClient(settings);
        if (currentOrder) {
          await markOrderFailed(client, currentOrder);
          await refreshPendingCount(client);
        }
      } catch {
        state.connected = false;
      }
    } finally {
      processing = false;
      state.busy = false;
      emit();
    }
  }

  function schedule() {
    clearInterval(timer);
    const settings = getSettings();
    timer = setInterval(() => {
      void processNextJob();
    }, settings.pollIntervalMs);
  }

  async function start() {
    if (state.running) {
      return state;
    }

    state.running = true;
    emit();
    schedule();
    await processNextJob();
    return state;
  }

  async function stop() {
    state.running = false;
    clearInterval(timer);
    timer = null;
    emit();
    return state;
  }

  async function testPrinter() {
    const settings = getSettings();
    await printTestInvoice(BrowserWindow, settings);
    state.lastError = "";
    emit();
  }

  async function retryFailed() {
    const settings = getSettings();
    const client = createSupabaseAdminClient(settings);
    await resetFailedOrders(client);
    await refreshPendingCount(client);
    state.lastError = "";
    emit();
    await processNextJob();
  }

  async function refreshConnection() {
    try {
      const settings = getSettings();
      const client = createSupabaseAdminClient(settings);
      await refreshPendingCount(client);
      state.connected = true;
      state.lastError = "";
    } catch (error) {
      state.connected = false;
      state.lastError = error instanceof Error ? error.message : "تعذر الاتصال.";
    }

    emit();
  }

  function dispose() {
    clearInterval(timer);
  }

  return {
    start,
    stop,
    testPrinter,
    retryFailed,
    refreshConnection,
    getState: () => ({ ...state }),
    dispose,
  };
}

module.exports = {
  createWatcher,
};
