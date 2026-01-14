const memory = new Map();

export function getHistory(chatId) {
  if (!memory.has(chatId)) memory.set(chatId, []);
  return memory.get(chatId);
}

export function addMessage(chatId, role, content) {
  const history = getHistory(chatId);
  history.push({ role, content });
  if (history.length > 10) history.shift();
}

export function resetHistory(chatId) {
  memory.delete(chatId);
}
