/**
 * Jarvis-style copy helpers — written + spoken.
 */

export function principalName(user) {
  const name = (user?.full_name || '').trim();
  if (name) return name.split(/\s+/)[0];
  const email = String(user?.email || '');
  if (email.includes('@')) return email.split('@')[0];
  return 'Sir';
}

export function markdownToSpoken(markdown) {
  return String(markdown || '')
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[✓✗•—]/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 900);
}

export function jarvisOpenLine(user) {
  return `Good ${timeOfDayGreeting()}, ${principalName(user)}. Revan online.`;
}

function timeOfDayGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export function attachSpoken(message, user) {
  if (!message?.content) return message;
  const spoken = markdownToSpoken(message.content);
  const prefix = jarvisOpenLine(user);
  return {
    ...message,
    spoken: spoken.length > 40 ? `${prefix} ${spoken}` : `${prefix} ${spoken || 'At your service.'}`,
  };
}