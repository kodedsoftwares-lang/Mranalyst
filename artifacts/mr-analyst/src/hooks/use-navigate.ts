// Simple navigation helper (used inside non-component contexts)
export function useNavigate() {
  return (path: string) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
}
