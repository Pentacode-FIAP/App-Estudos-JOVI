// Local-date formatter shared across the app.
// Deliberately NOT using `new Date().toISOString().slice(0, 10)`: that computes
// the date in UTC, while date-only fields (e.g. db.eventos' `data`) are compared
// and grouped as local YYYY-MM-DD strings. Using toISOString() would mismatch
// near midnight in negative UTC-offset timezones (e.g. Brazil, UTC-3), wrongly
// excluding an event/photo happening today or wrongly including a past one.
export function dataLocal(d: Date): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}
