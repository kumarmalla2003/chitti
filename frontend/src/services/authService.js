// frontend/src/services/authService.js

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/auth`;

/**
 * Verifies if a phone number is authorized.
 * @param {string} phoneNumber - The phone number to verify.
 * @returns {Promise<Object>} The response data.
 * @throws {Error} If the phone number is not authorized or an error occurs.
 */
export const verifyPhone = async (phoneNumber) => {
  const response = await fetch(`${API_URL}/verify-phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number: phoneNumber }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("This phone number is not authorized.");
    }
    throw new Error("An unexpected error occurred. Please try again.");
  }

  return response.json();
};

/**
 * Logs in the user with phone number and PIN.
 * Sets the access token in an HttpOnly cookie.
 * @param {string} phoneNumber - The user's phone number.
 * @param {string} pin - The user's PIN.
 * @returns {Promise<boolean>} True if login is successful.
 * @throws {Error} If login fails.
 */
export const login = async (phoneNumber, pin) => {
  // The backend expects 'application/x-www-form-urlencoded' for OAuth2PasswordRequestForm
  const formData = new URLSearchParams();
  formData.append("username", phoneNumber); // Mapped to phone_number
  formData.append("password", pin); // Mapped to pin

  const response = await fetch(`${API_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("The PIN you entered is incorrect.");
    }
    if (response.status === 404) {
      throw new Error("This phone number is not authorized.");
    }
    throw new Error("Login failed. Please try again.");
  }

  // We don't need to return the token anymore as it's in a cookie
  return true;
};

/**
 * Logs out the user.
 * Clears the access token cookie.
 * @returns {Promise<boolean>} True if logout is successful.
 */
export const logout = async () => {
  const response = await fetch(`${API_URL}/logout`, {
    method: "POST",
    credentials: "include",
  });
  return response.ok;
};

/**
 * Fetches the current authenticated user.
 * @returns {Promise<Object>} The user object.
 * @throws {Error} If fetch fails.
 */
export const getCurrentUser = async () => {
  const response = await fetch(`${API_URL}/me`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch current user.");
  }
  return response.json();
};
