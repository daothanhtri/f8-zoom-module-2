export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const isValidPassword = (password) => {
  // Minimum 6 characters, at least one uppercase letter, one lowercase letter, and one number
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/;
  return re.test(password);
};

export const validateForm = (formElement, fieldsConfig) => {
  let isValid = true;
  const errors = {};

  formElement.querySelectorAll(".form-group").forEach((group) => {
    const fieldName = group.dataset.field;
    const input = group.querySelector(".form-input");
    const errorMessageElement = group.querySelector(".error-message span");

    if (!fieldName || !input || !errorMessageElement) return;

    const config = fieldsConfig[fieldName];
    let fieldIsValid = true;
    let errorMessage = "";

    if (config.required && !input.value.trim()) {
      fieldIsValid = false;
      errorMessage = config.messages.required;
    } else if (config.type === "email" && !isValidEmail(input.value)) {
      fieldIsValid = false;
      errorMessage = config.messages.invalidEmail;
    } else if (config.type === "password" && !isValidPassword(input.value)) {
      fieldIsValid = false;
      errorMessage = config.messages.invalidPassword;
    } else if (config.type === "confirmPassword") {
      const passwordInput = formElement.querySelector(
        config.matchFieldSelector
      );
      if (input.value !== passwordInput.value) {
        fieldIsValid = false;
        errorMessage = config.messages.mismatch;
      }
    }

    if (!fieldIsValid) {
      group.classList.add("invalid");
      errorMessageElement.textContent = errorMessage;
      isValid = false;
      errors[fieldName] = errorMessage;
    } else {
      group.classList.remove("invalid");
      errorMessageElement.textContent = "";
    }
  });

  return { isValid, errors };
};

export const clearValidationErrors = (formElement) => {
  formElement.querySelectorAll(".form-group.invalid").forEach((group) => {
    group.classList.remove("invalid");
    const errorMessageElement = group.querySelector(".error-message span");
    if (errorMessageElement) {
      errorMessageElement.textContent = "";
    }
  });
};
