// ============================================
// FILTERS.JS — EV1 STABLE
// Gestion des filtres produits
// (evenement, type de pierre, prix)
// ============================================

// --------------------------------------------
// Etat global des filtres (SOURCE DE VERITE)
// --------------------------------------------
export const filtersState = {
    event: "all",      // string | "all"
    stoneTypes: [],    // array<string>
    priceMin: null,    // number
    priceMax: null     // number
};

// --------------------------------------------
// Initialisation UI des filtres
// --------------------------------------------
export function initFiltersUI(products) {
    console.log("Init filters UI");

    generateEventFilters(products);
    generateStoneFilters(products);
    generatePriceFilter(products);
}

// --------------------------------------------
// Application des filtres
// --------------------------------------------
export function applyFilters(products) {
    let result = [...products];

    // --- Filtre evenement ---
    if (filtersState.event !== "all") {
        result = result.filter(p =>
            Array.isArray(p.events) &&
            p.events.includes(filtersState.event)
        );
    }

    // --- Filtre type de pierre ---
    if (filtersState.stoneTypes.length > 0) {
        result = result.filter(p =>
            p.stone_type &&
            filtersState.stoneTypes.includes(
                normalizeStone(p.stone_type)
            )
        );
    }

    // --- Filtre prix ---
    if (filtersState.priceMin !== null) {
        result = result.filter(p => p.price >= filtersState.priceMin);
    }

    if (filtersState.priceMax !== null) {
        result = result.filter(p => p.price <= filtersState.priceMax);
    }

    return result;
}

// ============================================
// UI GENERATION
// ============================================

function generateEventFilters(products) {
    const container = document.getElementById("event-filters");
    if (!container) return;

    const events = unique(
        products.flatMap(p => p.events || [])
    );

    container.innerHTML = "";

    // Bouton Tous
    const allBtn = createButton("Tous", true);
    allBtn.onclick = () => {
        filtersState.event = "all";
        setActive(container, allBtn);
        dispatchChange();
    };
    container.appendChild(allBtn);

    events.forEach(ev => {
        const btn = createButton(ev);
        btn.onclick = () => {
            filtersState.event = ev;
            setActive(container, btn);
            dispatchChange();
        };
        container.appendChild(btn);
    });
}

function generateStoneFilters(products) {
    const container = document.getElementById("stone-filters");
    if (!container) return;

    const stones = unique(
        products
            .map(p => normalizeStone(p.stone_type))
            .filter(Boolean)
    );

    container.innerHTML = "";

    stones.forEach(stone => {
        const btn = createButton(stone);
        btn.onclick = () => {
            toggleArray(filtersState.stoneTypes, stone);
            btn.classList.toggle("active");
            dispatchChange();
        };
        container.appendChild(btn);
    });
}

function generatePriceFilter(products) {
    const container = document.getElementById("price-filter");
    if (!container) return;

    const prices = products
        .map(p => Number(p.price))
        .filter(v => !isNaN(v));

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    // Init state
    filtersState.priceMin = min;
    filtersState.priceMax = max;

    container.innerHTML = `
        <label>
            Min €
            <input type="number" id="price-min" min="${min}" max="${max}" value="${min}">
        </label>

        <label>
            Max €
            <input type="number" id="price-max" min="${min}" max="${max}" value="${max}">
        </label>
    `;

    const minInput = container.querySelector("#price-min");
    const maxInput = container.querySelector("#price-max");

    minInput.addEventListener("input", () => {
        const val = Number(minInput.value);
        filtersState.priceMin = isNaN(val) ? min : val;
        dispatchChange();
    });

    maxInput.addEventListener("input", () => {
        const val = Number(maxInput.value);
        filtersState.priceMax = isNaN(val) ? max : val;
        dispatchChange();
    });
}

// ============================================
// UTILS
// ============================================

function dispatchChange() {
    document.dispatchEvent(new Event("filters:change"));
}

function createButton(label, active = false) {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className = "filter-btn";
    if (active) btn.classList.add("active");
    return btn;
}

function setActive(container, activeBtn) {
    container.querySelectorAll("button").forEach(b =>
        b.classList.remove("active")
    );
    activeBtn.classList.add("active");
}

function toggleArray(arr, value) {
    const i = arr.indexOf(value);
    if (i === -1) arr.push(value);
    else arr.splice(i, 1);
}

function unique(arr) {
    return [...new Set(arr)];
}

function normalizeStone(value) {
    if (!value) return null;
    return value.toString().trim().toLowerCase();
}
