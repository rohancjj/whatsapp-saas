

export function applyTemplate(content, data = {}) {
  if (!content) return "";

  return content.replace(/{{(.*?)}}/g, (_, key) => {
    const k = key.trim();
    return data[k] !== undefined && data[k] !== null ? String(data[k]) : "";
  });
}
