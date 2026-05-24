const toast = document.querySelector("#toast");
const bookingForm = document.querySelector("#bookingForm");
const searchFeedback = document.querySelector("#searchFeedback");
const statusToggle = document.querySelector("#statusToggle");
const statusText = document.querySelector("#statusText");
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2800);
}

bookingForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  searchFeedback.textContent = "Encontramos 2 profissionais proximas com agenda disponivel.";
  showToast("Busca atualizada por localizacao e disponibilidade.");
});

document.querySelectorAll("[data-book]").forEach((button) => {
  button.addEventListener("click", () => showToast(`Solicitacao enviada para ${button.dataset.book}.`));
});

statusToggle?.addEventListener("click", () => {
  const isActive = statusToggle.getAttribute("aria-pressed") === "true";
  statusToggle.setAttribute("aria-pressed", String(!isActive));
  statusText.textContent = isActive ? "Inativa para atendimento" : "Ativa para atendimento";
  showToast(isActive ? "Perfil pausado temporariamente." : "Perfil ativado.");
});

document.querySelectorAll(".time-grid button").forEach((button) => {
  button.addEventListener("click", () => {
    button.classList.toggle("is-selected");
    showToast(`Horario ${button.textContent} atualizado na agenda.`);
  });
});

document.querySelectorAll("[data-panel-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const message = button.dataset.panelAction === "service" ? "Cadastro de novo servico preparado." : "Edicao de agenda preparada.";
    showToast(message);
  });
});

document.querySelectorAll("[data-admin-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const messages = {
      all: "Abrindo visao completa da gestao.",
      review: "Profissional enviada para analise documental.",
      approve: "Profissional aprovada para atendimento.",
      moderate: "Avaliacao marcada para revisao."
    };
    showToast(messages[button.dataset.adminAction]);
  });
});
