"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import type { CustomerNotificationRecord } from "@/lib/shop-types";

const STORAGE_KEY = "ajn-seen-customer-notifications";

export function CustomerNotificationBridge() {
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        seenRef.current = new Set(JSON.parse(raw) as string[]);
      }
    } catch {
      seenRef.current = new Set();
    }

    let cancelled = false;

    const loadNotifications = async () => {
      try {
        const response = await fetch("/api/account/notifications?unread=1", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { notifications?: CustomerNotificationRecord[] };
        const notifications = payload.notifications ?? [];
        const fresh = notifications.filter((item) => !seenRef.current.has(item.id));

        if (!fresh.length || cancelled) {
          return;
        }

        if ("Notification" in window && Notification.permission === "default") {
          void Notification.requestPermission();
        }

        fresh.forEach((item) => {
          toast.message(item.title, {
            description: item.body,
          });

          if ("Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(item.title, {
                body: item.body,
              });
            } catch {
              // Ignore browser notification failures and keep in-app notifications.
            }
          }

          seenRef.current.add(item.id);
        });

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...seenRef.current]));
      } catch {
        // Ignore polling errors to avoid disrupting the session.
      }
    };

    void loadNotifications();
    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 25000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
