export function useNotifications() {
  return {
    hasPermission: false,
    isEnabled: false,
    isLoading: false,
    enable: async () => false,
    disable: async () => {},
    toggle: async (_val: boolean) => false,
  };
}
