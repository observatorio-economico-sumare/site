"use strict";

const entries = [...document.querySelectorAll(".library-entry[data-topic]")];
const topics = [...new Set(entries.map(entry => entry.dataset.topic))]
  .sort((a, b) => a.localeCompare(b, "pt-BR"));
const container = document.getElementById("library-topics");
const buttons = [];

function filterByTopic(selected) {
  for (const entry of entries) {
    entry.hidden = Boolean(selected) && entry.dataset.topic !== selected;
  }
  for (const button of buttons) {
    button.setAttribute("aria-pressed", String(button.dataset.topic === selected));
  }
}

function addTopicButton(topic, text) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "library-topic-button";
  button.dataset.topic = topic;
  button.textContent = text;
  button.setAttribute("aria-pressed", String(topic === ""));
  button.addEventListener("click", () => filterByTopic(topic));
  buttons.push(button);
  container.append(button);
}

addTopicButton("", "Todos os temas");
for (const topic of topics) addTopicButton(topic, topic);
document.getElementById("library-filter").hidden = false;
