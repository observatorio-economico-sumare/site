/* OES: mapa do Censo 2022. SVG nativo e geometria oficial do IBGE. */
(() => {
  const root = document.querySelector("[data-mapa]");
  if (!root) return;

  const en = document.documentElement.lang === "en";
  const svg = root.querySelector("[data-mapa-svg]");
  const buttons = root.querySelector("[data-mapa-buttons]");
  const status = root.querySelector("[data-mapa-status]");
  const announcement = root.querySelector("[data-mapa-selection]");
  const words = en
    ? { residents: "residents", unavailable: "The map could not be loaded.", invalid: "Invalid Census map data." }
    : { residents: "moradores", unavailable: "Não foi possível carregar o mapa.", invalid: "Dados inválidos do mapa censitário." };
  const format = new Intl.NumberFormat(en ? "en-US" : "pt-BR");
  const ns = "http://www.w3.org/2000/svg";
  let loaded = false;
  let loading = false;

  const polygons = geometry => geometry.type === "Polygon"
    ? [geometry.coordinates]
    : geometry.type === "MultiPolygon" ? geometry.coordinates : [];

  function visitCoordinates(areas, callback) {
    for (const area of areas) {
      for (const polygon of polygons(area.geometry)) {
        for (const ring of polygon) {
          for (const coordinate of ring) callback(coordinate);
        }
      }
    }
  }

  function node(tag, text, className) {
    const element = document.createElementNS(ns, tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.setAttribute("class", className);
    return element;
  }

  function draw(collection) {
    const areas = collection.features;
    const meta = collection.metadata;
    if (meta.municipalityCode !== "3552403" || meta.year !== 2022 ||
        areas.length !== 6 || areas.some(area =>
          !polygons(area.geometry).length ||
          !Number.isSafeInteger(area.properties.population))) {
      throw new Error(words.invalid);
    }
    const total = areas.reduce((sum, area) => sum + area.properties.population, 0);
    if (total !== meta.populationInAreas ||
        total + meta.difference !== meta.municipalityTotal) {
      throw new Error(words.invalid);
    }

    let west = Infinity, east = -Infinity, south = Infinity, north = -Infinity;
    visitCoordinates(areas, ([longitude, latitude]) => {
      west = Math.min(west, longitude);
      east = Math.max(east, longitude);
      south = Math.min(south, latitude);
      north = Math.max(north, latitude);
    });
    if (![west, east, south, north].every(Number.isFinite) ||
        west === east || south === north) throw new Error(words.invalid);

    const width = 720, height = 390, padding = 18;
    const correction = Math.cos(((south + north) / 2) * Math.PI / 180);
    const scale = Math.min((width - padding * 2) / ((east - west) * correction),
      (height - padding * 2) / (north - south));
    const offsetX = (width - (east - west) * correction * scale) / 2;
    const offsetY = (height - (north - south) * scale) / 2;
    const point = ([longitude, latitude]) => [
      offsetX + (longitude - west) * correction * scale,
      offsetY + (north - latitude) * scale
    ];
    const pathPoint = coordinate => point(coordinate).map(n => n.toFixed(2)).join(" ");
    const ranked = [...areas].sort((a, b) => b.properties.population - a.properties.population);
    const counts = ranked.map(area => area.properties.population);
    const min = Math.min(...counts), max = Math.max(...counts);
    const interactive = [];

    function select(id) {
      const active = interactive.find(item => item.id === id);
      if (!active) return;
      for (const item of interactive) {
        const chosen = item === active;
        item.path.classList.toggle("is-selected", chosen);
        item.path.setAttribute("aria-pressed", String(chosen));
        item.button.classList.toggle("is-selected", chosen);
        item.button.setAttribute("aria-pressed", String(chosen));
      }
      announcement.textContent =
        active.name + ": " + format.format(active.population) + " " + words.residents + ".";
    }

    svg.replaceChildren();
    buttons.replaceChildren();
    for (const area of ranked) {
      const { id, population, name, officialName } = area.properties;
      const path = node("path");
      const d = polygons(area.geometry).flatMap(polygon => polygon.map(ring =>
        ring.map((coordinate, index) => (index ? "L" : "M") + pathPoint(coordinate)).join(" ") + " Z"
      )).join(" ");
      path.setAttribute("d", d);
      path.setAttribute("fill-rule", "evenodd");
      path.setAttribute("class", "mapa-area");
      path.setAttribute("tabindex", "0");
      path.setAttribute("role", "button");
      path.setAttribute("aria-pressed", "false");
      path.setAttribute("aria-label", officialName + ": " +
        format.format(population) + " " + words.residents + ", 2022");
      const t = (population - min) / (max - min || 1);
      const rgb = [
        Math.round(217 - 132 * t),
        Math.round(229 - 109 * t),
        Math.round(237 - 87 * t)
      ];
      path.style.setProperty("--mapa-tone", "rgb(" + rgb.join(",") + ")");
      path.append(node("title", name + ": " + format.format(population)));
      path.addEventListener("click", () => select(id));
      path.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select(id);
        }
      });
      svg.append(path);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "mapa-choice";
      const title = document.createElement("span");
      title.textContent = name;
      const value = document.createElement("span");
      value.className = "mapa-choice-value";
      value.textContent = format.format(population);
      button.append(title, value);
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", name + ": " +
        format.format(population) + " " + words.residents);
      button.addEventListener("click", () => select(id));
      button.addEventListener("mouseenter", () => path.classList.add("is-hovered"));
      button.addEventListener("mouseleave", () => path.classList.remove("is-hovered"));
      button.addEventListener("focus", () => path.classList.add("is-hovered"));
      button.addEventListener("blur", () => path.classList.remove("is-hovered"));
      path.addEventListener("mouseenter", () => button.classList.add("is-hovered"));
      path.addEventListener("mouseleave", () => button.classList.remove("is-hovered"));
      path.addEventListener("focus", () => button.classList.add("is-hovered"));
      path.addEventListener("blur", () => button.classList.remove("is-hovered"));
      buttons.append(button);
      interactive.push({ id, name, population, path, button });
    }
    status.hidden = true;
  }

  async function load() {
    if (loading || loaded) return;
    loading = true;
    try {
      const response = await fetch(en ? "../data/mapa-regioes-2022.json" :
        "data/mapa-regioes-2022.json");
      if (!response.ok) throw new Error("HTTP " + response.status);
      draw(await response.json());
      loaded = true;
    } catch (error) {
      status.textContent = words.unavailable;
      svg.replaceChildren();
      buttons.replaceChildren();
      console.error("OES map:", error);
    } finally {
      loading = false;
    }
  }

  document.querySelector('nav [data-tab="populacao"]')?.addEventListener("click", load);
  window.addEventListener("hashchange", () => {
    if (location.hash === "#populacao") load();
  });
  if (location.hash === "#populacao") load();
})();
