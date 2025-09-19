export const updateCache = (cacheName: string, url: string, data: any) => {
  navigator.serviceWorker.ready.then((registration) => {
    registration.active?.postMessage({
      type: 'UPDATE_CACHE',
      payload: {
        cacheName,
        url,
        data,
      },
    });
  });
};
