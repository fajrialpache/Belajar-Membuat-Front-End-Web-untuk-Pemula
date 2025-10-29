
if (!window.__BOOKSHELF_APP_INITIALIZED) {
  window.__BOOKSHELF_APP_INITIALIZED = true;

  // Constants & Events
  const STORAGE_KEY = "BOOKSHELF_APPS";
  const RENDER_EVENT = "render-bookshelf";
  const SAVED_EVENT = "saved-bookshelf";

  // In-memory store
  let books = [];

  // Utility: check storage support
  function isStorageExist() {
    if (typeof Storage === "undefined") {
      alert("Browser does not support localStorage");
      return false;
    }
    return true;
  }

  // Save to localStorage
  function saveData() {
    if (!isStorageExist()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    document.dispatchEvent(new Event(SAVED_EVENT));
  }

  // Load from localStorage
  function loadDataFromStorage() {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return;
    try {
      books = JSON.parse(serialized);
      document.dispatchEvent(new Event(RENDER_EVENT));
    } catch (err) {
      console.error("Failed parsing storage:", err);
    }
  }

  // Generate ID and book object
  function generateId() {
    return +new Date();
  }

  function generateBookObject(id, title, author, year, isComplete) {
    return { id, title, author, year, isComplete };
  }

  // Find helpers
  function findBookIndex(bookId) {
    return books.findIndex((b) => b.id === bookId);
  }

  function findBook(bookId) {
    return books.find((b) => b.id === bookId) || null;
  }

  // Create DOM element for a book (must respect data-testid and data-bookid per README)
  function makeBookElement(book) {
    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-bookid", book.id);
    wrapper.setAttribute("data-testid", "bookItem");
    wrapper.classList.add("book_item"); 

    // Title
    const h3 = document.createElement("h3");
    h3.setAttribute("data-testid", "bookItemTitle");
    h3.innerText = book.title;
    wrapper.appendChild(h3);

    // Author
    const pAuthor = document.createElement("p");
    pAuthor.setAttribute("data-testid", "bookItemAuthor");
    pAuthor.innerText = `Penulis: ${book.author}`;
    wrapper.appendChild(pAuthor);

    // Year
    const pYear = document.createElement("p");
    pYear.setAttribute("data-testid", "bookItemYear");
    pYear.innerText = `Tahun: ${book.year}`;
    wrapper.appendChild(pYear);

    // Actions container
    const actionDiv = document.createElement("div");
    actionDiv.classList.add("action");

    // Toggle complete button
    const toggleBtn = document.createElement("button");
    toggleBtn.setAttribute("data-testid", "bookItemIsCompleteButton");
    toggleBtn.innerText = book.isComplete
      ? "Belum selesai dibaca"
      : "Selesai dibaca";
    toggleBtn.addEventListener("click", function () {
      toggleBookStatus(book.id);
    });
    actionDiv.appendChild(toggleBtn);

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.setAttribute("data-testid", "bookItemDeleteButton");
    deleteBtn.innerText = "Hapus Buku";
    deleteBtn.addEventListener("click", function () {
      removeBook(book.id);
    });
    actionDiv.appendChild(deleteBtn);

    // Edit button (optional UI; implementation provided as simple prompt-based edit)
    const editBtn = document.createElement("button");
    editBtn.setAttribute("data-testid", "bookItemEditButton");
    editBtn.innerText = "Edit Buku";
    editBtn.addEventListener("click", function () {
      openEditDialog(book.id);
    });
    actionDiv.appendChild(editBtn);

    wrapper.appendChild(actionDiv);

    return wrapper;
  }

  // Add book from form inputs
  function addBookFromForm() {
    const titleEl = document.getElementById("bookFormTitle");
    const authorEl = document.getElementById("bookFormAuthor");
    const yearEl = document.getElementById("bookFormYear");
    const isCompleteEl = document.getElementById("bookFormIsComplete");

    if (!titleEl || !authorEl || !yearEl || !isCompleteEl) {
      console.error("Form elements not found. Check IDs in HTML.");
      return;
    }

    const title = titleEl.value.trim();
    const author = authorEl.value.trim();
    const year = Number(yearEl.value);
    const isComplete = isCompleteEl.checked;

    if (!title || !author || !year) {
      alert("Please fill Title, Author, and Year.");
      return;
    }

    const id = generateId();
    const book = generateBookObject(id, title, author, year, isComplete);
    books.push(book);

    // clear form
    titleEl.value = "";
    authorEl.value = "";
    yearEl.value = "";
    isCompleteEl.checked = false;

    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
  }

  // Remove book
  function removeBook(bookId) {
    const idx = findBookIndex(bookId);
    if (idx === -1) return;
    const confirmDelete = confirm("Are you sure you want to delete this book?");
    if (!confirmDelete) return;
    books.splice(idx, 1);
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
  }

  // Toggle complete status
  function toggleBookStatus(bookId) {
    const book = findBook(bookId);
    if (!book) return;
    book.isComplete = !book.isComplete;
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
  }

  // Simple edit function (opens prompt; can be improved to full form)
  function openEditDialog(bookId) {
    const book = findBook(bookId);
    if (!book) return;

    const newTitle = prompt("Edit Title:", book.title);
    if (newTitle === null) return; // cancel
    const newAuthor = prompt("Edit Author:", book.author);
    if (newAuthor === null) return;
    const newYearStr = prompt("Edit Year:", book.year.toString());
    if (newYearStr === null) return;
    const newYear = Number(newYearStr);
    if (!newTitle.trim() || !newAuthor.trim() || Number.isNaN(newYear)) {
      alert("Invalid input. Edit cancelled.");
      return;
    }

    book.title = newTitle.trim();
    book.author = newAuthor.trim();
    book.year = newYear;

    document.dispatchEvent(new Event(RENDER_EVENT));
    saveData();
  }

  // Search books by title (optional feature)
  function searchBooksByTitle(keyword) {
    const lower = keyword.trim().toLowerCase();
    if (lower === "") {
      document.dispatchEvent(new Event(RENDER_EVENT));
      return;
    }

    // render only matches
    const incompleteContainer = document.getElementById("incompleteBookList");
    const completeContainer = document.getElementById("completeBookList");
    if (!incompleteContainer || !completeContainer) return;

    incompleteContainer.innerHTML = "";
    completeContainer.innerHTML = "";

    for (const book of books) {
      if (book.title.toLowerCase().includes(lower)) {
        const el = makeBookElement(book);
        if (book.isComplete) completeContainer.appendChild(el);
        else incompleteContainer.appendChild(el);
      }
    }
  }

  // Render to DOM
  document.addEventListener(RENDER_EVENT, function () {
    const incompleteContainer = document.getElementById("incompleteBookList");
    const completeContainer = document.getElementById("completeBookList");
    if (!incompleteContainer || !completeContainer) {
      console.error("Book list containers not found. Check container IDs.");
      return;
    }

    incompleteContainer.innerHTML = "";
    completeContainer.innerHTML = "";

    for (const book of books) {
      const bookEl = makeBookElement(book);
      if (book.isComplete) completeContainer.appendChild(bookEl);
      else incompleteContainer.appendChild(bookEl);
    }
  });

  // DOMContentLoaded: wire up form listeners
  document.addEventListener("DOMContentLoaded", function () {
    // Add book form (ID in index.html is "bookForm")
    const bookForm = document.getElementById("bookForm");
    if (bookForm) {
      bookForm.addEventListener("submit", function (e) {
        e.preventDefault();
        addBookFromForm();
      });
    } else {
      console.error("#bookForm not found in DOM");
    }

    // Search form (optional)
    const searchForm = document.getElementById("searchBook");
    const searchInput = document.getElementById("searchBookTitle");
    if (searchForm && searchInput) {
      searchForm.addEventListener("submit", function (e) {
        e.preventDefault();
        searchBooksByTitle(searchInput.value);
      });
    }

    // Load existing data
    if (isStorageExist()) {
      loadDataFromStorage();
    }
  });

  // Expose for debugging if needed (optional)
  window._bookshelf = {
    getAll: () => books,
    save: saveData,
    load: loadDataFromStorage,
  };
}
