// Search module
export const search = {
  input: null as HTMLInputElement | null,
  onSearch: null as ((query: string) => void) | null,

  init(inputEl: HTMLInputElement, onSearch: (query: string) => void): void {
    this.input = inputEl;
    this.onSearch = onSearch;
    this.bindEvents();
  },

  bindEvents(): void {
    if (!this.input || !this.onSearch) return;
    this.input.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase();
      this.onSearch?.(query);
    });
  },
};
