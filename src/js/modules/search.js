// Search module
export const search = {
  input: null,
  onSearch: null,

  init(inputEl, onSearch) {
    this.input = inputEl;
    this.onSearch = onSearch;
    this.bindEvents();
  },

  bindEvents() {
    this.input.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();
      this.onSearch(query);
    });
  },
};
