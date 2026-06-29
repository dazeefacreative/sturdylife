const apiBase = import.meta.env.VITE_API_URL || "/api";
const backendOrigin = apiBase.replace(/\/api\/?$/, "");

// Product images come back from the API as backend-relative paths like
// "/uploads/abc.jpg". Locally that resolves fine through vite's dev proxy,
// but once the frontend and backend are on different origins (Netlify +
// Railway) it needs the backend's actual origin prefixed on.
export function getImageUrl(path?: string | null) {
  if (!path) return path;
  if (/^https?:\/\//.test(path)) return path;
  return `${backendOrigin}${path}`;
}
