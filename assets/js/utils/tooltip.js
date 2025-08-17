import { getElements, createElement, addClass, removeClass } from "./dom.js";

let currentTooltip = null;
let showTimeout = null;
let hideTimeout = null;

const createTooltipElement = (text) => {
  const tooltip = createElement("div", "custom-tooltip");
  tooltip.textContent = text;
  document.body.appendChild(tooltip);
  return tooltip;
};

const showTooltip = (targetElement, tooltipText) => {
  clearTimeout(hideTimeout);
  showTimeout = setTimeout(() => {
    if (currentTooltip) {
      currentTooltip.remove();
    }
    currentTooltip = createTooltipElement(tooltipText);
    updateTooltipPosition(targetElement, currentTooltip);
    addClass(currentTooltip, "show");
  }, 500);
};

const hideTooltip = () => {
  clearTimeout(showTimeout);
  hideTimeout = setTimeout(() => {
    if (currentTooltip) {
      removeClass(currentTooltip, "show");

      setTimeout(() => {
        if (currentTooltip) {
          currentTooltip.remove();
          currentTooltip = null;
        }
      }, 150);
    }
  }, 100);
};

const updateTooltipPosition = (targetElement, tooltipElement) => {
  const rect = targetElement.getBoundingClientRect();
  const tooltipWidth = tooltipElement.offsetWidth;

  const top = rect.top - tooltipElement.offsetHeight - 8;
  const left = rect.left + rect.width / 2 - tooltipWidth / 2;

  tooltipElement.style.top = `${top}px`;
  tooltipElement.style.left = `${left}px`;
};

export const initTooltips = () => {
  const elementsWithTooltip = getElements("[data-tooltip]");

  elementsWithTooltip.forEach((element) => {
    const tooltipText = element.dataset.tooltip;
    if (tooltipText) {
      element.addEventListener("mouseover", () =>
        showTooltip(element, tooltipText)
      );
      element.addEventListener("mouseout", hideTooltip);
      element.addEventListener("mouseleave", hideTooltip);
      element.addEventListener("focus", () =>
        showTooltip(element, tooltipText)
      );
      element.addEventListener("blur", hideTooltip);
    }
  });
};
