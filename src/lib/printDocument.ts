export const MARKSHEET_PRINT_BODY_CLASS = "print-marksheet-document";

export function executePrint(callback?: () => void) {
  document.body.classList.add(MARKSHEET_PRINT_BODY_CLASS);

  const cleanup = () => {
    document.body.classList.remove(MARKSHEET_PRINT_BODY_CLASS);
    window.removeEventListener("afterprint", cleanup);
    callback?.();
  };

  window.addEventListener("afterprint", cleanup);
  window.print();
}
