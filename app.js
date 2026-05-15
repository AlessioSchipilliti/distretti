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

function getTimes(text){
  if(!text) return [];
  return [...text.matchAll(/\b(\d{1,2}:\d{2}:\d{2})(?::\d+)?\b/g)].map(match => match[1]);
}

function extractSmartTime(text){
  if(!text || !text.trim()) return null;

  // Caso completo: "arrivo: 14,2026 20:40:10:257"
  let match = text.match(/arrivo\s*:\s*[^\n]*?(\d{1,2}:\d{2}:\d{2})(?::\d+)?/i);
  if(match) return match[1];

  // Caso con virgola: prende il primo orario dopo la virgola.
  const commaIndex = text.indexOf(",");
  if(commaIndex !== -1){
    const afterComma = text.slice(commaIndex + 1);
    const afterCommaTimes = getTimes(afterComma);
    if(afterCommaTimes.length) return afterCommaTimes[0];
  }

  // Caso semplice: "sent 20:45:44" oppure "oggi alle 20:50:43".
  const times = getTimes(text);
  if(times.length) return times[0];

  return null;
}

function resolveTimes(offText, nobileText){
  const offTime = extractSmartTime(offText);
  const nobileTime = extractSmartTime(nobileText);

  if(offTime || nobileTime){
    return { startHms: offTime || nobileTime, endHms: nobileTime || null };
  }

  // Se l'utente incolla tutto in un solo campo senza "arrivo", prova a usare primo e ultimo orario.
  const combinedTimes = [...getTimes(offText), ...getTimes(nobileText)];
  if(combinedTimes.length >= 2){
    return { startHms: combinedTimes[0], endHms: combinedTimes[combinedTimes.length - 1] };
  }

  throw new Error("Inserisci almeno un orario nella OFF o nel Nobile.");
}

function formatRange(startSeconds, endSeconds){
  const start = secondsToHms(startSeconds);
  if(endSeconds === null || endSeconds === undefined) return start;
  return `${start} - ${secondsToHms(endSeconds)}`;
}

function buildOutput(offText, nobileText){
  const { startHms, endHms } = resolveTimes(offText, nobileText);
  const start = hmsToSeconds(startHms);
  const end = endHms ? hmsToSeconds(endHms) : null;

  const lines = [`[b]Arrivo:  ${formatRange(start, end)}[/b]`];

  for(const unit of UNITS){
    const travel = hmsToSeconds(unit.travel);
    const from = start - travel;
    const to = end === null ? null : end - travel;
    lines.push(`${unit.label} [unit]${unit.tag}[/unit] ${formatRange(from, to)}`);
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
