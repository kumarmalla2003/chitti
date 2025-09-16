// frontend/src/services/authService.js

const API_URL = "http://127.0.0.1:8000/auth"; // Your FastAPI server URL

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

export const login = async (phoneNumber, pin) => {
  // The backend expects 'application/x-www-form-urlencoded' for OAuth2PasswordRequestForm
  const formData = new URLSearchParams();
  formData.append("username", phoneNumber); // Mapped to phone_number
  formData.append("password", pin); // Mapped to pin

  const response = await fetch(`${API_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
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

  const data = await response.json();
  return data.access_token;
};
