/* OES · Mapa demográfico 2022. SVG nativo, sem bibliotecas de mapas. */
(() => {
  const root = document.querySelector("[data-mapa]");
  if (!root) return;

  const english = document.documentElement.lang === "en";
  const svg = root.querySelector("[data-mapa-svg]");
  const buttons = root.querySelector("[data-mapa-buttons]");
  const status = root.querySelector("[data-mapa-status]");
  const name = root.querySelector("[data-mapa-name]");
  const count = root.querySelector("[data-mapa-pop]");
  const official = root.querySelector("[data-mapa-official]");
  const labels = english
    ? { people: "people", unavailable: "The map could not be loaded.", invalid: "Invalid Census map data." }
    : { people: "pessoas", unavailable: "Não foi possível carregar o mapa.", invalid: "Dados inválidos do mapa censitário." };
  const format = new Intl.NumberFormat(english ? "en-US" : "pt-BR");
  const namespace = "http://www.w3.org/2000/svg";
  let loaded = false;
  let loading = false;

  function rings(geometry) {
    return geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
  }

  function visitCoordinates(features, callback) {
    for (const feature of features) {
      for (const polygon of rings(feature.geometry)) {
        for (const ring of polygon) {
          for (const point of ring) callback(point);
        }
      }
    }
  }

  function draw(collection) {
    const areas = collection.features;
    const meta = collection.metadata;
    if (meta.municipalityCode !== "3552403" || meta.year !== 2022 ||
        areas.length !== 6 || areas.some(area => !rings(area.geometry).length ||
          !Number.isSafeInteger(area.properties.population))) {
      throw new Error(labels.invalid);
    }
    const total = areas.reduce((sum, area) => sum + area.properties.population, 0);
    if (total !== meta.populationInAreas || total + meta.difference !== meta.municipalityTotal) {
      throw new Error(labels.invalid);
    }

    let west = Infinity, east = -Infinity, south = Infinity, north = -Infinity;
    visitCoordinates(areas, ([longitude, latitude]) => {
      west = Math.min(west, longitude);
      east = Math.max(east, longitude);
      south = Math.min(south, latitude);
      north = Math.max(north, latitude);
    });
    if (![west, east, south, north].every(Number.isFinite) || west === east || south === north) {
      throw new Error(labels.invalid);
    }

    const width = 720, height = 390, padding = 18;
    const longitudeFactor = Math.cos(((south + north) / 2) * Math.PI / 180);
    const scale = Math.min((width - 2 * padding) / ((east - west) * longitudeFactor),
      (height - 2 * padding) / (north - south));
    const offsetX = (width - (east - west) * longitudeFactor * scale) / 2;
    const offsetY = (height - (north - south) * scale) / 2;
    const point = ([longitude, latitude]) =>
      [offsetX + (longitude - west) * longitudeFactor * scale,
        offsetY + (north - latitude) * scale].map(value => value.toFixed(2)).join(" ");

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const interactive = [];

    function select(id) {
      const selected = areas.find(area => area.properties.id === id);
      if (!selected) return;
      name.textContent = selected.properties.name;
      count.textContent = format.format(selected.properties.population);
      official.textContent = selected.properties.officialName;
      for (const item of interactive) {
        const active = item.id === id;
        item.path.classList.toggle("is-selected", active);
        item.path.setAttribute("aria-pressed", String(active));
        item.button.classList.toggle("is-selected", active);
        item.button.setAttribute("aria-pressed", String(active));
      }
    }

    for (const area of areas) {
      const { id, population, name: short, officialName } = area.properties;
      const path = document.createElementNS(namespace, "path");
      const d = rings(area.geometry).flatMap(polygon => polygon.map(ring =>
        ring.map((coordinate, index) => (index ? "L" : "M") + point(coordinate)).join(" ") + " Z"
      )).join(" ");
      path.setAttribute("d", d);
      path.setAttribute("fill-rule", "evenodd");
      path.setAttribute("class", "mapa-area mapa-area--" +
        (population < 40000 ? "low" : population < 50000 ? "mid" : "high"));
      path.setAttribute("tabindex", "0");
      path.setAttribute("role", "button");
      path.setAttribute("aria-label", `${officialName}: ${format.format(population)} ${labels.people}, 2022`);
      const title = document.createElementNS(namespace, "title");
      title.textContent = `${short}: ${format.format(population)} ${labels.people}`;
      path.append(title);
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
      button.textContent = short;
      button.setAttribute("aria-label", `${short}: ${format.format(population)} ${labels.people}`);
      button.addEventListener("click", () => select(id));
      buttons.append(button);
      interactive.push({ id, path, button });
    }
    status.hidden = true;
    select(areas[0].properties.id);
  }

  async function load() {
    if (loading || loaded) return;
    loading = true;
    try {
      const response = await fetch(english ? "../data/mapa-regioes-2022.json" :
        "data/mapa-regioes-2022.json");
      if (!response.ok) throw new Error("HTTP " + response.status);
      draw(await response.json());
      loaded = true;
    } catch (error) {
      status.textContent = labels.unavailable;
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
