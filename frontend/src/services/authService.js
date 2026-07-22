import API_BASE_URL from '../config/apiConfig';

// ===== Token Management =====
export const getToken = () => {
  return localStorage.getItem("token");
};

export const setToken = (token) => {
  localStorage.setItem("token", token);
};

export const removeToken = () => {
  localStorage.removeItem("token");
};

// ===== Shop Management =====
export const getShopId = () => {
  return new URLSearchParams(window.location.search).get("shopId") || localStorage.getItem("shopId") || "";
};

// ===== User Management =====
export const getUser = () => {
  const userJson = localStorage.getItem("user");
  return userJson ? JSON.parse(userJson) : null;
};

export const setUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};

export const removeUser = () => {
  localStorage.removeItem("user");
};

// ===== Handle 401 Unauthorized =====
export const handleUnauthorized = () => {
  console.warn("[User] 401 Unauthorized — session expired, redirecting to login");
  removeToken();
  removeUser();
  const shopId = getShopId();
  window.location.href = shopId ? `/?shopId=${shopId}` : "/";
};

// ===== API Helper with Token =====
/**
 * Generic fetch wrapper for CMES API calls.
 * Automatically injects the shopId header/query and handles token injection and auth failures.
 * 
 * @param {string} endpoint - API path (e.g. '/api/auth/profile')
 * @param {Object} options - Standard fetch options + custom options
 * @param {boolean} options.skipRedirect - If true, does not redirect to login on 401
 */
export const apiCall = async (endpoint, options = {}) => {
  const { skipRedirect = false, ...fetchOptions } = options;
  const token = getToken();
  const shopId = getShopId();
  const headers = {
    "Content-Type": "application/json",
    "x-shop-id": shopId,
    ...fetchOptions.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const urlSeparator = endpoint.includes('?') ? '&' : '?';
  const response = await fetch(`${API_BASE_URL}${endpoint}${urlSeparator}shopId=${shopId}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();
  if (response.status === 401 && !skipRedirect) {
    handleUnauthorized();
    throw new Error("Session expired");
  }
  if (!response.ok) {
    throw new Error(data.message || "API call failed");
  }
  return data;
};

// ===== Authentication Calls =====
export const registerUser = async (username, email, password) => {
  return apiCall("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
    skipRedirect: true,
  });
};

export const loginUser = async (email, password) => {
  return apiCall("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipRedirect: true,
  });
};

export const logoutUser = async () => {
  try {
    await apiCall("/api/auth/logout", {
      method: "POST",
      skipRedirect: true,
    });
  } catch (err) {
    console.warn("[Auth] Logout API call failed, clearing local token anyway:", err.message);
  }
  removeToken();
  removeUser();
};

export const verifyToken = async (token) => {
  return apiCall("/api/auth/verify-token", {
    method: "POST",
    body: JSON.stringify({ token }),
    skipRedirect: true,
  });
};

export const getUserProfile = async () => {
  const token = getToken();
  if (!token) {
    throw new Error("No token found");
  }
  return apiCall("/api/auth/profile", {
    method: "GET",
  });
};

export const updateUserProfile = async (updates) => {
  const token = getToken();
  if (!token) {
    throw new Error("No token found");
  }
  return apiCall("/api/auth/profile", {
    method: "PUT",
    body: JSON.stringify(updates),
  });
};

// ===== Check Authentication =====
export const isAuthenticated = () => {
  return !!getToken();
};

export const checkAuthStatus = async () => {
  try {
    const token = getToken();
    if (!token) return false;

    const data = await verifyToken(token);
    return data.success;
  } catch (error) {
    console.error("Auth check failed:", error);
    if (error.message && (error.message.includes("Invalid") || error.message.includes("expired") || error.message.includes("No token"))) {
      removeToken();
      removeUser();
    }
    return false;
  }
};

export const initializeAuth = async () => {
  try {
    const token = getToken();
    if (!token) {
      return null;
    }

    const shopId = getShopId();
    const response = await fetch(`${API_BASE_URL}/api/auth/profile?shopId=${shopId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-shop-id": shopId,
      },
    });

    if (response.status === 401) {
      console.warn("[Auth] Token invalid (401), removing token");
      removeToken();
      removeUser();
      return null;
    }

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.user) {
        setUser(data.user);
        return data.user;
      }
    }

    console.warn("[Auth] initializeAuth: non-401 error, keeping token. Status:", response.status);
    return null;
  } catch (error) {
    console.warn("[Auth] initializeAuth network error, keeping token:", error.message);
    return null;
  }
};

export default initializeAuth;

// ===== Toast Notification Trigger =====
export const showToast = (message, type = 'success') => {
  const event = new CustomEvent('show-toast', {
    detail: { message, type }
  });
  window.dispatchEvent(event);
};
