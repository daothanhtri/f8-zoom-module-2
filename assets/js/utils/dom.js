export const getElement = (selector, parent = document) =>
  parent.querySelector(selector);

export const getElements = (selector, parent = document) =>
  parent.querySelectorAll(selector);

export const createElement = (tagName, className = "", id = "") => {
  const el = document.createElement(tagName);
  if (className) el.className = className;
  if (id) el.id = id;
  return el;
};

export const addClass = (element, className) => {
  if (element && className) {
    const classes = className.split(" ").filter((c) => c);
    element.classList.add(...classes);
  }
};

export const removeClass = (element, className) => {
  if (element && className) {
    const classes = className.split(" ").filter((c) => c);
    element.classList.remove(...classes);
  }
};

export const toggleClass = (element, className, force) => {
  if (element && className) {
    const classes = className.split(" ").filter((c) => c);

    if (typeof force === "boolean") {
      classes.forEach((cls) => element.classList.toggle(cls, force));
    } else {
      classes.forEach((cls) => element.classList.toggle(cls));
    }
  }
};
export const hasClass = (element, className) =>
  element && element.classList.contains(className);

export const setAttributes = (element, attributes) => {
  for (const key in attributes) {
    if (attributes.hasOwnProperty(key)) {
      element.setAttribute(key, attributes[key]);
    }
  }
};
