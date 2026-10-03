const pages = document.querySelectorAll(".page");
const pageButtons = document.querySelectorAll("[data-page-link]");
const tabButtons = document.querySelectorAll(".tab-button");
const toast = document.getElementById("toast");

function showPage(pageId) {
  pages.forEach((page) => {
    const selected = page.id === pageId;
    page.hidden = !selected;
    page.classList.toggle("active", selected);
  });
  tabButtons.forEach((button) => {
    const selected = button.dataset.pageLink === pageId;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-selected", String(selected));
  });
  history.replaceState(null, "", "#" + pageId);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

pageButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    showPage(button.dataset.pageLink);
  });
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1600);
}

document.querySelectorAll("[data-copy-target]").forEach((button) => {
  button.addEventListener("click", async () => {
    const target = document.getElementById(button.dataset.copyTarget);
    if (!target) return;
    await navigator.clipboard.writeText(target.innerText.trim());
    showToast("Copied to clipboard");
  });
});

document.querySelectorAll("[data-progress-card]").forEach((card) => {
  const group = card.dataset.progressCard;
  const taskChecks = [...document.querySelectorAll(`[data-task-group="${group}"]`)];
  const progressNumber = card.querySelector("[data-progress-number]");
  const progressBar = card.querySelector("[data-progress-bar]");
  const progressTrack = card.querySelector("[data-progress-track]");

  function updateProgress() {
    const finished = taskChecks.filter((check) => check.checked).length;
    const percentage = taskChecks.length ? Math.round((finished / taskChecks.length) * 100) : 0;
    progressNumber.textContent = percentage + "%";
    progressBar.style.width = percentage + "%";
    progressTrack.setAttribute("aria-valuenow", String(percentage));
    taskChecks.forEach((check) => check.closest("label").classList.toggle("complete", check.checked));
  }

  taskChecks.forEach((check) => check.addEventListener("change", updateProgress));
  updateProgress();
});

const topicOptions = {
  Spanish: ["ser and estar", "daily routine", "describing people", "school vocabulary", "My own topic…"],
  English: ["poetic techniques", "persuasive language", "character and theme", "paragraph writing", "My own topic…"],
  History: ["the causes of World War I", "Irish independence", "the Industrial Revolution", "the Cold War", "My own topic…"],
  Science: ["photosynthesis", "cells", "forces and energy", "genetics", "My own topic…"],
  Maths: ["linear equations", "percentages", "Pythagoras' theorem", "probability", "My own topic…"],
  Other: ["My own topic…"]
};

const subjectSelect = document.getElementById("quest-subject");
const topicSelect = document.getElementById("quest-topic");
const customTopicWrap = document.getElementById("custom-topic-wrap");
const customTopicInput = document.getElementById("quest-custom-topic");
const questPrompt = document.getElementById("quest-prompt");
const copyQuestButton = document.getElementById("copy-quest");

function updateTopicOptions() {
  if (!subjectSelect || !topicSelect) return;
  topicSelect.innerHTML = "";
  topicOptions[subjectSelect.value].forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    topicSelect.appendChild(option);
  });
  updateCustomTopicVisibility();
}

function updateCustomTopicVisibility() {
  if (!topicSelect || !customTopicWrap) return;
  const needsCustomTopic = topicSelect.value === "My own topic…";
  customTopicWrap.hidden = !needsCustomTopic;
  if (needsCustomTopic) customTopicInput.focus();
}

subjectSelect?.addEventListener("change", updateTopicOptions);
topicSelect?.addEventListener("change", updateCustomTopicVisibility);
updateTopicOptions();

document.getElementById("build-quest")?.addEventListener("click", () => {
  const selectedTopic = topicSelect.value === "My own topic…" ? customTopicInput.value.trim() : topicSelect.value;
  if (!selectedTopic) {
    customTopicInput.focus();
    showToast("Add your school topic first");
    return;
  }

  const subject = subjectSelect.value === "Other" ? "a school subject" : subjectSelect.value;
  const character = document.getElementById("quest-character").value;
  const world = document.getElementById("quest-world").value;
  const difficulty = document.getElementById("quest-difficulty").value;

  questPrompt.textContent = `You are the game master of a short educational text RPG called The Knowledge Quest.

I am a 15-year-old student. The topic I need to learn is ${selectedTopic} from ${subject}. My character is ${character} exploring ${world}. The starting difficulty is ${difficulty}.

Create an adventure containing exactly four short scenes. In each scene, I must overcome a challenge by answering a question about the topic.

Rules:
• Present only one scene and one question at a time.
• Keep each scene under 100 words.
• Wait for my answer before continuing.
• Gradually increase or decrease the difficulty depending on my answers.
• Give me three health points.
• If I answer incorrectly, remove one health point, give me a useful hint and let me try again.
• Do not reveal the correct answer immediately.
• Make my answers affect what happens in the story.
• Keep the story suitable for school.

After the final scene, give me a Hero's Learning Report showing:
1. what I understood well;
2. what I found difficult;
3. one thing I should revise;
4. my final health and score.

First, introduce yourself as the game master and ask me to confirm my character, world and topic. Do not begin the adventure until I reply.`;
  copyQuestButton.disabled = false;
  showToast("Your Knowledge Quest is ready");
});

const wordwallInstructions = {
  Quiz: "Create a table with these columns: question, correct answer, distractor 1, distractor 2, distractor 3. Make every distractor plausible but clearly incorrect.",
  "Match up": "Create a two-column table with 10 items. Column 1 must contain a term or prompt and column 2 its unique matching definition or answer.",
  Flashcards: "Create a two-column table with 10 cards. Column 1 is the front of the card and column 2 is the short answer on the back.",
  "Group sort": "Choose 2–4 clear categories and provide 10 items to sort. Show the correct category beside every item. Avoid items that could reasonably fit more than one category."
};

document.getElementById("build-game-prompts")?.addEventListener("click", () => {
  const subject = document.getElementById("game-subject").value;
  const topicInput = document.getElementById("game-topic");
  const goalInput = document.getElementById("game-goal");
  const notes = document.getElementById("game-notes").value.trim();
  const wordwallFormat = document.getElementById("wordwall-format").value;
  const educaplayFormat = document.getElementById("educaplay-format").value;
  const topic = topicInput.value.trim();
  const goal = goalInput.value.trim();

  if (!topic) {
    topicInput.focus();
    showToast("Add a specific topic first");
    return;
  }
  if (!goal) {
    goalInput.focus();
    showToast("Add the learning goal first");
    return;
  }

  const evidenceRule = notes
    ? `Use only the class information below as your factual source. Do not add facts that are not supported by it.\n\nCLASS INFORMATION:\n${notes}`
    : "Use accurate, age-appropriate information. At the end, flag any fact or answer that I should verify before publishing.";

  const wordwallPrompt = `Act as a learning-game designer. I am creating a Wordwall ${wordwallFormat} activity for a 15–16-year-old student studying ${subject}.

The specific topic is: ${topic}.
The learning goal is: ${goal}.

Create exactly 10 items for this activity. Begin with accessible recall and gradually increase the challenge. Use clear, concise language. Test important learning rather than trivia. Avoid ambiguous wording and unnecessarily difficult vocabulary.

${wordwallInstructions[wordwallFormat]}

${evidenceRule}

Present the content in a clean format that I can enter manually into Wordwall. Do not give me general advice or an introduction.`;

  const educaplayPrompt = `Help me write one effective prompt for Educaplay's AI assistant, Ray. Do not create the activity yourself.

The activity will be a ${educaplayFormat} game for a 15–16-year-old student studying ${subject}.
The specific topic is: ${topic}.
The learning goal is: ${goal}.

Write the final instruction that I should paste into Ray. Tell Ray to:
• create approximately 10 items;
• begin at an accessible level and include some items that require understanding, not guessing;
• use clear, age-appropriate language;
• avoid ambiguous questions and answers;
• provide useful feedback where the format allows it;
• keep the activity focused on the learning goal;
• not invent unsupported information.

${evidenceRule}

Output only the final prompt for Ray. Do not include an explanation before or after it.`;

  document.getElementById("wordwall-prompt-output").textContent = wordwallPrompt;
  document.getElementById("educaplay-prompt-output").textContent = educaplayPrompt;
  document.getElementById("copy-wordwall-prompt").disabled = false;
  document.getElementById("copy-educaplay-prompt").disabled = false;
  showToast("Both Copilot prompts are ready");
});

document.getElementById("present-button").addEventListener("click", async () => {
  if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
  else await document.exitFullscreen?.();
});

const requestedPage = location.hash.replace("#", "");
const initialPage = requestedPage === "session" ? "session1" : requestedPage;
if (["home", "session1", "session2", "session3", "session4", "portfolio"].includes(initialPage)) showPage(initialPage);
else showPage("home");
