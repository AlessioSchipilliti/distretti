const UNITS = [
  { label: "Arieti", tag: "ram", travel: "07:21:11" },
  { label: "Spade", tag: "sword", travel: "05:23:32" },
  { label: "Asce", tag: "axe", travel: "04:24:42" },
  { label: "Oni", tag: "heavy", travel: "02:41:46" },
  { label: "Ini", tag: "light", travel: "02:27:04" }
];

function pad2(n){
  return String(n).padStart(2, "0");
}

function hmsToSeconds(hms){
  const parts = hms.split(":").map(Number);
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function secondsToHms(seconds){
  const day = 24 * 3600;
  let s = ((Math.round(seconds) % day) + day) % day;
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function extractArrivalStart(offText){
  const match = offText.match(/arrivo\s*:\s*[^\n]*?(\d{1,2}:\d{2}:\d{2})(?::\d+)?/i);
  if(!match) throw new Error("Orario di arrivo non trovato nella OFF.");
  return match[1];
}

function extractNobileTime(nobileText){
  const match = nobileText.match(/(\d{1,2}:\d{2}:\d{2})/);
  if(!match) throw new Error("Orario del nobile non trovato.");
  return match[1];
}

function buildOutput(offText, nobileText){
  const startHms = extractArrivalStart(offText);
  const endHms = extractNobileTime(nobileText);
  const start = hmsToSeconds(startHms);
  const end = hmsToSeconds(endHms);

  const lines = [`[b]Arrivo:  ${secondsToHms(start)} - ${secondsToHms(end)}[/b]`];

  for(const unit of UNITS){
    const travel = hmsToSeconds(unit.travel);
    const from = secondsToHms(start - travel);
    const to = secondsToHms(end - travel);
    lines.push(`${unit.label} [unit]${unit.tag}[/unit] ${from} - ${to}`);
  }

  return lines.join("\n");
}

function calculate(){
  const offInput = document.getElementById("offInput");
  const nobileInput = document.getElementById("nobileInput");
  const resultBox = document.getElementById("resultBox");
  const errorBox = document.getElementById("errorBox");

  try{
    errorBox.hidden = true;
    errorBox.textContent = "";
    resultBox.value = buildOutput(offInput.value, nobileInput.value);
  }catch(err){
    resultBox.value = "";
    errorBox.textContent = err.message;
    errorBox.hidden = false;
  }
}

async function copyResult(){
  calculate();
  const resultBox = document.getElementById("resultBox");
  if(!resultBox.value) return;
  await navigator.clipboard.writeText(resultBox.value);
}

document.getElementById("calcBtn").addEventListener("click", calculate);
document.getElementById("copyBtn").addEventListener("click", copyResult);
document.getElementById("offInput").addEventListener("input", calculate);
document.getElementById("nobileInput").addEventListener("input", calculate);

calculate();
