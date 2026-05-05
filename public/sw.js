self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};

  try {
    data = event.data.json();
  } catch {
    data = {
      title: "إشعار جديد",
      body: event.data.text(),
    };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "إشعار جديد", {
      body: data.body || "",
      icon: data.icon || "/icon-192.png",
      badge: data.badge || "/icon-192.png",
      data: {
        url: data.url || "/",
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
  );
});