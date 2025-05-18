export const scrollTop = (element?: HTMLElement) => {
  if (element) {
    element.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } else {
    window?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
};
