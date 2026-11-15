(() => {
  "use strict";
  const endpoint = "https://gcfyaaqqsqrjwujpymjz.supabase.co/functions/v1/feature-poll";
  const root = document.getElementById("feature-poll");
  const feedback = document.getElementById("vote-feedback");
  if (!root || !feedback) return;
  let submitting = false;
  let snapshot = null;
  function message(text, error = false) {
    feedback.textContent = text;
    feedback.classList.toggle("is-error", error);
  }
  function buildCard(option, votedFor, threshold) {
    const count = Number(option.votes) || 0;
    const selected = option.status !== "voting" || count >= threshold;
    const card = document.createElement("article");
    card.className = "vote-card" + (votedFor === option.id ? " is-voted" : "");
    const header = document.createElement("div");
    header.className = "vote-card-head";
    const label = document.createElement("span");
    label.className = "vote-card-label";
    label.textContent = selected ? (option.status === "shipped" ? "Released" : option.status === "in_progress" ? "In progress" : "Selected for development") : "Community idea";
    const total = document.createElement("strong");
    total.className = "vote-total";
    total.textContent = count + (count === 1 ? " vote" : " votes");
    header.append(label, total);
    const title = document.createElement("h3");
    title.textContent = option.title;
    const desc = document.createElement("p");
    desc.textContent = option.description;
    const track = document.createElement("div");
    track.className = "vote-track";
    const fill = document.createElement("div");
    fill.className = "vote-fill";
    fill.style.width = Math.min(100, count / threshold * 100) + "%";
    fill.setAttribute("aria-hidden", "true");
    track.append(fill);
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-label", option.title + " voting progress");
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", String(threshold));
    track.setAttribute("aria-valuenow", String(Math.min(threshold, count)));
    const actions = document.createElement("div");
    actions.className = "vote-card-actions";
    const remainder = document.createElement("span");
    remainder.textContent = selected ? "Roadmap milestone reached" : (threshold - count) + " more to reach 10";
    const button = document.createElement("button");
    button.className = "vote-button";
    button.type = "button";
    button.textContent = votedFor === option.id ? "✓ Your vote" : selected ? "Selected" : votedFor ? "Voting closed" : "Vote for this";
    button.disabled = submitting || selected || !!votedFor;
    button.addEventListener("click", () => submitVote(option.id));
    actions.append(remainder, button);
    card.append(header, title, desc, track, actions);
    return card;
  }
  function render(data) {
    snapshot = data;
    root.replaceChildren();
    if (!Array.isArray(data.options) || data.options.length === 0) {
      message("No features available right now.", true);
      return;
    }
    data.options.forEach(option => root.append(buildCard(option, data.votedFor, data.threshold || 10)));
    if (data.votedFor) message("Thank you for voting! Your choice is recorded.");
  }
  async function load() {
    try {
      const response = await fetch(endpoint, {cache:"no-store"});
      if (!response.ok) throw new Error("Service unavailable");
      render(await response.json());
    } catch {
      root.replaceChildren();
      const p = document.createElement("p");
      p.className = "vote-placeholder";
      p.textContent = "Community voting is temporarily unavailable. Please try again later.";
      root.append(p);
      message("Could not load voting results.", true);
    }
  }
  async function submitVote(optionId) {
    if (submitting || snapshot?.votedFor) return;
    submitting = true;
    if (snapshot) render(snapshot);
    message("Saving your vote…");
    try {
      const response = await fetch(endpoint, {
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({optionId})
      });
      const data = await response.json();
      if (Array.isArray(data.options)) render(data);
      if (!response.ok) throw new Error(data.error || "Could not record your vote");
      message("Vote recorded. Thanks for helping shape BatchSave Pro!");
      if (window.dataLayer) window.dataLayer.push({event:"feature_vote", feature_id:optionId});
    } catch (error) {
      message(error.message || "Could not save your vote. Please try again.", true);
    } finally {
      submitting = false;
      if (snapshot) render(snapshot);
    }
  }
  load();
})();