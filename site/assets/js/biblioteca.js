"use strict";

const topicSelect = document.getElementById("library-topic");
const topicEntries = [...document.querySelectorAll(".library-entry[data-topic]")];
const topics = [...new Set(topicEntries.map(entry => entry.dataset.topic))]
  .sort((a, b) => a.localeCompare(b, "pt-BR"));

for (const topic of topics) {
  const option = document.createElement("option");
  option.value = topic;
  option.textContent = topic;
  topicSelect.append(option);
}

topicSelect.addEventListener("change", () => {
  for (const entry of topicEntries) {
    entry.hidden = Boolean(topicSelect.value) && entry.dataset.topic !== topicSelect.value;
  }
});

document.getElementById("library-filter").hidden = false;
