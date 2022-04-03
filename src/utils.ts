const SCROLL_MARGIN = 50;

export function delay(milliseconds: number = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function isAtBottom(): boolean {
  const scrollingElement = document.scrollingElement!;

  return scrollingElement.scrollTop + window.innerHeight >= scrollingElement.scrollHeight - SCROLL_MARGIN;
}

export function scrollToBottom(smooth: boolean = true): void {
  const scrollingElement = document.scrollingElement!;

  window.scrollTo({ top: scrollingElement.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
}
