import type { OrderRecord } from "@/lib/types";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

async function sendBroadcast(
  channelName: string,
  payload: Record<string, unknown>,
) {
  const supabase = createServiceSupabaseClient();
  const channel = supabase.channel(channelName, {
    config: {
      broadcast: {
        ack: false,
        self: false,
      },
    },
  });

  try {
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 2200);

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(timeout);

          try {
            await channel.send({
              type: "broadcast",
              event: "updated",
              payload,
            });
          } finally {
            resolve();
          }
        }

        if (status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
          clearTimeout(timeout);
          resolve();
        }
      });
    });
  } finally {
    await supabase.removeChannel(channel);
  }
}

export async function broadcastOrderUpdate(order: OrderRecord) {
  const timestamp = new Date().toISOString();

  await Promise.allSettled([
    sendBroadcast("ajn-orders", {
      orderId: order.id,
      orderCode: order.order_code,
      status: order.status,
      timestamp,
    }),
    sendBroadcast(`ajn-order-${order.id}`, {
      order,
      timestamp,
    }),
  ]);
}

export async function broadcastOrdersRefresh(reason = "sync") {
  await Promise.allSettled([
    sendBroadcast("ajn-orders", {
      reason,
      timestamp: new Date().toISOString(),
    }),
  ]);
}

